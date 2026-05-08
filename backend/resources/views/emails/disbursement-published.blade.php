<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Disbursement Published</title>
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
        .highlight { background: #ecfdf5; border-left: 4px solid #16a34a; border-radius: 4px; padding: 16px 20px; margin: 24px 0; }
        .highlight p { margin: 6px 0; font-size: 15px; }
        .footer { padding: 20px 40px; background: #f4f6f9; font-size: 13px; color: #888888; text-align: center; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>Kingdom Fund Circle</h1>
        <p style="margin:8px 0 0; opacity:0.85; font-size:14px;">Disbursement Notice</p>
    </div>
    <div class="body">
        <p>Dear <strong>{{ $user->name }}</strong>,</p>
        <p>
            We are pleased to announce that a new disbursement has been published for the
            <strong>{{ $disbursement->cycle?->name }}</strong> cycle. Please log in to the
            app to view the full details.
        </p>

        <div class="detail-box">
            <p><strong>Title:</strong> {{ $disbursement->title }}</p>
            <p><strong>Cycle:</strong> {{ $disbursement->cycle?->name }}</p>
            <p><strong>Amount:</strong> ₦{{ number_format($disbursement->amount, 2) }}</p>
            <p><strong>Published:</strong> {{ $disbursement->published_at?->format('d M Y, g:ia') }}</p>
        </div>

        @if($disbursement->description)
        <div class="highlight">
            <p><strong>Description:</strong></p>
            <p>{{ $disbursement->description }}</p>
        </div>
        @endif

        <p>
            Please log in to the Kingdom Fund Circle app to view the full disbursement record
            and download the receipt if available.
        </p>
        <p>God bless you as you remain committed to the circle.</p>
    </div>
    <div class="footer">
        &copy; {{ date('Y') }} Kingdom Fund Circle. This email was sent to {{ $user->email }}.
    </div>
</div>
</body>
</html>
