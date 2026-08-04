import { supabase } from './config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
    console.log('--- Applying Migration 080 (Sprint 1 Foundation) ---');
    const sqlPath = path.join(__dirname, '../database/migrations/080_admission_sprint1_foundation.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL via RPC exec_sql...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.error('Migration Failed:', error.message);
        process.exit(1);
    } else {
        console.log('Migration Applied Successfully!');
        console.log('RPC Response:', data);
    }
}

runMigration().catch(console.error);
