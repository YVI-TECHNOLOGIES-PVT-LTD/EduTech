const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const MIGRATIONS = [
    '104_assessment_foundation.sql',
    '105_assessment_question_bank.sql',
    '106_assessment_template_builder.sql',
    '107_assessment_platform_rbac_permissions.sql',
    '108_exams_status_check_published.sql',
    '109_assessment_delivery_and_results_schema.sql'
];

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

async function applyMigration(filename) {
    const sqlPath = path.join(__dirname, '../database/migrations', filename);
    if (!fs.existsSync(sqlPath)) {
        console.error(`Missing migration file: ${filename}`);
        return;
    }
    
    console.log(`Applying ${filename}...`);
    const rawSql = fs.readFileSync(sqlPath, 'utf8');
    const queries = parseSql(rawSql);
    
    for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        const { error } = await supabase.rpc('exec_transaction_queries', { sql_queries: [query] });
        if (error) {
            console.error(`❌ Error in ${filename} at statement ${i + 1}/${queries.length}`);
            console.error(`SQL: \n${query}\n`);
            console.error(`Message: ${error.message}`);
            throw new Error(`Migration ${filename} failed at statement ${i + 1}`);
        }
    }
    
    console.log(`✅ ${filename} applied successfully.`);
}

async function main() {
    console.log("Applying all assessment platform and results database migrations (104 - 109)...");
    for (const m of MIGRATIONS) {
        await applyMigration(m);
    }
    console.log("\n🎉 All assessment migrations successfully applied!");
}

main().catch(err => {
    console.error("\nMigration run failed:");
    console.error(err.message || err);
    process.exit(1);
});
