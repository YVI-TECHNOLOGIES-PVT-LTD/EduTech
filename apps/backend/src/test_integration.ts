import axios from 'axios';
import { supabase } from './config/supabase';

async function runTests() {
    console.log('==================================================');
    console.log('SIS END-TO-END QA & INTEGRATION TEST RUNNER');
    console.log('==================================================');

    try {
        // 1. Authenticate using seeded user credentials
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

        // 2. Query Student list endpoint
        console.log('\n[Step 2] Querying student listing API (GET /students)...');
        const listRes = await client.get('/students', {
            params: {
                page: 1,
                limit: 5,
                search: '',
            },
        });

        console.log(`✅ Student list returned status: ${listRes.status}`);
        console.log('Response Metadata:', JSON.stringify(listRes.data.meta || {}));
        console.log(`Total records in list: ${listRes.data.data?.length || 0}`);

        if (!Array.isArray(listRes.data.data)) {
            throw new Error('Invalid response structure: expected data array');
        }

        // 3. Query Student details endpoint
        if (listRes.data.data.length > 0) {
            const studentId = listRes.data.data[0].id;
            console.log(`\n[Step 3] Fetching details for student ID: ${studentId}...`);
            const detailsRes = await client.get(`/students/${studentId}`);
            console.log(`✅ Student details returned status: ${detailsRes.status}`);
            console.log(`Full Name: ${detailsRes.data.firstName || detailsRes.data.first_name} ${detailsRes.data.lastName || detailsRes.data.last_name}`);
            console.log(`Admission No: ${detailsRes.data.admissionNo || detailsRes.data.admission_no}`);
            console.log('Returned Object keys:', Object.keys(detailsRes.data));
        } else {
            console.log('\n[Step 3] Skipped details test (no students in DB).');
        }

        console.log('\n==================================================');
        console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
        console.log('==================================================');
        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ INTEGRATION TEST FAILED:', error.response?.data || error.message);
        process.exit(1);
    }
}

runTests();
