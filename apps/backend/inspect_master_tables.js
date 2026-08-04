const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log("--- Master Tables Data Inspection (RLS Bypassed) ---");
    
    // offer templates
    const { data: offers, error: err1 } = await supabase.from('admission_offer_templates').select('id, name');
    console.log("OFFER TEMPLATES:", err1 ? err1.message : offers);

    // interview panels
    const { data: panels, error: err2 } = await supabase.from('admission_interview_panels').select('id, panel_name');
    console.log("INTERVIEW PANELS:", err2 ? err2.message : panels);

    // exam halls
    const { data: halls, error: err3 } = await supabase.from('exam_halls').select('id, name');
    console.log("EXAM HALLS (CENTERS):", err3 ? err3.message : halls);

    // transport routes
    const { data: routes, error: err4 } = await supabase.from('transport_routes').select('id, route_name');
    console.log("TRANSPORT ROUTES:", err4 ? err4.message : routes);

    // document types
    const { data: docs, error: err5 } = await supabase.from('document_types').select('id, name, code');
    console.log("DOCUMENT TYPES:", err5 ? err5.message : docs);
}

inspect();
