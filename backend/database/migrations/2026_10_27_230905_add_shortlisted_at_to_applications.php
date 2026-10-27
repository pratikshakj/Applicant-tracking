<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->timestamp('shortlisted_at')->nullable()->after('status');
        });

        // Backfill existing applications that were shortlisted, interview, cleared, or had interview data
        DB::table('applications')
            ->whereIn('status', ['shortlisted', 'interview', 'cleared'])
            ->orWhereNotNull('interview_at')
            ->orWhereNotNull('offer_letter_text')
            ->update(['shortlisted_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn('shortlisted_at');
        });
    }
};
