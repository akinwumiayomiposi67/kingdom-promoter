<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;

class PaystackService
{
    private function paystackRequest()
    {
        return Http::withToken(config('paystack.secret_key'))->acceptJson();
    }

    public function createCustomer(User $user): array
    {
        $nameParts = explode(' ', $user->name);
        $firstName = $nameParts[0];
        $lastName  = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : $user->name;

        $response = $this->paystackRequest()->post('https://api.paystack.co/customer', [
            'email'      => $user->email,
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'phone'      => $user->phone,
        ]);

        return $response->json('data', []);
    }

    public function createDedicatedVirtualAccount(string $customerCode): array
    {
        $response = $this->paystackRequest()->post('https://api.paystack.co/dedicated_account', [
            'customer'       => $customerCode,
            'preferred_bank' => config('paystack.preferred_bank'),
        ]);

        return $response->json('data', []);
    }
}
