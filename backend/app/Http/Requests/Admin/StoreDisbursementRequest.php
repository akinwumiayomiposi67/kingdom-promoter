<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreDisbursementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'                => 'required|string|max:200',
            'amount'               => 'required|numeric|min:0',
            'description'          => 'nullable|string|max:2000',
            'contribution_cycle_id' => 'required|integer|exists:contribution_cycles,id',
            'receipt'              => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ];
    }
}
