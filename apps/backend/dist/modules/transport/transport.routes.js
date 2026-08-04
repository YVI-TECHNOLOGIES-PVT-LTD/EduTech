"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transportRouter = void 0;
const express_1 = require("express");
const rbac_middleware_1 = require("../../rbac/rbac.middleware");
const permissions_1 = require("../../rbac/permissions");
const supabase_1 = require("../../config/supabase");
const notification_service_1 = require("./notification.service");
exports.transportRouter = (0, express_1.Router)();
// ======================================
// 1. STOPS MANAGEMENT
// ======================================
exports.transportRouter.post('/stops', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { name, latitude, longitude } = req.body;
    const { data, error } = await supabase_1.supabase
        .from('transport_stops')
        .insert({ school_id: schoolId, name, latitude, longitude })
        .select().single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
exports.transportRouter.post('/seed-demo', async (req, res) => {
    try {
        console.log("🌱 Seeding via API...");
        // 1. Get Driver User
        const { data: users, error: uErr } = await supabase_1.supabase.from('users').select('id, school_id').eq('email', 'driver1@school.com');
        if (!users?.length)
            return res.status(404).json({ error: "Driver user not found" });
        const driverUser = users[0];
        const schoolId = driverUser.school_id;
        // 2. Driver
        let { data: driver } = await supabase_1.supabase.from('transport_drivers').select('*').eq('user_id', driverUser.id).single();
        if (!driver) {
            const { data: d } = await supabase_1.supabase.from('transport_drivers').insert({ user_id: driverUser.id, school_id: schoolId, license_number: 'DL-DEMO', phone: '555-0101', status: 'ACTIVE' }).select().single();
            driver = d;
        }
        // 3. Vehicle
        let { data: vehicle } = await supabase_1.supabase.from('transport_vehicles').select('*').eq('vehicle_no', 'BUS-DEMO-01').single();
        if (!vehicle) {
            const { data: v } = await supabase_1.supabase.from('transport_vehicles').insert({ school_id: schoolId, vehicle_no: 'BUS-DEMO-01', capacity: 30, status: 'ACTIVE' }).select().single();
            vehicle = v;
        }
        // 4. Route
        let { data: route } = await supabase_1.supabase.from('transport_routes').select('*').eq('name', 'Route A1 (Downtown)').single();
        if (!route) {
            const { data: r } = await supabase_1.supabase.from('transport_routes').insert({ school_id: schoolId, name: 'Route A1 (Downtown)' }).select().single();
            route = r;
        }
        // 5. Stops
        const stopsData = [{ name: 'Central School', latitude: 17.44008, longitude: 78.34891 }, { name: 'City Mall', latitude: 17.42508, longitude: 78.34000 }];
        const stops = [];
        for (const s of stopsData) {
            let { data: stop } = await supabase_1.supabase.from('transport_stops').select('*').eq('name', s.name).single();
            if (!stop) {
                const { data: ns } = await supabase_1.supabase.from('transport_stops').insert({ school_id: schoolId, ...s }).select().single();
                stop = ns;
            }
            if (stop)
                stops.push(stop);
        }
        // 6. Link Stops
        await supabase_1.supabase.from('transport_route_stops').delete().eq('route_id', route.id);
        for (let i = 0; i < stops.length; i++) {
            await supabase_1.supabase.from('transport_route_stops').insert({ route_id: route.id, stop_id: stops[i].id, stop_order: i + 1, morning_time: '08:00', evening_time: '16:00' });
        }
        // 7. Assign
        await supabase_1.supabase.from('route_vehicles').delete().eq('driver_id', driver.id);
        await supabase_1.supabase.from('route_vehicles').insert({ route_id: route.id, vehicle_id: vehicle.id, driver_id: driver.id });
        // 8. Create a Trip for TODAY
        const today = new Date().toISOString().split('T')[0];
        await supabase_1.supabase.from('transport_trips').delete().eq('driver_id', driver.id).eq('trip_date', today);
        await supabase_1.supabase.from('transport_trips').insert({
            school_id: schoolId,
            driver_id: driver.id,
            route_id: route.id,
            vehicle_id: vehicle.id,
            trip_type: 'MORNING',
            trip_date: today,
            status: 'SCHEDULED'
        });
        res.json({ success: true, message: "Seeded successfully" });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.transportRouter.get('/stops', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase
        .from('transport_stops')
        .select('*')
        .eq('school_id', schoolId)
        .order('name');
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// ======================================
// 2. DRIVERS MANAGEMENT
// ======================================
exports.transportRouter.post('/drivers', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { user_id, license_number, phone, status } = req.body;
    const { data, error } = await supabase_1.supabase
        .from('transport_drivers')
        .insert({ school_id: schoolId, user_id, license_number, phone, status: status || 'ACTIVE' })
        .select(`*, user:user_id (full_name, email)`).single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
exports.transportRouter.get('/drivers', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase
        .from('transport_drivers')
        .select(`*, user:user_id (full_name, email)`)
        .eq('school_id', schoolId);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// ======================================
// 3. ROUTES & ASSIGNMENT
// ======================================
exports.transportRouter.post('/routes', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { name } = req.body;
    const { data, error } = await supabase_1.supabase.from('transport_routes').insert({ school_id: schoolId, name }).select().single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
exports.transportRouter.get('/routes', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { data: routes, error } = await supabase_1.supabase
        .from('transport_routes')
        .select(`
                *,
                route_vehicles (
                    vehicle:vehicle_id (id, vehicle_no, capacity),
                    driver:driver_id (id, user:user_id(full_name))
                ),
                transport_route_stops (
                    id, stop_order, morning_time, evening_time,
                    stop:stop_id (id, name, latitude, longitude)
                )
            `)
        .eq('school_id', schoolId)
        .order('name');
    if (error)
        return res.status(500).json({ error: error.message });
    const { data: counts } = await supabase_1.supabase.from('transport_student_assignment').select('route_id');
    const routesWithStats = routes?.map((r) => {
        const totalCapacity = r.route_vehicles?.reduce((sum, rv) => sum + (rv.vehicle?.capacity || 0), 0) || 0;
        const assignedCount = counts?.filter((c) => c.route_id === r.id).length || 0;
        if (r.transport_route_stops) {
            r.transport_route_stops.sort((a, b) => a.stop_order - b.stop_order);
        }
        return {
            ...r,
            stats: {
                capacity: totalCapacity,
                assigned: assignedCount,
                utilization: totalCapacity > 0 ? Math.round((assignedCount / totalCapacity) * 100) : 0
            }
        };
    });
    res.json(routesWithStats);
});
// Helper: Check if a route has an active trip
// Returns TRUE if trip is STARTED or IN_PROGRESS (and not ended)
const hasActiveTrip = async (routeId) => {
    const { count } = await supabase_1.supabase
        .from('transport_trips')
        .select('id', { count: 'exact', head: true })
        .eq('route_id', routeId)
        .in('status', ['LIVE']) // LIVE = Started/In-Progress
        .is('completed_at', null);
    return (count || 0) > 0;
};
exports.transportRouter.post('/routes/:id/stops', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const { id: routeId } = req.params;
    const { stops } = req.body;
    if (!stops || !Array.isArray(stops))
        return res.status(400).json({ error: "Invalid stops data" });
    // PHASE 3 GUARD: Check for active trips
    const isLive = await hasActiveTrip(routeId);
    if (isLive) {
        return res.status(409).json({
            error: "Configuration Locked: Cannot modify route stops while a trip is currently active.",
            code: "TRIP_ACTIVE"
        });
    }
    const upsertData = stops.map((s) => ({
        route_id: routeId,
        stop_id: s.stop_id,
        stop_order: s.stop_order,
        morning_time: s.morning_time,
        evening_time: s.evening_time
    }));
    const { data, error } = await supabase_1.supabase
        .from('transport_route_stops')
        .upsert(upsertData, { onConflict: 'route_id, stop_order' })
        .select();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
exports.transportRouter.post('/vehicles', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { vehicle_no, capacity } = req.body;
    const { data, error } = await supabase_1.supabase.from('transport_vehicles').insert({ school_id: schoolId, vehicle_no, capacity }).select().single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
exports.transportRouter.get('/vehicles', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase.from('transport_vehicles').select('*').eq('school_id', schoolId);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
exports.transportRouter.post('/routes/:id/assign-vehicle', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const { id: routeId } = req.params;
    const { vehicle_id, driver_id } = req.body;
    if (driver_id) {
        const { count } = await supabase_1.supabase
            .from('route_vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('driver_id', driver_id);
        if ((count || 0) > 0)
            return res.status(400).json({ error: "Driver is already assigned to an active route." });
    }
    const { data, error } = await supabase_1.supabase
        .from('route_vehicles')
        .insert({ route_id: routeId, vehicle_id, driver_id: driver_id || null })
        .select().single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
exports.transportRouter.post('/assign', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const { student_id, route_id, stop_id, pickup_mode } = req.body;
    const { data: routeVehicles } = await supabase_1.supabase.from('route_vehicles').select('vehicle:vehicle_id(capacity)').eq('route_id', route_id);
    const totalCap = routeVehicles?.reduce((sum, rv) => sum + (rv.vehicle?.capacity || 0), 0) || 0;
    const { count } = await supabase_1.supabase.from('transport_student_assignment').select('*', { count: 'exact', head: true }).eq('route_id', route_id);
    if ((count || 0) >= totalCap)
        return res.status(400).json({ error: "Vehicle capacity exceeded for this route." });
    const { data, error } = await supabase_1.supabase
        .from('transport_student_assignment')
        .upsert({ student_id, route_id, stop_id, pickup_mode: pickup_mode || 'BOTH', assigned_at: new Date().toISOString() })
        .select().single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
exports.transportRouter.post('/assign/bulk', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const { student_ids, route_id, stop_id, pickup_mode } = req.body;
    if (!student_ids?.length)
        return res.status(400).json({ error: "No students selected" });
    const { data: routeVehicles } = await supabase_1.supabase.from('route_vehicles').select('vehicle:vehicle_id(capacity)').eq('route_id', route_id);
    const totalCap = routeVehicles?.reduce((sum, rv) => sum + (rv.vehicle?.capacity || 0), 0) || 0;
    const { count } = await supabase_1.supabase.from('transport_student_assignment').select('*', { count: 'exact', head: true }).eq('route_id', route_id);
    if ((count || 0) + student_ids.length > totalCap)
        return res.status(400).json({ error: `Capacity exceeded.` });
    const upsertData = student_ids.map((sid) => ({
        student_id: sid, route_id, stop_id, pickup_mode: pickup_mode || 'BOTH', assigned_at: new Date().toISOString()
    }));
    const { data, error } = await supabase_1.supabase.from('transport_student_assignment').upsert(upsertData).select();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
exports.transportRouter.get('/routes/:id/manifest', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const { id: routeId } = req.params;
    const schoolId = req.context.user.school_id;
    const today = new Date().toISOString().split('T')[0];
    const { data: route } = await supabase_1.supabase
        .from('transport_routes')
        .select(`name, route_vehicles (vehicle:vehicle_id (vehicle_no), driver:driver_id (user:user_id(full_name))), transport_route_stops (id, stop_order, morning_time, evening_time, stop:stop_id (name))`)
        .eq('id', routeId).eq('school_id', schoolId).single();
    if (!route)
        return res.status(404).json({ error: "Route not found" });
    // 1. Get Base Assignments
    const { data: assignments } = await supabase_1.supabase
        .from('transport_student_assignment')
        .select(`pickup_mode, stop_id, student_id, student:student_id (full_name, student_code, class_id)`)
        .eq('route_id', routeId);
    // 2. PHASE 5: Fetch Daily Attendance Exemptions (Opt-outs)
    const studentIds = assignments?.map((a) => a.student_id) || [];
    const { data: exemptions } = await supabase_1.supabase
        .from('student_transport_attendance')
        .select('student_id, pickup_disabled, drop_disabled')
        .in('student_id', studentIds)
        .eq('trip_date', today);
    // 3. Filter Students based on Exemptions
    const stops = route.transport_route_stops?.sort((a, b) => a.stop_order - b.stop_order).map((rs) => {
        const studentsAtStop = assignments?.filter((a) => a.stop_id === rs.stop.id) || [];
        // Apply filtering logic for Manifest
        const activeStudents = studentsAtStop.map((s) => {
            const exemption = exemptions?.find((e) => e.student_id === s.student_id);
            return {
                ...s,
                // If exemption exists, we flag it. Frontend can strike-through or hide.
                // For safety, we keep them in list but mark as "ABSENT" contextually.
                today_pickup: exemption?.pickup_disabled ? false : true,
                today_drop: exemption?.drop_disabled ? false : true
            };
        });
        return { ...rs, students: activeStudents };
    });
    res.json({ route_name: route.name, vehicles: route.route_vehicles, stops: stops });
});
// ======================================
// 12. TRANSPORT ATTENDANCE (PHASE T10)
// ======================================
exports.transportRouter.post('/attendance/disable', 
// Parent or Admin can call this (RLS handles security)
(0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRANSPORT_VIEW_SELF), async (req, res) => {
    const { student_id, trip_date, pickup_disabled, drop_disabled, reason } = req.body;
    const validDate = trip_date || new Date().toISOString().split('T')[0];
    // Ensure date is not in past (Logic Check)
    if (new Date(validDate) < new Date(new Date().toDateString())) {
        return res.status(400).json({ error: "Cannot modify attendance for past dates." });
    }
    const { data, error } = await supabase_1.supabase
        .from('student_transport_attendance')
        .upsert({
        student_id,
        trip_date: validDate,
        pickup_disabled,
        drop_disabled,
        reason,
        marked_at: new Date().toISOString(),
        marked_by: req.context.user.id
    }, { onConflict: 'student_id, trip_date' })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// ======================================
// 5. PARENT VIEW
// ======================================
exports.transportRouter.get('/my', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRANSPORT_VIEW_SELF), async (req, res) => {
    const userId = req.context.user.id;
    const { data: links } = await supabase_1.supabase.from('student_parents').select('student_id').eq('parent_user_id', userId);
    if (!links || links.length === 0)
        return res.json([]);
    const results = [];
    for (const link of links) {
        const { data: student } = await supabase_1.supabase.from('students').select('full_name, student_code, class_id').eq('id', link.student_id).single();
        const { data: assignmentData } = await supabase_1.supabase
            .from('transport_student_assignment')
            .select(`id, pickup_mode, route:route_id (name), stop:stop_id (name, latitude, longitude), route_details:route_id (route_vehicles (vehicle:vehicle_id (vehicle_no)), transport_route_stops (stop_order, morning_time, evening_time, stop_id))`)
            .eq('student_id', link.student_id).single();
        const assignment = assignmentData;
        results.push({
            student,
            has_assignment: !!assignment,
            route_name: assignment?.route?.name || null,
            stop_name: assignment?.stop?.name || null,
            vehicle_no: assignment?.route_details?.route_vehicles?.[0]?.vehicle?.vehicle_no || "To Be Assigned",
            status_message: assignment ? "Transport Assigned." : "No Transport Assigned"
        });
    }
    res.json(results);
});
exports.transportRouter.get('/my/timeline', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRANSPORT_VIEW_SELF), async (req, res) => {
    const userId = req.context.user.id;
    // Parents can see timelines for their children
    const { data: links } = await supabase_1.supabase.from('student_parents').select('student_id').eq('parent_user_id', userId);
    if (!links?.length)
        return res.json([]);
    const studentIds = links.map((l) => l.student_id);
    // Fetch from Timeline View
    const { data: timeline } = await supabase_1.supabase
        .from('transport_student_timeline')
        .select('*')
        .in('student_id', studentIds)
        .order('timestamp', { ascending: false })
        .limit(50);
    res.json(timeline);
});
// ======================================
// 6. TRIP OPS (DRIVER) & NOTIFICATIONS
// ======================================
exports.transportRouter.get('/trips/today', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_VIEW_SELF), async (req, res) => {
    const userId = req.context.user.id;
    const today = new Date().toISOString().split('T')[0];
    const { data: driver } = await supabase_1.supabase.from('transport_drivers').select('id').eq('user_id', userId).single();
    if (!driver)
        return res.status(403).json({ error: "Not a registered driver" });
    const { data: schedule } = await supabase_1.supabase.from('route_vehicles')
        .select(`route_id, vehicle_id, route:route_id (name, transport_route_stops(count)), vehicle:vehicle_id (vehicle_no)`)
        .eq('driver_id', driver.id);
    if (!schedule?.length)
        return res.json([]);
    const results = [];
    for (const slot of schedule) {
        for (const type of ['MORNING', 'EVENING']) {
            const { data: trip } = await supabase_1.supabase.from('transport_trips')
                .select('*').eq('driver_id', driver.id).eq('route_id', slot.route_id).eq('trip_date', today).eq('trip_type', type).single();
            results.push({ type, schedule: slot, trip: trip || null, status: trip?.status || 'SCHEDULED' });
        }
    }
    res.json(results);
});
// ======================================
// 6a. SAFETY CHECKLIST (PHASE T9)
// ======================================
exports.transportRouter.post('/trips/check', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_EXECUTE), async (req, res) => {
    const userId = req.context.user.id;
    // trip_id is conceptual here (calculated from schedule) or passed if generated
    const { vehicle_id, fuel_level, tyres_ok, brakes_ok, lights_ok, cleanliness_ok, remarks, trip_identifier_id } = req.body;
    const { data: driver } = await supabase_1.supabase.from('transport_drivers').select('id').eq('user_id', userId).single();
    if (!driver)
        return res.status(403).json({ error: "Access Denied" });
    // We use a temporary UUID or the actual trip ID if it exists (but usually trip is created AFTER check)
    // For 'trip_id', we will store a placeholder or link if the frontend generates ID first. 
    // Better: We store the check, and when trip starts, we link it. 
    // BUT, simplified flow: 
    // 1. Driver clicks "Start Trip"
    // 2. UI shows Checklist
    // 3. Driver submits Checklist -> creates check record
    // 4. Driver submits Start Trip -> verifies check record
    const { data, error } = await supabase_1.supabase.from('transport_vehicle_checks').insert({
        trip_id: trip_identifier_id, // Front-end generated UUID for the session
        vehicle_id,
        driver_id: driver.id,
        fuel_level, tyres_ok, brakes_ok, lights_ok, cleanliness_ok, remarks
    }).select().single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
exports.transportRouter.post('/trips/start', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_EXECUTE), async (req, res) => {
    const userId = req.context.user.id;
    const { route_id, vehicle_id, trip_type, trip_identifier_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const { data: driver } = await supabase_1.supabase.from('transport_drivers').select('id').eq('user_id', userId).single();
    if (!driver)
        return res.status(403).json({ error: "Access Denied" });
    const { data: active } = await supabase_1.supabase.from('transport_trips').select('id').eq('driver_id', driver.id).eq('status', 'LIVE').single();
    if (active)
        return res.status(400).json({ error: "End current trip first." });
    // PHASE 4 GUARD: Check for Safety Checklist
    if (trip_identifier_id) {
        const { count } = await supabase_1.supabase.from('transport_vehicle_checks')
            .select('*', { count: 'exact', head: true })
            .eq('trip_id', trip_identifier_id);
        if (!count || count === 0) {
            return res.status(409).json({
                error: "Safety Checklist Required: Please complete the vehicle check before starting.",
                code: "CHECKLIST_REQUIRED"
            });
        }
    }
    else {
        // If no identifier provided, we assume legacy app version and ALLOW (Safe Default)
        // or Block if strictness required. Let's Warn.
        console.warn("Trip started without safety check identifier.");
    }
    const { data: trip, error } = await supabase_1.supabase.from('transport_trips')
        .insert({ school_id: req.context.user.school_id, driver_id: driver.id, route_id, vehicle_id, trip_type, trip_date: today, status: 'LIVE', started_at: new Date().toISOString() })
        .select().single();
    if (error)
        return res.status(500).json({ error: error.message });
    await supabase_1.supabase.from('transport_trip_events').insert({ trip_id: trip.id, event_type: 'TRIP_STARTED' });
    const msg = trip_type === 'MORNING' ? 'Bus has started school trip.' : 'Bus has left school.';
    notification_service_1.NotificationService.notifyRouteSubscribers(route_id, 'Bus Update', msg);
    res.json(trip);
});
exports.transportRouter.post('/trips/:id/event', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_EXECUTE), async (req, res) => {
    const { id: tripId } = req.params;
    const { event_type, stop_id, student_id, latitude, longitude } = req.body;
    const { error } = await supabase_1.supabase.from('transport_trip_events').insert({
        trip_id: tripId, event_type, stop_id: stop_id || null, student_id: student_id || null,
        latitude, longitude, timestamp: new Date().toISOString()
    });
    if (error)
        return res.status(500).json({ error: error.message });
    const { data: trip } = await supabase_1.supabase.from('transport_trips').select('trip_type').eq('id', tripId).single();
    if (event_type === 'TRIP_COMPLETED') {
        await supabase_1.supabase.from('transport_trips').update({ status: 'COMPLETED', completed_at: new Date().toISOString() }).eq('id', tripId);
    }
    else if (event_type === 'STUDENT_BOARDED' && student_id && trip) {
        const msg = trip.trip_type === 'MORNING' ? 'Student boarded the bus.' : 'Student boarded bus from school.';
        notification_service_1.NotificationService.notifyStudentParents(student_id, 'Transport Update', msg);
    }
    else if (event_type === 'STUDENT_DROPPED' && student_id && trip) {
        const msg = trip.trip_type === 'MORNING' ? 'Student reached school.' : 'Student reached home.';
        notification_service_1.NotificationService.notifyStudentParents(student_id, 'Transport Update', msg);
    }
    res.json({ success: true });
});
exports.transportRouter.get('/trips/live', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_MONITOR), async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase_1.supabase
        .from('transport_trips')
        .select(`*, driver:driver_id (user:user_id(full_name)), vehicle:vehicle_id (vehicle_no), route:route_id (name)`)
        .eq('school_id', req.context.user.school_id).eq('trip_date', today);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// ======================================
// 10. ANALYTICS (PHASE T7)
// ======================================
exports.transportRouter.get('/analytics/punctuality', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_MONITOR), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase
        .from('transport_route_on_time_stats')
        .select('*')
        .eq('school_id', schoolId);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
exports.transportRouter.get('/analytics/delays', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_MONITOR), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase
        .from('transport_trip_delay_summary')
        .select('*')
        .eq('school_id', schoolId);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
exports.transportRouter.get('/analytics/pickups', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_MONITOR), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase
        .from('transport_student_pickup_accuracy')
        .select('*')
        .eq('school_id', schoolId)
        .limit(100);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
exports.transportRouter.get('/incidents/recent', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_MONITOR), async (req, res) => {
    const { data, error } = await supabase_1.supabase
        .from('transport_trip_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data || []);
});
// ======================================
// 7. LOCATION TRACKING (PHASE T5)
// ======================================
// DRIVER PING
exports.transportRouter.post('/trips/:id/location', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_EXECUTE), async (req, res) => {
    const { id: tripId } = req.params;
    const { latitude, longitude, heading } = req.body;
    const { error } = await supabase_1.supabase.from('transport_trip_locations').insert({
        trip_id: tripId,
        latitude,
        longitude,
        heading,
        recorded_at: new Date().toISOString()
    });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json({ success: true });
});
// GET LIVE LOCATION (Polled by Parent/Admin)
exports.transportRouter.get('/trips/:id/location', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRANSPORT_VIEW), async (req, res) => {
    const { id: tripId } = req.params;
    const userId = req.context.user.id;
    const roles = req.context.user.roles;
    let isAuthorized = false;
    if (roles.includes('ADMIN') || roles.includes('TRANSPORT_ADMIN')) {
        isAuthorized = true;
    }
    else if (roles.includes('PARENT')) {
        const { data: trip } = await supabase_1.supabase.from('transport_trips').select('route_id, status').eq('id', tripId).single();
        if (!trip || trip.status !== 'LIVE')
            return res.status(404).json({ error: "Tracking not available (Trip not live)" });
        const { data: links } = await supabase_1.supabase.from('student_parents').select('student_id').eq('parent_user_id', userId);
        const studentIds = links?.map((l) => l.student_id) || [];
        if (studentIds.length === 0)
            return res.status(403).json({ error: "Unauthorized" });
        const { count } = await supabase_1.supabase.from('transport_student_assignment')
            .select('*', { count: 'exact', head: true })
            .in('student_id', studentIds).eq('route_id', trip.route_id);
        if (count && count > 0)
            isAuthorized = true;
    }
    if (!isAuthorized)
        return res.status(403).json({ error: "Unauthorized to track this trip" });
    const { data, error } = await supabase_1.supabase
        .from('transport_trip_locations')
        .select('latitude, longitude, heading, recorded_at')
        .eq('trip_id', tripId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
    if (error && error.code !== 'PGRST116')
        return res.status(500).json({ error: error.message });
    if (!data)
        return res.json({ location: null });
    res.json(data);
});
// ======================================
// 8. FEE INTEGRATION (PHASE T6)
// ======================================
exports.transportRouter.get('/fee-slabs', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase
        .from('transport_fee_slabs')
        .select('*')
        .eq('school_id', schoolId);
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
exports.transportRouter.post('/fee-slabs', (0, rbac_middleware_1.requireRole)(['ADMIN', 'TRANSPORT_ADMIN']), async (req, res) => {
    const schoolId = req.context.user.school_id;
    const { stop_id, academic_year_id, amount, currency } = req.body;
    const { data, error } = await supabase_1.supabase
        .from('transport_fee_slabs')
        .upsert({
        school_id: schoolId,
        stop_id,
        academic_year_id,
        amount,
        currency: currency || 'INR'
    }, { onConflict: 'academic_year_id, stop_id' })
        .select().single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// ======================================
// 11. CRISIS & EXCEPTIONS (PHASE T8)
// ======================================
exports.transportRouter.post('/trips/:id/exception', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.TRIP_MONITOR), async (req, res) => {
    const { id: tripId } = req.params;
    const { event_type, message, new_vehicle_id, new_driver_id } = req.body;
    try {
        // 1. Fetch Trip context
        const { data: trip } = await supabase_1.supabase.from('transport_trips').select('route_id, school_id').eq('id', tripId).single();
        if (!trip)
            return res.status(404).json({ error: "Trip not found" });
        // 2. Insert Exception Event
        const { error: eventErr } = await supabase_1.supabase.from('transport_trip_events').insert({
            trip_id: tripId,
            event_type,
            message,
            timestamp: new Date().toISOString()
        });
        if (eventErr)
            throw eventErr;
        // 3. Optional: Sub Assignment
        if (new_vehicle_id || new_driver_id) {
            const updates = {};
            if (new_vehicle_id)
                updates.vehicle_id = new_vehicle_id;
            if (new_driver_id)
                updates.driver_id = new_driver_id;
            await supabase_1.supabase.from('transport_trips').update(updates).eq('id', tripId);
        }
        // 4. Notify Parents
        const title = event_type === 'VEHICLE_BREAKDOWN' ? '🚌 Transport Emergency' : '⚠️ Transport Update';
        notification_service_1.NotificationService.notifyRouteSubscribers(trip.route_id, title, message);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
