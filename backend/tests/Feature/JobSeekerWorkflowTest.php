<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Candidate;
use App\Models\Job;
use App\Models\Matches;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class JobSeekerWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_seeker_can_update_profile_and_get_skill_based_recommendations(): void
    {
        $seeker = User::factory()->create(['role' => 'job_seeker']);
        $job = $this->createJob(['React', 'PHP']);

        $this->actingAs($seeker)->putJson('/api/profile', [
            'headline' => 'Frontend engineer',
            'skills' => ['React', 'JavaScript'],
            'preferred_job_titles' => ['Frontend Engineer'],
        ])->assertOk()->assertJsonPath('user.headline', 'Frontend engineer');

        $this->actingAs($seeker)->getJson('/api/user/recommendations')
            ->assertOk()
            ->assertJsonPath('recommendations.0.job.id', $job->id)
            ->assertJsonPath('recommendations.0.match_percentage', 50)
            ->assertJsonPath('recommendations.0.matched_skills.0', 'React')
            ->assertJsonPath('recommendations.0.missing_skills.0', 'Php');
    }

    public function test_job_seeker_can_apply_and_recruiter_can_update_application_and_schedule_interview(): void
    {
        $seeker = User::factory()->create(['role' => 'job_seeker']);
        $recruiter = User::factory()->create(['role' => 'hr']);
        $job = $this->createJob(['React', 'PHP'], $recruiter);
        $candidate = Candidate::create([
            'user_id' => $seeker->id,
            'resume_path' => 'resumes/seeker.pdf',
            'resume_text' => 'Experienced React developer and PHP engineer.',
            'extracted_skills_json' => ['React', 'Php'],
            'status' => 'done',
        ]);

        $applicationResponse = $this->actingAs($seeker)->postJson("/api/user/jobs/{$job->id}/apply");
        $applicationResponse->assertCreated()
            ->assertJsonPath('application.status', 'applied')
            ->assertJsonPath('match.match_percentage', 100);

        $application = Application::firstOrFail();
        $this->assertSame($candidate->id, $application->candidate_id);
        $this->assertSame($seeker->id, $application->user_id);

        $scheduledAt = now()->addDays(2)->startOfHour();
        $this->actingAs($recruiter)->patchJson("/api/applications/{$application->id}", [
            'status' => 'interview',
            'interview_at' => $scheduledAt->toIso8601String(),
            'interview_notes' => 'Video call link will be shared by email.',
        ])->assertOk()->assertJsonPath('application.status', 'interview');

        $this->actingAs($seeker)->getJson('/api/user/applications')
            ->assertOk()
            ->assertJsonPath('applications.0.status', 'interview')
            ->assertJsonPath('applications.0.interview_notes', 'Video call link will be shared by email.');

        $this->actingAs($seeker)->postJson("/api/user/jobs/{$job->id}/apply")
            ->assertStatus(409);
    }

    public function test_recruiter_can_download_only_resume_files_for_their_applicants(): void
    {
        Storage::fake('local');
        $seeker = User::factory()->create(['role' => 'job_seeker']);
        $recruiter = User::factory()->create(['role' => 'hr']);
        $otherRecruiter = User::factory()->create(['role' => 'hr']);
        $job = $this->createJob(['React'], $recruiter);
        $candidate = Candidate::create([
            'user_id' => $seeker->id,
            'resume_path' => 'resumes/private-resume.pdf',
            'resume_text' => 'React engineer.',
            'status' => 'done',
        ]);
        Storage::disk('local')->put($candidate->resume_path, 'private resume bytes');
        Application::create([
            'user_id' => $seeker->id,
            'candidate_id' => $candidate->id,
            'job_id' => $job->id,
            'status' => 'applied',
        ]);

        $this->actingAs($recruiter)->get("/api/candidates/{$candidate->id}/resume")
            ->assertOk()
            ->assertDownload("resume-{$candidate->id}.pdf");
        $this->actingAs($otherRecruiter)->getJson("/api/candidates/{$candidate->id}/resume")
            ->assertForbidden();
    }

    public function test_recruiter_can_manually_approve_a_low_match_candidate(): void
    {
        $seeker = User::factory()->create(['role' => 'job_seeker']);
        $recruiter = User::factory()->create(['role' => 'hr']);
        $job = $this->createJob(['React'], $recruiter);
        $candidate = Candidate::create([
            'user_id' => $seeker->id,
            'resume_path' => 'resumes/low-match.pdf',
            'status' => 'done',
            'ai_match_percentage' => 30,
        ]);
        $application = Application::create([
            'user_id' => $seeker->id,
            'candidate_id' => $candidate->id,
            'job_id' => $job->id,
            'status' => 'applied',
        ]);
        Matches::create([
            'candidate_id' => $candidate->id,
            'job_id' => $job->id,
            'match_percentage' => 30,
        ]);

        $this->actingAs($recruiter)->patchJson("/api/applications/{$application->id}", [
            'status' => 'shortlisted',
        ])->assertOk()->assertJsonPath('application.status', 'shortlisted');

        $this->actingAs($seeker)->getJson('/api/user/applications')
            ->assertOk()
            ->assertJsonPath('applications.0.status', 'shortlisted');

        $scheduledAt = now()->addDays(3)->startOfHour();
        $this->actingAs($recruiter)->patchJson("/api/applications/{$application->id}", [
            'status' => 'interview',
            'interview_at' => $scheduledAt->toIso8601String(),
            'interview_notes' => 'Interview invitation and meeting details.',
        ])->assertOk()->assertJsonPath('application.status', 'interview');

        $this->actingAs($seeker)->getJson('/api/user/applications')
            ->assertOk()
            ->assertJsonPath('applications.0.status', 'interview')
            ->assertJsonPath('applications.0.interview_notes', 'Interview invitation and meeting details.');

        $this->actingAs($recruiter)->patchJson("/api/applications/{$application->id}", [
            'status' => 'rejected',
        ])->assertOk()->assertJsonPath('application.status', 'rejected');

        $this->actingAs($seeker)->getJson('/api/user/applications')
            ->assertOk()
            ->assertJsonPath('applications.0.status', 'rejected')
            ->assertJsonPath('applications.0.interview_at', null);
    }

    public function test_resume_upload_rejects_pdf_mime_with_a_non_pdf_extension(): void
    {
        Storage::fake('local');
        $recruiter = User::factory()->create(['role' => 'hr']);

        $this->actingAs($recruiter)->post('/api/upload-resume', [
            'resume' => UploadedFile::fake()->create('resume.txt', 10, 'application/pdf'),
        ])->assertUnprocessable();
    }

    private function createJob(array $skills, ?User $recruiter = null): Job
    {
        $recruiter ??= User::factory()->create(['role' => 'hr']);

        return Job::create([
            'user_id' => $recruiter->id,
            'title' => 'Frontend Engineer',
            'description' => 'Build a product interface.',
            'required_skills_json' => $skills,
            'status' => 'open',
        ]);
    }
}
