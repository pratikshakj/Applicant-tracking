<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('headline')->nullable();
            $table->string('location')->nullable();
            $table->text('bio')->nullable();
            $table->json('skills_json')->nullable();
            $table->json('preferred_job_titles_json')->nullable();
            $table->string('preferred_location')->nullable();
            $table->string('company_website')->nullable();
        });

        Schema::table('candidates', function (Blueprint $table) {
            $table->longText('resume_text')->nullable();
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->timestamp('interview_at')->nullable();
            $table->text('interview_notes')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['interview_at', 'interview_notes']);
        });

        Schema::table('candidates', function (Blueprint $table) {
            $table->dropColumn('resume_text');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'headline',
                'location',
                'bio',
                'skills_json',
                'preferred_job_titles_json',
                'preferred_location',
                'company_website',
            ]);
        });
    }
};
