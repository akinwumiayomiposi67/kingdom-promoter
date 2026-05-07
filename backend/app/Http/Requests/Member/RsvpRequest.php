<?php

namespace App\Http\Requests\Member;

use Illuminate\Foundation\Http\FormRequest;

class RsvpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'response' => ['required', 'in:attending,not_attending'],
        ];
    }
}
