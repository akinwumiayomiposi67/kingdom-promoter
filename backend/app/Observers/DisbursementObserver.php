<?php

namespace App\Observers;

use App\Jobs\SendDisbursementNotification;
use App\Models\AuditLog;
use App\Models\Disbursement;

class DisbursementObserver
{
    public function updated(Disbursement $disbursement): void
    {
        if ($disbursement->wasChanged('is_published') && $disbursement->is_published) {
            AuditLog::create([
                'user_id'      => auth()->id(),
                'action'       => 'disbursement.published',
                'subject_type' => Disbursement::class,
                'subject_id'   => $disbursement->id,
                'metadata'     => ['title' => $disbursement->title, 'amount' => $disbursement->amount],
            ]);

            dispatch(new SendDisbursementNotification($disbursement->id));
        }
    }
}
