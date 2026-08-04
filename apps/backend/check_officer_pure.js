const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY);

async function checkOfficer() {
    console.log('--- Checking User Profile ---');
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admissionofficer@edu.in')
        .single();

    if (userError) {
        console.error('❌ Error fetching user:', userError.message);
        return;
    }

    console.log('✅ User ID:', user.id);
    console.log('✅ User email:', user.email);
    console.log('✅ User status:', user.status);
    console.log('✅ User login_status:', user.login_status);

    console.log('\n--- Checking User Roles & Permissions ---');
    const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
            roles (
                id,
                name,
                role_permissions (
                    permissions (
                        code
                    )
                )
            )
        `)
        .eq('user_id', user.id);

    if (rolesError) {
        console.error('❌ Error fetching roles:', rolesError.message);
        return;
    }

    console.log('✅ Roles Data Raw:', JSON.stringify(rolesData, null, 2));

    const roles = [];
    const permissions = new Set();

    rolesData?.forEach((ur) => {
        const role = ur.roles;
        if (role) {
            roles.push(role.name);
            role.role_permissions?.forEach((rp) => {
                if (rp.permissions?.code) {
                    permissions.add(rp.permissions.code);
                }
            });
        }
    });

    console.log('Processed Roles:', roles);
    console.log('Processed Permissions:', Array.from(permissions));
}

checkOfficer();
