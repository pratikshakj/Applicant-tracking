<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    protected $fillable = [
        'user_id',
        'candidate_id',
        'job_id',
        'status',
        'shortlisted_at',
        'notes',
        'interview_at',
        'interview_notes',
        'joining_date',
        'joining_location',
        'offer_letter_text',
        'offer_accepted_at',
        'offer_declined_at',
        'offer_decline_reason',
    ];

    protected function casts(): array
    {
        return [
            'shortlisted_at' => 'datetime',
            'interview_at' => 'datetime',
            'joining_date' => 'date',
            'offer_accepted_at' => 'datetime',
            'offer_declined_at' => 'datetime',
        ];
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function job(): BelongsTo
    {
        return $this->belongsTo(Job::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
