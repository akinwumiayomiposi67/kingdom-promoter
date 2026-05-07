<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invitation to Kingdom Fund Circle</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .header { background: #1a3c6e; color: #ffffff; padding: 32px 40px; }
        .header h1 { margin: 0; font-size: 22px; }
        .body { padding: 32px 40px; color: #333333; }
        .body p { line-height: 1.7; margin: 0 0 16px; }
        .detail-box { background: #f0f4fa; border-left: 4px solid #1a3c6e; border-radius: 4px; padding: 16px 20px; margin: 24px 0; }
        .detail-box p { margin: 6px 0; font-size: 15px; }
        .btn { display: inline-block; background: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 15px; margin: 16px 0; }
        .footer { padding: 20px 40px; background: #f4f6f9; font-size: 13px; color: #888888; text-align: center; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>Kingdom Fund Circle</h1>
        <p style="margin:8px 0 0; opacity:0.85; font-size:14px;">You've Been Invited!</p>
    </div>
    <div class="body">
        <p>Hello,</p>
        <p>
            You have been invited to join <strong>Kingdom Fund Circle</strong> by
            <strong>{{ $invitedBy->name }}</strong>. Click the button below to accept your invitation
            and create your account.
        </p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{{ config('app.url') }}/invite?token={{ urlencode($rawToken) }}&email={{ urlencode($email) }}"
               class="btn">
                Accept Invitation
            </a>
        </div>

        <div class="detail-box">
            <p><strong>Invited by:</strong> {{ $invitedBy->name }}</p>
            <p><strong>Your email:</strong> {{ $email }}</p>
            <p><strong>Expires:</strong> {{ $expiresAt->format('d M Y, g:ia') }}</p>
        </div>

        <p>
            If the button above does not work, copy and paste the following link into your browser:
        </p>
        <p style="word-break: break-all; font-size: 13px; color: #555;">
            {{ config('app.url') }}/invite?token={{ urlencode($rawToken) }}&email={{ urlencode($email) }}
        </p>

        <p>
            This invitation expires on <strong>{{ $expiresAt->format('d M Y') }}</strong>. If you
            did not expect this email, you may safely ignore it.
        </p>

        <p>God bless you.</p>
    </div>
    <div class="footer">
        &copy; {{ date('Y') }} Kingdom Fund Circle. This invitation was sent to {{ $email }}.
    </div>
</div>
</body>
</html>
