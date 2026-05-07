<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@yourdomain.com')],
            [
                'name'     => env('ADMIN_NAME', 'KFC Admin'),
                'phone'    => env('ADMIN_PHONE'),
                'password' => env('ADMIN_PASSWORD', 'changeme'),
                'role'     => 'admin',
                'status'   => 'active',
            ]
        );
    }
}
