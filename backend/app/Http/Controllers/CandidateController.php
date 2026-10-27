<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CandidateController extends Controller
{
    public function index(Request $request)
    {
        $query = Candidate::where(function ($candidates) use ($request) {
            $candidates->where('user_id', $request->user()->id)
                ->orWhereHas('applications.job', fn ($jobs) => $jobs->where('user_id', $request->user()->id));
        })->with(['matches.job', 'applications' => fn ($applications) => $applications
            ->whereHas('job', fn ($jobs) => $jobs->where('user_id', $request->user()->id))
            ->with('job:id,title')])
            ->orderByDesc('ai_match_percentage');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('parsed_name', 'like', "%{$search}%")
                    ->orWhere('parsed_email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            if (in_array($status, ['applied', 'shortlisted', 'rejected', 'interview'], true)) {
                $query->whereHas('applications', fn ($applications) => $applications
                    ->where('status', $status)
                    ->whereHas('job', fn ($jobs) => $jobs->where('user_id', $request->user()->id)));
            } else {
                $query->where('status', $status);
            }
        }

        if ($jobId = $request->query('job_id')) {
            $query->whereHas('applications', fn ($applications) => $applications
                ->where('job_id', $jobId)
                ->whereHas('job', fn ($jobs) => $jobs->where('user_id', $request->user()->id)));
        }

        if ($minScore = $request->query('min_score')) {
            $query->where('ai_match_percentage', '>=', (int) $minScore);
        }

        $candidates = $query->paginate((int) $request->query('per_page', 12));

        return response()->json($candidates);
    }

    public function show(Request $request, Candidate $candidate)
    {
        if ($candidate->user_id !== $request->user()->id && !$candidate->applications()
            ->whereHas('job', fn ($jobs) => $jobs->where('user_id', $request->user()->id))
            ->exists()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $candidate->load(['matches.job']);

        return response()->json(['candidate' => $candidate]);
    }

    public function updateNotes(Request $request, Candidate $candidate)
    {
        if ($candidate->user_id !== $request->user()->id && !$candidate->applications()
            ->whereHas('job', fn ($jobs) => $jobs->where('user_id', $request->user()->id))
            ->exists()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validator = Validator::make($request->all(), [
            'hr_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $candidate->update(['hr_notes' => $request->hr_notes]);

        return response()->json(['candidate' => $candidate]);
    }
}
