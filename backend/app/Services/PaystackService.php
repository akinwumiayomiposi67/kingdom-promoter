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
        $response = $this->paystackRequest()->post('https://api.paystack.co/customer', [
            'email'      => $user->email,
            'first_name' => explode(' ', $user->name)[0],
            'last_name'  => implode(' ', array_slice(explode(' ', $user->name), 1)) ?: $user->name,
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
