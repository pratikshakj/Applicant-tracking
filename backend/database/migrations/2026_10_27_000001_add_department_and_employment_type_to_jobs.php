<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->string('department')->default('Other');
            $table->string('employment_type')->default('Full-time');
        });

        foreach ([
            'Software Engineering' => ['software engineer', 'frontend developer', 'backend developer', 'full stack developer', 'mobile app developer', 'database administrator'],
            'Product' => ['product manager'],
            'UI/UX Design' => ['product designer', 'ux researcher'],
            'Data & Analytics' => ['data analyst', 'financial analyst'],
            'AI & Machine Learning' => ['data scientist', 'machine learning'],
            'DevOps & Cloud' => ['devops engineer', 'cloud solutions architect'],
            'Cybersecurity' => ['cybersecurity analyst'],
            'Quality Assurance' => ['quality assurance engineer'],
            'Human Resources' => ['human resources specialist'],
            'Marketing' => ['digital marketing specialist', 'content strategist'],
            'Customer Success' => ['customer success manager'],
            'Sales' => ['sales development representative'],
            'Operations' => ['operations coordinator'],
            'Finance' => ['finance'],
        ] as $department => $titles) {
            foreach ($titles as $title) {
                DB::table('jobs')->where('title', 'like', '%' . $title . '%')->update(['department' => $department]);
            }
        }

        DB::table('jobs')->where('title', 'like', '%intern%')->update([
            'department' => 'Internships',
            'employment_type' => 'Internship',
        ]);
    }

    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->dropColumn(['department', 'employment_type']);
        });
    }
};
