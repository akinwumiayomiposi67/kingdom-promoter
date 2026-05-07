<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function send(string $phone, string $message): bool
    {
        try {
            $normalized = $this->normalizePhone($phone);

            $response = Http::post('https://api.ng.termii.com/api/sms/send', [
                'to'      => $normalized,
                'from'    => env('TERMII_SENDER_ID'),
                'sms'     => $message,
                'type'    => 'plain',
                'channel' => 'generic',
                'api_key' => env('TERMII_API_KEY'),
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning("SmsService: Failed to send SMS to {$phone}: {$e->getMessage()}");
            return false;
        }
    }

    private function normalizePhone(string $phone): string
    {
        // Strip all non-digit characters
        $digits = preg_replace('/\D/', '', $phone);

        // Remove leading 234
        if (str_starts_with($digits, '234')) {
            $digits = substr($digits, 3);
        }

        // Remove leading 0
        if (str_starts_with($digits, '0')) {
            $digits = substr($digits, 1);
        }

        return '234' . $digits;
    }
}
