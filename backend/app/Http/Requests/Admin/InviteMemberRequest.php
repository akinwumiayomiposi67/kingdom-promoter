<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class InviteMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'unique:users,email', 'unique:invitations,email'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'This email address already has an account or a pending invitation.',
        ];
    }
}
