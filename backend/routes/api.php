<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\JobSeekerController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\ResumeController;
use Illuminate\Support\Facades\Route;

Route::post('/recruiter/register', [AuthController::class, 'registerRecruiter']);
Route::post('/register', [AuthController::class, 'registerRecruiter']);
Route::post('/user/register', [AuthController::class, 'registerJobSeeker']);
Route::post('/recruiter/login', [AuthController::class, 'recruiterLogin']);
Route::post('/user/login', [AuthController::class, 'jobSeekerLogin']);
Route::get('/public/jobs', [JobController::class, 'publicIndex']);
Route::get('/public/jobs/{job}', [JobController::class, 'showPublic']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [JobSeekerController::class, 'profile']);
    Route::put('/profile', [JobSeekerController::class, 'updateProfile']);
});

Route::middleware(['auth:sanctum', 'role:job_seeker,candidate'])->prefix('user')->group(function () {
    Route::post('/resumes', [JobSeekerController::class, 'uploadResume']);
    Route::get('/resumes/{candidate}/download', [JobSeekerController::class, 'downloadResume']);
    Route::get('/recommendations', [JobSeekerController::class, 'recommendations']);
    Route::get('/applications', [JobSeekerController::class, 'applications']);
    Route::post('/applications/{application}/accept-offer', [JobSeekerController::class, 'acceptOffer']);
    Route::post('/applications/{application}/reject-offer', [JobSeekerController::class, 'rejectOffer']);
    Route::post('/jobs/{job}/apply', [JobSeekerController::class, 'apply']);
});

Route::middleware(['auth:sanctum', 'role:hr'])->group(function () {
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    Route::post('/upload-resume', [ResumeController::class, 'upload']);
    Route::get('/resumes/{candidate}/status', [ResumeController::class, 'status']);

    Route::get('/jobs', [JobController::class, 'index']);
    Route::post('/jobs', [JobController::class, 'store']);
    Route::put('/jobs/{job}', [JobController::class, 'update']);
    Route::delete('/jobs/{job}', [JobController::class, 'destroy']);

    Route::get('/candidates', [CandidateController::class, 'index']);
    Route::get('/candidates/{candidate}', [CandidateController::class, 'show']);
    Route::patch('/candidates/{candidate}/notes', [CandidateController::class, 'updateNotes']);
    Route::delete('/candidates/{candidate}', [CandidateController::class, 'destroy']);
    Route::get('/candidates/{candidate}/resume', [ApplicationController::class, 'downloadResume']);
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::patch('/applications/{application}', [ApplicationController::class, 'update']);

    Route::get('/matches', [ResumeController::class, 'matches']);
    Route::get('/candidates/{candidate}/matches', [ResumeController::class, 'matchesForCandidate']);
});
