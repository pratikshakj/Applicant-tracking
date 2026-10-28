<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Candidate;
use App\Models\Job;
use App\Models\Matches;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $userId = $request->user()->id;

        $totalCandidates = Candidate::where('user_id', $userId)
            ->orWhereHas('applications.job', fn ($jobs) => $jobs->where('user_id', $userId))
            ->distinct()
            ->count('id');
        $totalJobs = Job::where('user_id', $userId)->count();
        $totalMatches = Matches::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))->count();
        $shortlisted = Application::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))
            ->where(function ($query) {
                $query->whereNotNull('shortlisted_at')
                    ->orWhereIn('status', ['shortlisted', 'interview', 'cleared'])
                    ->orWhereNotNull('interview_at')
                    ->orWhereNotNull('offer_letter_text')
                    ->orWhereNotNull('joining_date');
            })->count();

        $avgMatch = (int) Matches::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))
            ->avg('match_percentage');

        $recentActivities = Candidate::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)
              ->orWhereHas('applications.job', fn ($jobs) => $jobs->where('user_id', $userId));
        })
        ->with(['matches' => fn ($q) => $q->whereHas('job', fn ($j) => $j->where('user_id', $userId))])
        ->latest()
        ->limit(8)
        ->get(['id', 'parsed_name', 'status', 'ai_match_percentage', 'created_at'])
        ->map(function ($c) {
            $score = (int) $c->ai_match_percentage;
            if ($score === 0 && $c->matches && $c->matches->isNotEmpty()) {
                $score = (int) $c->matches->max('match_percentage');
                $c->ai_match_percentage = $score;
            }
            return $c;
        });

        // 6-month hiring and job posting analytics
        $monthsTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $start = (clone $monthDate)->startOfMonth();
            $end = (clone $monthDate)->endOfMonth();

            $jobsCount = Job::where('user_id', $userId)
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $appsCount = Application::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $hiredCount = Application::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))
                ->where('status', 'cleared')
                ->whereBetween('updated_at', [$start, $end])
                ->count();

            $shortlistedInMonth = Application::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))
                ->where(function ($q) {
                    $q->whereNotNull('shortlisted_at')
                      ->orWhereIn('status', ['shortlisted', 'interview', 'cleared']);
                })
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $monthsTrend[] = [
                'period' => $monthDate->format('M Y'),
                'short' => $monthDate->format('M'),
                'jobs_posted' => $jobsCount,
                'applications' => $appsCount,
                'shortlisted' => $shortlistedInMonth,
                'hired' => $hiredCount,
            ];
        }

        // 7-day hiring and job posting analytics
        $daysTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $dayDate = now()->subDays($i);
            $start = (clone $dayDate)->startOfDay();
            $end = (clone $dayDate)->endOfDay();

            $jobsDay = Job::where('user_id', $userId)
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $appsDay = Application::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $hiredDay = Application::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))
                ->where('status', 'cleared')
                ->whereBetween('updated_at', [$start, $end])
                ->count();

            $daysTrend[] = [
                'period' => $dayDate->format('D, M j'),
                'short' => $dayDate->format('D'),
                'jobs_posted' => $jobsDay,
                'applications' => $appsDay,
                'hired' => $hiredDay,
            ];
        }

        $hiringTrend = Matches::query()
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $matchDistribution = [
            'excellent' => Matches::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))->where('match_percentage', '>=', 80)->count(),
            'good' => Matches::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))->whereBetween('match_percentage', [60, 79])->count(),
            'review' => Matches::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))->where('match_percentage', '<', 60)->count(),
        ];

        return response()->json([
            'stats' => [
                'total_candidates' => $totalCandidates,
                'total_jobs' => $totalJobs,
                'total_matches' => $totalMatches,
                'shortlisted' => $shortlisted,
                'avg_match_percentage' => $avgMatch,
                'applications' => Application::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))->count(),
                'hired' => Application::whereHas('job', fn ($jobs) => $jobs->where('user_id', $userId))->where('status', 'cleared')->count(),
            ],
            'recent_activities' => $recentActivities,
            'analytics' => [
                'months' => $monthsTrend,
                'days' => $daysTrend,
            ],
            'hiring_trend' => $hiringTrend,
            'match_distribution' => $matchDistribution,
        ]);
    }
}
