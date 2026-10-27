<?php

namespace Tests\Feature;

use App\Models\Job;
use App\Models\User;
use Database\Seeders\DemoJobSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoJobSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_250_open_demo_jobs_without_duplicates_on_rerun(): void
    {
        User::factory()->create(['role' => 'hr']);

        $seeder = app(DemoJobSeeder::class);
        $seeder->run();
        $seeder->run();

        $this->assertSame(250, Job::where('title', 'like', 'Demo:%')->count());
        $this->assertSame(250, Job::where('title', 'like', 'Demo:%')->where('status', 'open')->count());
        $this->assertSame(250, Job::where('title', 'like', 'Demo:%')->distinct('title')->count('title'));
    }
}
