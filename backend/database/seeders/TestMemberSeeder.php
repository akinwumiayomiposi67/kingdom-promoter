<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;

class TestMemberSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'member@test.com'],
            [
                'name'     => 'Test Member',
                'phone'    => '08012345678',
                'password' => 'password123',
                'role'     => 'member',
                'status'   => 'active',
            ]
        );

        // Create wallet if not already present
        Wallet::firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0.00]
        );
    }
}
