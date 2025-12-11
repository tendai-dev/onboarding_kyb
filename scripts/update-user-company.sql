-- Update user profile with company name
-- Replace 'your-email@example.com' with your actual email

UPDATE user_profiles 
SET company_name = 'Kurasika Lab',
    updated_at = NOW()
WHERE email = 'your-email@example.com';

-- If profile doesn't exist, insert it
INSERT INTO user_profiles (
    email, 
    first_name, 
    last_name, 
    full_name, 
    company_name, 
    created_at, 
    updated_at
)
SELECT 
    'your-email@example.com',
    'User',
    'Name',
    'User Name',
    'Kurasika Lab',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'your-email@example.com'
);

-- Verify the update
SELECT email, company_name, first_name, last_name FROM user_profiles WHERE email = 'your-email@example.com';
