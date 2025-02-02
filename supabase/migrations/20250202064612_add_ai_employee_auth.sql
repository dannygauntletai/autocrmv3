-- Create AI employee auth user
DO $$
DECLARE
    ai_employee_id uuid := 'a2b7c987-6543-4321-8901-234567890123';
    ai_employee_email text := 'ai@autocrm.app';
BEGIN
    -- Create auth.users entry for AI employee
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        ai_employee_id,
        '00000000-0000-0000-0000-000000000000',
        ai_employee_email,
        crypt(current_setting('custom.ai_employee_password'), gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"AutoCRM AI","role":"agent"}',
        now(),
        now(),
        'authenticated',
        '',
        '',
        '',
        ''
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create identities entry
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        ai_employee_id,
        ai_employee_id,
        format('{"sub":"%s","email":"%s"}', ai_employee_id::text, ai_employee_email)::jsonb,
        'email',
        now(),
        now(),
        now()
    )
    ON CONFLICT (provider, provider_id) DO NOTHING;
END $$; 