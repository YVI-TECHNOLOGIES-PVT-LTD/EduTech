const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

function parseSql(rawSql) {
    // Remove multi-line comments first
    let cleanSql = rawSql.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove single-line comments
    cleanSql = cleanSql.replace(/--.*$/gm, '');

    const statements = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarQuoteTag = '';
    
    let i = 0;
    while (i < cleanSql.length) {
        const char = cleanSql[i];
        
        if (char === '$') {
            const remaining = cleanSql.substring(i);
            const match = remaining.match(/^(\$[a-zA-Z0-9_]*\$)/);
            if (match) {
                const tag = match[1];
                if (!inDollarQuote) {
                    inDollarQuote = true;
                    dollarQuoteTag = tag;
                } else if (tag === dollarQuoteTag) {
                    inDollarQuote = false;
                    dollarQuoteTag = '';
                }
                currentStatement += tag;
                i += tag.length;
                continue;
            }
        }
        
        if (char === ';' && !inDollarQuote) {
            statements.push(currentStatement.trim());
            currentStatement = '';
        } else {
            currentStatement += char;
        }
        i++;
    }
    
    if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
    }
    
    return statements.map(q => q.trim()).filter(q => {
        if (!q) return false;
        const lower = q.toLowerCase();
        return lower !== 'begin' && lower !== 'commit' && lower !== 'rollback';
    });
}

async function main() {
    const filename = '109_assessment_delivery_and_results_schema.sql';
    const sqlPath = path.join(__dirname, '../database/migrations', filename);
    if (!fs.existsSync(sqlPath)) {
        console.error(`Missing migration file at: ${sqlPath}`);
        return;
    }
    
    console.log(`Reading SQL from: ${sqlPath}`);
    const rawSql = fs.readFileSync(sqlPath, 'utf8');
    const queries = parseSql(rawSql);
    
    console.log(`Parsed ${queries.length} SQL statements. Executing individually to find the exact error...`);
    
    for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        console.log(`[Statement ${i + 1}/${queries.length}] Executing...`);
        const { data, error } = await supabase.rpc('exec_transaction_queries', { sql_queries: [query] });
        if (error) {
            console.error(`\n❌ Error on statement ${i + 1}:`);
            console.error(`SQL: \n${query}\n`);
            console.error(`Message: ${error.message}`);
            console.error(`Details: ${JSON.stringify(error)}`);
            process.exit(1);
        }
    }
    
    console.log('\nAll statements executed successfully! Schema looks correct.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
