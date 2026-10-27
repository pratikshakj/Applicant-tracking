<?php

namespace Tests\Unit;

use App\Services\LocalAiMatcher;
use PHPUnit\Framework\TestCase;

class LocalAiMatcherTest extends TestCase
{
    public function test_score_uses_only_skills_found_in_resume_text(): void
    {
        $result = (new LocalAiMatcher())->match(
            'Built a React interface and maintained JavaScript components.',
            'Frontend Engineer',
            'Required skills include React, JavaScript, and PHP.',
            ['React', 'JavaScript', 'PHP'],
        );

        $this->assertSame(67, $result['match_percentage']);
        $this->assertSame(['React', 'Javascript'], $result['skill_comparison']['matched']);
        $this->assertSame(['Php'], $result['skill_comparison']['missing']);
        $this->assertSame('2 of 3 identified job skills appear in the resume.', $result['match_explanation']);
    }

    public function test_job_description_cannot_make_a_missing_resume_skill_match(): void
    {
        $result = (new LocalAiMatcher())->match(
            'Experienced designer with a portfolio of product screens.',
            'Frontend Engineer',
            'React and PHP are required for this role.',
            ['React', 'PHP'],
        );

        $this->assertSame(0, $result['match_percentage']);
        $this->assertSame([], $result['skill_comparison']['matched']);
        $this->assertSame(['React', 'Php'], $result['skill_comparison']['missing']);
    }

    public function test_substring_skill_names_are_not_counted_as_matches(): void
    {
        $result = (new LocalAiMatcher())->match(
            'I build JavaScript applications.',
            'Backend Engineer',
            'Java is required.',
            ['Java'],
        );

        $this->assertSame(0, $result['match_percentage']);
    }
}
