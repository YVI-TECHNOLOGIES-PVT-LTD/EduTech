import axios from 'axios';
import { supabase } from './config/supabase';

async function runTests() {
    console.log('==================================================');
    console.log('AMS ATTENDANCE END-TO-END QA & INTEGRATION TESTS');
    console.log('==================================================');

    try {
        console.log('[Step 1] Authenticating with Supabase...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'admin@edu.in',
            password: 'Welcome#321',
        });

        if (authError || !authData.session) {
            throw new Error(`Authentication failed: ${authError?.message}`);
        }

        const token = authData.session.access_token;
        console.log('✅ Authentication successful! JWT retrieved.');

        const client = axios.create({
            baseURL: 'http://localhost:3000/api',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        // Query Today's Summary
        console.log('\n[Step 2] Querying Today\'s Summary (GET /attendance/admin/summary)...');
        const summaryRes = await client.get('/attendance/admin/summary');
        console.log(`✅ Status: ${summaryRes.status}`);
        console.log('Payload:', JSON.stringify(summaryRes.data));

        // Query Class Summary
        console.log('\n[Step 3] Querying Class-wise Breakdowns (GET /attendance/admin/class-summary)...');
        const classRes = await client.get('/attendance/admin/class-summary');
        console.log(`✅ Status: ${classRes.status}`);
        console.log(`Class Summaries returned: ${classRes.data?.length || 0}`);

        // Query Defaulters
        console.log('\n[Step 4] Querying Low-Attendance Alert List (GET /attendance/admin/defaulters)...');
        const defRes = await client.get('/attendance/admin/defaulters');
        console.log(`✅ Status: ${defRes.status}`);
        console.log(`At-Risk students: ${defRes.data?.length || 0}`);

        console.log('\n==================================================');
        console.log('🎉 ALL AMS INTEGRATION TESTS PASSED SUCCESSFULLY!');
        console.log('==================================================');
        process.exit(0);
    } catch (err: any) {
        console.error('\n❌ AMS INTEGRATION TEST FAILED:', err.response?.data || err.message);
        process.exit(1);
    }
}

runTests();
