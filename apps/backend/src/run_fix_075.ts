
import { supabase } from './config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function runFix() {
    console.log('--- Applying Migration 075 Fix ---');
    const sqlPath = path.join(__dirname, '../database/migrations/075_fix_seating_generation.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL via RPC exec_sql...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.error('Migration Failed:', error.message);
        if (error.message.includes('permission denied')) {
            console.log('TIP: Try running this SQL manually in Supabase Dashboard.');
        }
    } else {
        console.log('Migration Applied Successfully!');
        console.log('RPC Response:', data);
    }
}

runFix().catch(console.error);
