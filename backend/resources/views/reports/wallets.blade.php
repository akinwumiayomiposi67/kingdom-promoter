<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Wallets Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333333; margin: 0; padding: 20px; }
        h1 { color: #1a3c6e; font-size: 18px; margin-bottom: 4px; }
        .subtitle { color: #555555; font-size: 11px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background-color: #1a3c6e; color: #ffffff; padding: 8px 10px; text-align: left; font-size: 11px; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) td { background-color: #f9fafb; }
        .badge-active { background-color: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 10px; }
        .badge-inactive { background-color: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 12px; font-size: 10px; }
        .badge-suspended { background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 12px; font-size: 10px; }
        .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: center; }
    </style>
</head>
<body>
    <h1>Kingdom Fund Circle</h1>
    <p class="subtitle">Wallets Report &mdash; Generated on {{ now()->format('d M Y, g:ia') }}</p>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Member Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Balance (₦)</th>
                <th>Total Credited (₦)</th>
                <th>Total Debited (₦)</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($members as $index => $member)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $member['name'] }}</td>
                <td>{{ $member['email'] }}</td>
                <td>{{ $member['phone'] }}</td>
                <td>{{ number_format((float) $member['balance'], 2) }}</td>
                <td>{{ number_format((float) $member['total_credit'], 2) }}</td>
                <td>{{ number_format((float) $member['total_debit'], 2) }}</td>
                <td>
                    <span class="badge-{{ $member['status'] }}">{{ ucfirst($member['status']) }}</span>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" style="text-align:center; padding: 20px; color: #9ca3af;">No members found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <p class="footer">
        &copy; {{ date('Y') }} Kingdom Fund Circle &mdash; This report is confidential.
    </p>
</body>
</html>
