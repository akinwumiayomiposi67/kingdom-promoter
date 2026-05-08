<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TwoFactorController extends Controller
{
    private function google2fa(): \PragmaRX\Google2FALaravel\Google2FA
    {
        return app('pragmarx.google2fa');
    }

    public function setup(Request $request): JsonResponse
    {
        $google2fa = $this->google2fa();
        $secret    = $google2fa->generateSecretKey();

        $request->session()->put('2fa_setup_secret', $secret);

        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $request->user()->email,
            $secret
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'secret'     => $secret,
                'qr_code_url' => $qrCodeUrl,
            ],
        ]);
    }

    public function enable(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'digits:6'],
        ]);

        $secret = $request->session()->get('2fa_setup_secret');

        if (! $secret) {
            return response()->json([
                'success' => false,
                'message' => 'No 2FA setup in progress. Please call setup first.',
            ], 422);
        }

        $valid = $this->google2fa()->verifyKey($secret, $request->code);

        if (! $valid) {
            throw ValidationException::withMessages([
                'code' => ['The TOTP code is invalid. Please try again.'],
            ]);
        }

        $user = $request->user();
        $user->update([
            'two_factor_secret'  => $secret,
            'two_factor_enabled' => true,
        ]);

        $request->session()->forget('2fa_setup_secret');
        $request->session()->put('2fa_verified', true);

        return response()->json([
            'success' => true,
            'data'    => ['message' => 'Two-factor authentication has been enabled.'],
        ]);
    }

    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'digits:6'],
        ]);

        $user = $request->user();

        if (! $user->two_factor_enabled || ! $user->two_factor_secret) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor authentication is not enabled on this account.',
            ], 422);
        }

        $valid = $this->google2fa()->verifyKey($user->two_factor_secret, $request->code);

        if (! $valid) {
            throw ValidationException::withMessages([
                'code' => ['The TOTP code is invalid or has expired.'],
            ]);
        }

        $request->session()->put('2fa_verified', true);

        return response()->json([
            'success' => true,
            'data'    => ['message' => 'Two-factor authentication verified.'],
        ]);
    }

    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The provided password is incorrect.'],
            ]);
        }

        $user->update([
            'two_factor_secret'  => null,
            'two_factor_enabled' => false,
        ]);

        $request->session()->forget('2fa_verified');

        return response()->json([
            'success' => true,
            'data'    => ['message' => 'Two-factor authentication has been disabled.'],
        ]);
    }
}
