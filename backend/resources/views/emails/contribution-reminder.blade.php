<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Contribution Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #1a3c6e; color: #ffffff; padding: 32px 40px; }
        .header h1 { margin: 0; font-size: 22px; }
        .body { padding: 32px 40px; color: #333333; }
        .body p { line-height: 1.7; margin: 0 0 16px; }
        .detail-box { background: #f0f4fa; border-left: 4px solid #1a3c6e; border-radius: 4px; padding: 16px 20px; margin: 24px 0; }
        .detail-box p { margin: 6px 0; font-size: 15px; }
        .detail-box strong { color: #1a3c6e; }
        .account-box { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px 20px; margin: 24px 0; }
        .account-box p { margin: 6px 0; font-size: 15px; }
        .footer { padding: 20px 40px; background: #f4f6f9; font-size: 13px; color: #888888; text-align: center; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>Kingdom Fund Circle</h1>
        <p style="margin:8px 0 0; opacity:0.85; font-size:14px;">Contribution Reminder</p>
    </div>
    <div class="body">
        <p>Dear <strong>{{ $user->name }}</strong>,</p>
        <p>
            This is a friendly reminder that your monthly contribution for the
            <strong>{{ $contribution->cycle?->name }}</strong> cycle is coming up soon.
            Please ensure your wallet has sufficient funds before the debit date.
        </p>

        <div class="detail-box">
            <p><strong>Cycle:</strong> {{ $contribution->cycle?->name }}</p>
            <p><strong>Package:</strong> {{ $contribution->package?->name }}</p>
            <p><strong>Amount Due:</strong> ₦{{ number_format($contribution->amount, 2) }}</p>
            <p><strong>Debit Day:</strong> Day {{ $contribution->cycle?->debit_day }} of the month</p>
        </div>

        @if($user->wallet?->virtual_account_number)
        <div class="account-box">
            <p><strong>Fund Your Wallet</strong></p>
            <p><strong>Bank:</strong> {{ $user->wallet->virtual_account_bank }}</p>
            <p><strong>Account Number:</strong> {{ $user->wallet->virtual_account_number }}</p>
            <p><strong>Account Name:</strong> {{ $user->wallet->virtual_account_name }}</p>
        </div>
        @endif

        <p>
            Transfers to your virtual account are reflected instantly. If you have already funded
            your wallet, please disregard this message.
        </p>
        <p>God bless you as you remain committed to the circle.</p>
    </div>
    <div class="footer">
        &copy; {{ date('Y') }} Kingdom Fund Circle. This email was sent to {{ $user->email }}.
    </div>
</div>
</body>
</html>
