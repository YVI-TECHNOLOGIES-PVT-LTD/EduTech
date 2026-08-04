"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("../../../../config/supabase");
async function checkRoles() {
    const userId = 'e12cb08e-c28d-4067-a10d-8786a4d46c8d';
    console.log('Querying roles for user...');
    const { data: userRoles, error: urError } = await supabase_1.supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);
    if (urError) {
        console.error('Error user_roles:', urError);
    }
    else {
        console.log('user_roles rows:', userRoles);
    }
    console.log('Querying all roles from roles table...');
    const { data: roles, error: rError } = await supabase_1.supabase
        .from('roles')
        .select('*');
    if (rError) {
        console.error('Error roles:', rError);
    }
    else {
        console.log('roles rows:', roles);
    }
}
checkRoles();
