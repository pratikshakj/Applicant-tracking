<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Candidate;
use App\Models\Job;
use App\Models\Matches;
use App\Models\User;
use App\Services\LocalAiMatcher;
use App\Services\ResumeParserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class JobSeekerController extends Controller
{
    public function __construct(
        private ResumeParserService $resumeParser,
        private LocalAiMatcher $matcher,
    ) {
    }

    public function profile(Request $request)
    {
        $user = $request->user();
        $latestResume = Candidate::where('user_id', $user->id)
            ->latest()
            ->first(['id', 'status', 'parsed_name', 'parsed_email', 'parsed_phone', 'parsed_education_json', 'parsed_experience_json', 'extracted_skills_json', 'created_at', 'error']);

        return response()->json([
            'user' => $user,
            'latest_resume' => $latestResume,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $rules = [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'headline' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:5000'],
            'skills' => ['sometimes', 'array', 'max:50'],
            'skills.*' => ['string', 'max:80'],
            'preferred_job_titles' => ['sometimes', 'array', 'max:20'],
            'preferred_job_titles.*' => ['string', 'max:120'],
            'preferred_location' => ['nullable', 'string', 'max:255'],
        ];

        if ($request->user()->role === 'hr') {
            $rules['company_name'] = ['nullable', 'string', 'max:255'];
            $rules['company_website'] = ['nullable', 'url', 'max:255'];
        }

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        if (array_key_exists('skills', $data)) {
            $data['skills_json'] = $this->normalizeList($data['skills']);
            unset($data['skills']);
        }
        if (array_key_exists('preferred_job_titles', $data)) {
            $data['preferred_job_titles_json'] = $this->normalizeList($data['preferred_job_titles']);
            unset($data['preferred_job_titles']);
        }

        $request->user()->update($data);

        return response()->json(['user' => $request->user()->fresh()]);
    }

    public function uploadResume(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'resume' => ['required', 'file', 'mimes:pdf,doc,docx', 'extensions:pdf,doc,docx', 'max:10240'],
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $file = $request->file('resume');
        $path = $file->store('resumes', 'local');

        try {
            $text = $this->resumeParser->extractText(Storage::disk('local')->path($path), $file->getClientOriginalExtension());
            if (trim($text) === '') {
                Storage::disk('local')->delete($path);

                return response()->json(['message' => 'No readable text was found in this resume. Upload a text-based PDF or Word document.'], 422);
            }

            $candidate = Candidate::create([
                'user_id' => $request->user()->id,
                'resume_path' => $path,
                'resume_text' => $text,
                'status' => 'done',
            ]);

            $analysis = $this->matcher->match($text, '', '', []);
            $skills = $analysis['skills'];
            $candidate->update([
                'parsed_name' => $analysis['name'] ?? $request->user()->name,
                'parsed_email' => $analysis['email'] ?? $request->user()->email,
                'parsed_phone' => $analysis['phone'],
                'parsed_education_json' => $analysis['education'],
                'parsed_experience_json' => $analysis['experience'],
                'extracted_skills_json' => $skills,
            ]);

            $request->user()->update([
                'skills_json' => array_values(array_unique(array_merge($request->user()->skills_json ?? [], $skills))),
            ]);

            return response()->json([
                'message' => 'Resume analyzed using its extracted text.',
                'candidate' => $candidate->fresh(['matches.job']),
            ], 201);
        } catch (\Throwable $exception) {
            Storage::disk('local')->delete($path);
            report($exception);

            return response()->json(['message' => 'The resume could not be read. Check that the file is a valid PDF or Word document and try again.'], 422);
        }
    }

    public function recommendations(Request $request)
    {
        $user = $request->user();
        $profile = mb_strtolower(implode(' ', array_merge(
            $user->preferred_job_titles_json ?? [],
            [$user->headline ?? '', $user->preferred_location ?? '', $user->location ?? ''],
        )));
        $latestResume = Candidate::where('user_id', $user->id)->latest()->first();
        $skills = array_values(array_unique(array_merge(
            array_map('strtolower', $user->skills_json ?? []),
            array_map('strtolower', $latestResume?->extracted_skills_json ?? []),
        )));
        $appliedIds = Application::where('user_id', $user->id)->pluck('job_id')->all();

        $recommendations = Job::where('status', 'open')
            ->with('user:id,company_name')
            ->latest()
            ->get()
            ->reject(fn (Job $job) => in_array($job->id, $appliedIds, true))
            ->map(function (Job $job) use ($skills, $profile) {
                $analysis = $this->matcher->match(
                    implode(' ', $skills),
                    $job->title,
                    $job->description . ' ' . ($job->experience_requirements ?? ''),
                    $job->required_skills_json ?? [],
                );
                $matched = $analysis['skill_comparison']['matched'];
                $missing = $analysis['skill_comparison']['missing'];
                $titleRelevant = $profile !== '' && mb_stripos($profile, $job->title) !== false;
                $score = $analysis['match_percentage'];
                $reasons = [];
                if ($matched !== []) {
                    $reasons[] = 'Your profile includes ' . implode(', ', $matched) . '.';
                }
                if ($titleRelevant) {
                    $reasons[] = 'This role title aligns with a job title you selected.';
                }
                if ($reasons === []) {
                    $reasons[] = 'No profile skills currently match the listed requirements.';
                }

                return [
                    'job' => $job,
                    'match_percentage' => $score,
                    'matched_skills' => $matched,
                    'missing_skills' => $missing,
                    'reasons' => $reasons,
                ];
            })
            ->sortByDesc('match_percentage')
            ->values()
            ->take(30);

        return response()->json([
            'recommendations' => $recommendations,
            'profile_skills' => $skills,
            'message' => $skills === [] ? 'Add profile skills or upload a resume to personalize recommendations.' : null,
        ]);
    }

    public function applications(Request $request)
    {
        $applications = Application::with([
            'job.user:id,company_name,location',
            'job:id,user_id,title,department,employment_type,description,required_skills_json,experience_requirements,status',
            'candidate:id,parsed_name,extracted_skills_json,status,resume_path',
        ])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['applications' => $applications]);
    }

    public function apply(Request $request, Job $job)
    {
        if ($job->status !== 'open') {
            return response()->json(['message' => 'This job is no longer accepting applications.'], 422);
        }

        if (Application::where('user_id', $request->user()->id)->where('job_id', $job->id)->exists()) {
            return response()->json(['message' => 'You have already applied for this job.'], 409);
        }

        $candidate = null;

        // Check if a new resume was uploaded directly during application
        if ($request->hasFile('resume')) {
            $validator = Validator::make($request->all(), [
                'resume' => ['required', 'file', 'mimes:pdf,doc,docx', 'extensions:pdf,doc,docx', 'max:10240'],
            ]);
            if ($validator->fails()) {
                return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
            }

            $file = $request->file('resume');
            $path = $file->store('resumes', 'local');

            try {
                $text = $this->resumeParser->extractText(Storage::disk('local')->path($path), $file->getClientOriginalExtension());
                if (trim($text) === '') {
                    Storage::disk('local')->delete($path);
                    return response()->json(['message' => 'No readable text was found in the uploaded resume.'], 422);
                }

                $candidate = Candidate::create([
                    'user_id' => $request->user()->id,
                    'resume_path' => $path,
                    'resume_text' => $text,
                    'status' => 'done',
                ]);

                $analysis = $this->matcher->match($text, '', '', []);
                $skills = $analysis['skills'] ?? [];
                $candidate->update([
                    'parsed_name' => $analysis['name'] ?? $request->user()->name,
                    'parsed_email' => $analysis['email'] ?? $request->user()->email,
                    'parsed_phone' => $analysis['phone'] ?? null,
                    'parsed_education_json' => $analysis['education'] ?? [],
                    'parsed_experience_json' => $analysis['experience'] ?? [],
                    'extracted_skills_json' => $skills,
                ]);

                if (!empty($skills)) {
                    $request->user()->update([
                        'skills_json' => array_values(array_unique(array_merge($request->user()->skills_json ?? [], $skills))),
                    ]);
                }
            } catch (\Throwable $exception) {
                Storage::disk('local')->delete($path);
                report($exception);
                return response()->json(['message' => 'The uploaded resume could not be processed.'], 422);
            }
        } else {
            // Use existing profile resume
            $candidate = Candidate::where('user_id', $request->user()->id)
                ->where('status', 'done')
                ->latest()
                ->first();

            if (!$candidate) {
                return response()->json(['message' => 'No profile resume found. Please upload a resume to apply.'], 422);
            }
        }

        $payload = $this->matcher->match(
            $candidate->resume_text ?? '',
            $job->title,
            $job->description,
            $job->required_skills_json ?? [],
        );
        $match = Matches::updateOrCreate(
            ['candidate_id' => $candidate->id, 'job_id' => $job->id],
            [
                'match_percentage' => $payload['match_percentage'],
                'status' => 'needs_review',
                'skill_comparison_json' => $payload['skill_comparison'],
                'raw_json' => $payload,
            ],
        );

        $newScore = (int) ($payload['match_percentage'] ?? 0);
        if ($newScore > (int) $candidate->ai_match_percentage) {
            $candidate->update(['ai_match_percentage' => $newScore]);
        }
        $application = Application::create([
            'user_id' => $request->user()->id,
            'candidate_id' => $candidate->id,
            'job_id' => $job->id,
            'status' => 'applied',
        ]);

        return response()->json([
            'application' => $application->load(['job.user:id,company_name', 'candidate:id,parsed_name']),
            'match' => $match,
        ], 201);
    }

    public function acceptOffer(Request $request, Application $application)
    {
        abort_unless($application->user_id === $request->user()->id, 403);

        if ($application->status !== 'cleared') {
            return response()->json(['message' => 'This application is not in cleared status.'], 422);
        }

        if ($application->offer_accepted_at) {
            return response()->json(['message' => 'Offer letter has already been accepted.'], 422);
        }

        if ($application->offer_declined_at) {
            return response()->json(['message' => 'Offer letter was previously declined.'], 422);
        }

        $application->update([
            'offer_accepted_at' => now(),
            'offer_declined_at' => null,
            'offer_decline_reason' => null,
        ]);

        return response()->json([
            'message' => 'Congratulations! You have accepted the offer letter.',
            'application' => $application->fresh()->load(['job.user:id,company_name', 'candidate:id,parsed_name']),
        ]);
    }

    public function rejectOffer(Request $request, Application $application)
    {
        abort_unless($application->user_id === $request->user()->id, 403);

        if ($application->status !== 'cleared') {
            return response()->json(['message' => 'This application does not have an active offer to reject.'], 422);
        }

        if ($application->offer_accepted_at) {
            return response()->json(['message' => 'Offer letter has already been accepted and cannot be rejected.'], 422);
        }

        $application->update([
            'offer_declined_at' => now(),
            'offer_decline_reason' => $request->input('reason', 'Candidate declined offer terms.'),
        ]);

        return response()->json([
            'message' => 'You have declined the offer letter.',
            'application' => $application->fresh()->load(['job.user:id,company_name', 'candidate:id,parsed_name']),
        ]);
    }

    public function downloadResume(Request $request, Candidate $candidate)
    {
        abort_unless($candidate->user_id === $request->user()->id, 403);

        return Storage::disk('local')->download($candidate->resume_path, 'resume-' . $candidate->id . '.' . pathinfo($candidate->resume_path, PATHINFO_EXTENSION));
    }

    private function normalizeList(array $values): array
    {
        return array_values(array_unique(array_filter(array_map('trim', $values))));
    }
}
