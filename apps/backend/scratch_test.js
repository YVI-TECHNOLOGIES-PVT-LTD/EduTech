const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    try {
        console.log("Fetching user: examplatform@edu.in...");
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'examplatform@edu.in');
        
        if (userError) console.error("User error:", userError);
        console.log("Users:", users);

        if (users && users.length > 0) {
            const user = users[0];
            console.log("\nFetching user_roles for user id:", user.id);
            const { data: userRoles, error: urError } = await supabase
                .from('user_roles')
                .select(`
                    id,
                    role_id,
                    roles (
                        id,
                        name
                    )
                `)
                .eq('user_id', user.id);
            if (urError) console.error("User roles error:", urError);
            console.log("User Roles:", JSON.stringify(userRoles, null, 2));

            if (userRoles && userRoles.length > 0) {
                for (const ur of userRoles) {
                    const role = ur.roles;
                    console.log(`\nFetching role_permissions for role: ${role.name} (${role.id})...`);
                    const { data: rolePermissions, error: rpError } = await supabase
                        .from('role_permissions')
                        .select(`
                            id,
                            permission_id,
                            permissions (
                                id,
                                name,
                                code
                            )
                        `)
                        .eq('role_id', role.id);
                    if (rpError) console.error("Role permissions error:", rpError);
                    console.log(`Permissions for ${role.name}:`, rolePermissions?.map(rp => rp.permissions?.code));
                }
            }
        }

        console.log("\nAll roles in the database:");
        const { data: allRoles } = await supabase.from('roles').select('id, name');
        console.log(allRoles);

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
