<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $query = Application::with([
            'candidate:id,user_id,resume_path,status,parsed_name,parsed_email,parsed_phone,extracted_skills_json,parsed_education_json,parsed_experience_json,ai_match_percentage,hr_notes',
            'job:id,user_id,title,department,employment_type,description,required_skills_json,status',
        ])->whereHas('job', fn ($jobs) => $jobs->where('user_id', $request->user()->id));

        if ($jobId = $request->query('job_id')) {
            $query->where('job_id', $jobId);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json(['applications' => $query->latest()->get()]);
    }

    public function update(Request $request, Application $application)
    {
        abort_unless($application->job()->where('user_id', $request->user()->id)->exists(), 403);

        $validator = Validator::make($request->all(), [
            'status' => ['sometimes', 'required', 'in:applied,shortlisted,interview,cleared,rejected'],
            'interview_at' => ['required_if:status,interview', 'nullable', 'date'],
            'interview_notes' => ['nullable', 'string', 'max:3000'],
            'joining_date' => ['nullable', 'date'],
            'joining_location' => ['nullable', 'string', 'max:255'],
            'offer_letter_text' => ['nullable', 'string', 'max:20000'],
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $updates = $validator->validated();
        if (in_array($updates['status'] ?? null, ['shortlisted', 'interview', 'cleared'], true) && !$application->shortlisted_at) {
            $updates['shortlisted_at'] = now();
        }
        if (($updates['status'] ?? null) === 'rejected') {
            $updates['interview_at'] = null;
            $updates['interview_notes'] = null;
        }
        $application->update($updates);

        return response()->json(['application' => $application->fresh()->load(['candidate', 'job'])]);
    }

    public function downloadResume(Request $request, Candidate $candidate)
    {
        $authorized = $candidate->applications()
            ->whereHas('job', fn ($jobs) => $jobs->where('user_id', $request->user()->id))
            ->exists();
        abort_unless($authorized || $candidate->user_id === $request->user()->id, 403);

        return Storage::disk('local')->download(
            $candidate->resume_path,
            'resume-' . $candidate->id . '.' . pathinfo($candidate->resume_path, PATHINFO_EXTENSION),
        );
    }
}
