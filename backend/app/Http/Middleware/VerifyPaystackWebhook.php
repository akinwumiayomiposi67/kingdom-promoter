<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyPaystackWebhook
{
    public function handle(Request $request, Closure $next): Response
    {
        $payload   = $request->getContent();
        $secret    = config('paystack.secret_key');
        $computed  = hash_hmac('sha512', $payload, $secret);
        $signature = $request->header('X-Paystack-Signature', '');

        if (! hash_equals($computed, $signature)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid signature.',
            ], 401);
        }

        return $next($request);
    }
}
