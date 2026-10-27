<?php

namespace App\Services;

class LocalAiMatcher
{
    private const KNOWN_SKILLS = [
        'react', 'javascript', 'typescript', 'html', 'css', 'laravel', 'php', 'python',
        'machine learning', 'nlp', 'django', 'flask', 'sql', 'mysql', 'postgresql',
        'docker', 'kubernetes', 'aws', 'tailwind', 'node.js', 'node', 'java',
        'c++', 'c#', '.net', 'ruby', 'rails', 'go', 'rust', 'vue', 'angular',
        'next.js', 'nextjs', 'express', 'rest api', 'graphql', 'git', 'linux',
        'terraform', 'azure', 'gcp', 'redis', 'mongodb', 'pandas', 'numpy',
        'scikit-learn', 'tensorflow', 'pytorch', 'power bi', 'tableau', 'excel',
        'figma', 'agile', 'scrum', 'project management', 'communication',
        'data analysis', 'deep learning', 'devops', 'ci/cd', 'cybersecurity',
    ];

    public function match(string $resumeText, string $jobTitle, string $jobDescription, array $requiredSkills = []): array
    {
        $skills = $this->extractSkills($resumeText);
        $contact = $this->extractContact($resumeText);

        $required = array_map('strtolower', $requiredSkills);
        if (empty($required)) {
            $required = $this->extractSkills($jobTitle . "\n" . $jobDescription);
            $required = array_map('strtolower', $required);
        }
        $matched = [];
        $missing = [];
        foreach ($required as $skill) {
            if ($this->containsSkill($resumeText, $skill)) {
                $matched[] = ucfirst($skill);
                $skills[] = ucfirst($skill);
            } else {
                $missing[] = ucfirst($skill);
            }
        }
        $skills = array_values(array_unique($skills));

        $matchPercentage = empty($required)
            ? 0
            : (int) round((count($matched) / count($required)) * 100);
        $lines = array_values(array_filter(array_map('trim', preg_split('/\R/', $resumeText))));
        $education = array_values(array_filter($lines, fn ($line) => preg_match('/\b(bachelor|master|ph\.?d|degree|diploma|university|college|certification|certified)\b/i', $line)));
        $experience = array_values(array_filter($lines, fn ($line) => preg_match('/\b(experience|professional|employment|engineer|developer|manager|analyst|intern|years?\s+of)\b/i', $line)));

        return [
            'name' => $contact['name'],
            'email' => $contact['email'],
            'phone' => $contact['phone'],
            'skills' => $skills,
            'education' => array_slice($education, 0, 8),
            'experience' => array_slice($experience, 0, 8),
            'match_percentage' => $matchPercentage,
            'match_explanation' => empty($required)
                ? 'A skill score is unavailable because this job has no explicit or recognized skill requirements.'
                : count($matched) . ' of ' . count($required) . ' identified job skills appear in the resume.',
            'rank' => 1,
            'skill_comparison' => [
                'matched' => $matched,
                'missing' => $missing,
                'extracted' => $skills,
            ],
            'interview_questions' => $this->interviewQuestions($skills, $jobTitle),
            'fallback' => true,
        ];
    }

    private function extractSkills(string $text): array
    {
        $lower = strtolower($text);
        $found = [];
        foreach (self::KNOWN_SKILLS as $skill) {
            if ($this->containsSkill($lower, $skill)) {
                $found[] = ucfirst($skill);
            }
        }

        return array_values(array_unique($found));
    }

    private function containsSkill(string $text, string $skill): bool
    {
        $pattern = '/(?<![a-z0-9])' . preg_quote($skill, '/') . '(?![a-z0-9])/i';

        return preg_match($pattern, $text) === 1;
    }

    private function extractContact(string $text): array
    {
        $name = null;
        $email = null;
        $phone = null;

        if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $text, $m)) {
            $email = $m[0];
        }
        if (preg_match('/(\+?\d[\d\s().-]{8,}\d)/', $text, $m)) {
            $phone = trim($m[0]);
        }

        foreach (preg_split('/\R/', $text) as $line) {
            $line = trim($line);
            if ($line === '' || str_contains($line, '@')) {
                continue;
            }
            $words = preg_split('/\s+/', $line);
            if ($words && count($words) >= 2 && count($words) <= 5 && strlen($line) < 60) {
                $name = $line;
                break;
            }
        }

        return compact('name', 'email', 'phone');
    }

    private function interviewQuestions(array $skills, string $jobTitle): array
    {
        $questions = [
            "Describe your experience relevant to the {$jobTitle} role.",
            'Tell us about a challenging project and how you delivered it.',
        ];
        foreach (array_slice($skills, 0, 3) as $skill) {
            $questions[] = "How have you used {$skill} in production?";
        }

        return $questions;
    }
}
