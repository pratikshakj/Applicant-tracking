<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            UPDATE candidates c
            INNER JOIN (
                SELECT candidate_id, MAX(match_percentage) AS max_score
                FROM matches
                GROUP BY candidate_id
            ) m ON c.id = m.candidate_id
            SET c.ai_match_percentage = m.max_score
            WHERE c.ai_match_percentage = 0 OR c.ai_match_percentage IS NULL
        ");
    }

    public function down(): void
    {
        // No reverse needed
    }
};

