<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TwoFactorVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->get('2fa_verified')) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor authentication required.',
            ], 403);
        }

        return $next($request);
    }
}
