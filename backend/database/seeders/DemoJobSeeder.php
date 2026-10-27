<?php

namespace Database\Seeders;

use App\Models\Job;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class DemoJobSeeder extends Seeder
{
    private const ROLES = [
        'Software Engineer',
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'Mobile App Developer',
        'Data Analyst',
        'Data Scientist',
        'Machine Learning Engineer',
        'DevOps Engineer',
        'Cloud Solutions Architect',
        'Cybersecurity Analyst',
        'Product Manager',
        'Product Designer',
        'UX Researcher',
        'Business Analyst',
        'Project Manager',
        'Quality Assurance Engineer',
        'Technical Writer',
        'Digital Marketing Specialist',
        'Content Strategist',
        'Customer Success Manager',
        'Sales Development Representative',
        'Human Resources Specialist',
        'Financial Analyst',
        'Operations Coordinator',
    ];

    private const SECTORS = [
        'FinTech',
        'HealthTech',
        'Education',
        'E-commerce',
        'Climate Technology',
        'Media',
        'Cybersecurity',
        'Logistics',
        'Enterprise Software',
        'Digital Services',
    ];

    private const SKILL_SETS = [
        ['PHP', 'Laravel', 'MySQL'],
        ['JavaScript', 'React', 'CSS'],
        ['Python', 'REST APIs', 'SQL'],
        ['TypeScript', 'Node.js', 'AWS'],
        ['Python', 'Pandas', 'Machine Learning'],
        ['Docker', 'AWS', 'CI/CD'],
        ['Figma', 'Prototyping', 'User Research'],
        ['SQL', 'Data Analysis', 'Communication'],
        ['Agile', 'Project Planning', 'Stakeholder Management'],
        ['Writing', 'Research', 'Communication'],
    ];

    public function run(): void
    {
        $recruiters = User::query()
            ->whereIn('role', ['hr', 'recruiter'])
            ->orderBy('id')
            ->get();

        if ($recruiters->isEmpty()) {
            throw new RuntimeException('Create a recruiter account before running DemoJobSeeder.');
        }

        $createdOrExisting = 0;
        foreach (self::ROLES as $roleIndex => $role) {
            foreach (self::SECTORS as $sectorIndex => $sector) {
                $recruiter = $recruiters[($roleIndex * count(self::SECTORS) + $sectorIndex) % $recruiters->count()];
                $title = "Demo: {$role} - {$sector}";
                $skills = self::SKILL_SETS[($roleIndex + $sectorIndex) % count(self::SKILL_SETS)];

                Job::firstOrCreate(
                    [
                        'user_id' => $recruiter->id,
                        'title' => $title,
                    ],
                    [
                        'description' => "Join a {$sector} team as a {$role}. You will collaborate with cross-functional colleagues, deliver practical solutions, communicate progress clearly, and help improve the products and services used by customers. This demo listing is sample data for local project demonstrations.",
                        'required_skills_json' => $skills,
                        'experience_requirements' => ['Entry level', '1-3 years', '3-5 years', '5+ years'][($roleIndex + $sectorIndex) % 4],
                        'status' => 'open',
                    ]
                );
                $createdOrExisting++;
            }
        }

        $this->command?->info("{$createdOrExisting} demo job listings are available (250 total; rerunning does not duplicate them).");
    }
}
