<?php

namespace Database\Seeders;

use App\Models\ContributionPackage;
use Illuminate\Database\Seeder;

class ContributionPackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            ['name' => 'Bronze',  'amount' => '10000.00', 'description' => 'Bronze tier monthly contribution'],
            ['name' => 'Silver',  'amount' => '20000.00', 'description' => 'Silver tier monthly contribution'],
            ['name' => 'Gold',    'amount' => '50000.00', 'description' => 'Gold tier monthly contribution'],
            ['name' => 'Diamond', 'amount' => '100000.00', 'description' => 'Diamond tier monthly contribution'],
        ];

        foreach ($packages as $package) {
            ContributionPackage::updateOrCreate(
                ['name' => $package['name']],
                [
                    'amount'      => $package['amount'],
                    'description' => $package['description'],
                    'is_active'   => true,
                ]
            );
        }
    }
}
