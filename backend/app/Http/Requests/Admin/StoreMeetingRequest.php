<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreMeetingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'        => ['required', 'string', 'max:200'],
            'description'  => ['nullable', 'string'],
            'meeting_date' => ['required', 'date', 'after:now'],
            'location'     => ['nullable', 'string', 'max:300'],
            'is_online'    => ['nullable', 'boolean'],
            'meeting_link' => ['nullable', 'url', 'max:500'],
        ];
    }
}
