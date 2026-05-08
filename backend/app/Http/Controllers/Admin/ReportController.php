<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contribution;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use League\Csv\Writer;

class ReportController extends Controller
{
    public function contributions(Request $request)
    {
        $request->validate([
            'cycle_id' => ['nullable', 'integer', 'exists:contribution_cycles,id'],
            'format'   => ['nullable', 'string', 'in:csv,pdf'],
        ]);

        $format = $request->input('format', 'csv');

        $query = Contribution::with(['user', 'package', 'cycle'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('cycle_id')) {
            $query->where('contribution_cycle_id', $request->cycle_id);
        }

        $contributions = $query->get();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.contributions', ['contributions' => $contributions]);
            $filename = 'contributions-report-' . now()->format('Y-m-d') . '.pdf';

            return $pdf->download($filename);
        }

        // CSV format
        $csv = Writer::createFromString();
        $csv->insertOne(['Member Name', 'Package', 'Amount (₦)', 'Status', 'Paid At', 'Cycle']);

        foreach ($contributions as $contribution) {
            $csv->insertOne([
                $contribution->user?->name ?? 'N/A',
                $contribution->package?->name ?? 'N/A',
                number_format((float) $contribution->amount, 2, '.', ''),
                $contribution->status,
                $contribution->paid_at?->format('Y-m-d H:i:s') ?? '',
                $contribution->cycle?->name ?? 'N/A',
            ]);
        }

        $filename = 'contributions-report-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(
            fn () => print($csv->toString()),
            $filename,
            ['Content-Type' => 'text/csv']
        );
    }

    public function wallets(Request $request)
    {
        $request->validate([
            'format' => ['nullable', 'string', 'in:csv,pdf'],
        ]);

        $format = $request->input('format', 'csv');

        $members = User::where('role', 'member')
            ->with('wallet')
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                $wallet      = $user->wallet;
                $totalCredit = $wallet?->transactions()->where('type', 'credit')->sum('amount') ?? '0.00';
                $totalDebit  = $wallet?->transactions()->where('type', 'debit')->sum('amount') ?? '0.00';

                return [
                    'name'         => $user->name,
                    'email'        => $user->email,
                    'phone'        => $user->phone,
                    'balance'      => number_format((float) ($wallet?->balance ?? 0), 2, '.', ''),
                    'total_credit' => number_format((float) $totalCredit, 2, '.', ''),
                    'total_debit'  => number_format((float) $totalDebit, 2, '.', ''),
                    'status'       => $user->status,
                ];
            });

        if ($format === 'pdf') {
            $pdf      = Pdf::loadView('reports.wallets', ['members' => $members]);
            $filename = 'wallets-report-' . now()->format('Y-m-d') . '.pdf';

            return $pdf->download($filename);
        }

        $csv = Writer::createFromString();
        $csv->insertOne(['Member Name', 'Email', 'Phone', 'Balance (₦)', 'Total Credited (₦)', 'Total Debited (₦)', 'Status']);

        foreach ($members as $row) {
            $csv->insertOne([
                $row['name'],
                $row['email'],
                $row['phone'],
                $row['balance'],
                $row['total_credit'],
                $row['total_debit'],
                $row['status'],
            ]);
        }

        $filename = 'wallets-report-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(
            fn () => print($csv->toString()),
            $filename,
            ['Content-Type' => 'text/csv']
        );
    }
}
