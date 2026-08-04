import { supabase } from './src/config/supabase';

async function diagnoseAuth() {
    console.log('--- 1. Testing Direct Sign In ---');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@edu.in',
        password: 'Welcome#321'
    });

    if (signInError) {
        console.error('❌ Sign In Failed:', signInError.message, 'Status:', (signInError as any).status);
    } else {
        console.log('✅ Sign In Succeeded! User:', signInData.user?.email);
    }

    console.log('\n--- 2. Checking Public Profiles ---');
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name');

    if (usersError) {
        console.error('❌ Public Users Read Failed:', usersError.message);
    } else {
        console.log(`✅ Public Users Found (${users.length}):`);
        console.log(users);
    }
}

diagnoseAuth();
