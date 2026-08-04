import { supabase } from './src/config/supabase';

async function syncSystem() {
    console.log('--- Starting System Sync & Hardening ---');

    // 1. Ensure School exists
    console.log('[1] Checking schools...');
    let { data: schools } = await supabase.from('schools').select('id');
    let schoolId: string;

    if (!schools || schools.length === 0) {
        console.log('No schools found. Creating default school...');
        const { data: newSchool, error: schoolError } = await (supabase as any)
            .from('schools')
            .insert({ name: 'Default School', code: 'DEF001', status: 'active' })
            .select()
            .single();

        if (schoolError) throw new Error(`Failed to create school: ${schoolError.message}`);
        schoolId = newSchool.id;
        console.log(`Created school: ${newSchool.name} (${schoolId})`);
    } else {
        schoolId = schools[0].id;
        console.log(`Using existing school: ${schoolId}`);
    }

    // 2. Fetch all Auth Users
    console.log('[2] Fetching authenticated users...');
    const { data: authUsers, error: authError } = await (supabase as any).auth.admin.listUsers();
    if (authError) throw new Error(`Failed to list auth users: ${authError.message}`);

    console.log(`Found ${authUsers.users.length} users in Supabase Auth.`);

    // 3. Sync to public.users
    console.log('[3] Syncing users to public.users...');
    for (const authUser of authUsers.users) {
        const { error: syncError } = await supabase
            .from('users')
            .upsert({
                id: authUser.id,
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || 'System User',
                school_id: schoolId,
                status: 'active'
            });

        if (syncError) {
            console.error(`Failed to sync user ${authUser.email}:`, syncError.message);
        } else {
            console.log(`Synced user: ${authUser.email}`);
        }
    }

    // 4. Ensure ADMIN Role and permissions exist
    console.log('[4] Verifying ADMIN role permissions...');
    // This is already done in seeds but let's be double sure for the logged-in user if they are the admin
    const { data: adminRole } = await supabase.from('roles').select('id').eq('name', 'ADMIN').single();
    if (adminRole && authUsers.users.length > 0) {
        // Assign first user as ADMIN if they have no roles
        const firstUser = authUsers.users[0];
        const { data: existingRoles } = await supabase.from('user_roles').select('*').eq('user_id', firstUser.id);

        if (!existingRoles || existingRoles.length === 0) {
            await supabase.from('user_roles').insert({ user_id: firstUser.id, role_id: adminRole.id });
            console.log(`Assigned ADMIN role to: ${firstUser.email}`);
        }
    }

    console.log('--- Sync Completed ---');
}

syncSystem().catch(err => {
    console.error('Sync failed:', err);
    process.exit(1);
});
