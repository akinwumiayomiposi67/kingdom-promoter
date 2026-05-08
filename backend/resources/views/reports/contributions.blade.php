<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Contributions Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333333; margin: 0; padding: 20px; }
        h1 { color: #1a3c6e; font-size: 18px; margin-bottom: 4px; }
        .subtitle { color: #555555; font-size: 11px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background-color: #1a3c6e; color: #ffffff; padding: 8px 10px; text-align: left; font-size: 11px; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background-color: #f9fafb; }
        .badge-paid { background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 10px; }
        .badge-pending { background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 10px; }
        .badge-failed { background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 10px; }
        .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: center; }
    </style>
</head>
<body>
    <h1>Kingdom Fund Circle</h1>
    <p class="subtitle">Contributions Report &mdash; Generated on {{ now()->format('d M Y, g:ia') }}</p>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Member Name</th>
                <th>Package</th>
                <th>Amount (₦)</th>
                <th>Status</th>
                <th>Paid At</th>
                <th>Cycle</th>
            </tr>
        </thead>
        <tbody>
            @forelse($contributions as $index => $contribution)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $contribution->user?->name ?? 'N/A' }}</td>
                <td>{{ $contribution->package?->name ?? 'N/A' }}</td>
                <td>{{ number_format((float) $contribution->amount, 2) }}</td>
                <td>
                    <span class="badge-{{ $contribution->status }}">{{ ucfirst($contribution->status) }}</span>
                </td>
                <td>{{ $contribution->paid_at?->format('d M Y') ?? '—' }}</td>
                <td>{{ $contribution->cycle?->name ?? 'N/A' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="7" style="text-align:center; padding: 20px; color: #9ca3af;">No contributions found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <p class="footer">
        &copy; {{ date('Y') }} Kingdom Fund Circle &mdash; This report is confidential.
    </p>
</body>
</html>
