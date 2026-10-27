<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RecruiterLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_recruiter_can_sign_in_through_recruiter_endpoint(): void
    {
        $user = User::factory()->create([
            'email' => 'recruiter@example.com',
            'password' => Hash::make('recruiter-password'),
            'role' => 'hr',
        ]);

        $response = $this->postJson('/api/recruiter/login', [
            'email' => $user->email,
            'password' => 'recruiter-password',
        ]);

        $response->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.role', 'hr')
            ->assertJsonStructure(['user', 'token']);
    }

    public function test_non_recruiter_cannot_sign_in_through_recruiter_endpoint(): void
    {
        $user = User::factory()->create([
            'email' => 'candidate@example.com',
            'password' => Hash::make('candidate-password'),
            'role' => 'candidate',
        ]);

        $response = $this->postJson('/api/recruiter/login', [
            'email' => $user->email,
            'password' => 'candidate-password',
        ]);

        $response->assertUnauthorized()
            ->assertJsonPath('message', 'Invalid recruiter credentials')
            ->assertJsonMissingPath('token');
    }
}
