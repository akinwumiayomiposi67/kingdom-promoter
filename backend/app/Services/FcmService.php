<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    public function send(User $user, string $title, string $body, array $data = []): bool
    {
        if (empty($user->fcm_token)) {
            return false;
        }

        try {
            $accessToken = Cache::remember('fcm_access_token', 55 * 60, fn () => $this->getAccessToken());

            if (! $accessToken) {
                return false;
            }

            $projectId = config('fcm.project_id');
            $url       = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            $payload = [
                'message' => [
                    'token'        => $user->fcm_token,
                    'notification' => [
                        'title' => $title,
                        'body'  => $body,
                    ],
                    'data' => array_map('strval', $data),
                ],
            ];

            $response = Http::withToken($accessToken)
                ->post($url, $payload);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning("FcmService::send failed for user {$user->id}: {$e->getMessage()}");

            return false;
        }
    }

    private function getAccessToken(): ?string
    {
        try {
            $keyPath = config('fcm.service_account_path');

            if (! $keyPath || ! file_exists($keyPath)) {
                Log::warning('FCM: service account key file not found at: ' . $keyPath);
                return null;
            }

            $key = json_decode(file_get_contents($keyPath), true);

            $now       = time();
            $expiresAt = $now + 3600;

            $header  = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $payload = base64_encode(json_encode([
                'iss'   => $key['client_email'],
                'sub'   => $key['client_email'],
                'aud'   => 'https://oauth2.googleapis.com/token',
                'iat'   => $now,
                'exp'   => $expiresAt,
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            ]));

            $header  = rtrim(strtr($header, '+/', '-_'), '=');
            $payload = rtrim(strtr($payload, '+/', '-_'), '=');

            $signingInput = $header . '.' . $payload;

            $privateKey = openssl_pkey_get_private($key['private_key']);
            openssl_sign($signingInput, $signature, $privateKey, OPENSSL_ALGO_SHA256);

            $signature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

            $jwt = $signingInput . '.' . $signature;

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]);

            if ($response->successful()) {
                return $response->json('access_token');
            }

            Log::warning('FCM: failed to obtain access token: ' . $response->body());

            return null;
        } catch (\Throwable $e) {
            Log::warning('FCM: getAccessToken exception: ' . $e->getMessage());

            return null;
        }
    }
}
