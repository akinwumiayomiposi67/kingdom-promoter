<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPaystackWebhook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaystackWebhookController extends Controller
{
    public function receive(Request $request): JsonResponse
    {
        dispatch(new ProcessPaystackWebhook($request->all()));

        return response()->json(['success' => true], 200);
    }
}
