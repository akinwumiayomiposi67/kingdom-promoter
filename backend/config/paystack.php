<?php

return [
    'secret_key'     => env('PAYSTACK_SECRET_KEY'),
    'public_key'     => env('PAYSTACK_PUBLIC_KEY'),
    'preferred_bank' => env('PAYSTACK_PREFERRED_BANK', 'wema-bank'),
];
