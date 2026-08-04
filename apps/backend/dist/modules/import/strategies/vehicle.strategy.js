"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleImportStrategy = void 0;
const supabase_1 = require("../../../config/supabase");
const zod_1 = require("zod");
// Schema for a single row
const VehicleRowSchema = zod_1.z.object({
    vehicle_no: zod_1.z.string().min(1, "Vehicle Number is required").transform(val => val.trim().toUpperCase()),
    // Validate vehicle_type existence but do not persist as per schema restrictions
    vehicle_type: zod_1.z.string().min(1, "Vehicle Type is required"),
    capacity: zod_1.z.preprocess((val) => parseInt(String(val), 10), zod_1.z.number().int("Capacity must be an integer").min(1, "Capacity must be greater than 0"))
});
class VehicleImportStrategy {
    async validate(rows, schoolId) {
        const result = {
            isValid: true,
            totalRows: rows.length,
            validRows: [],
            failedRows: []
        };
        // 1. Bulk verify uniqueness of vehicle_no (Performance optimization)
        // Normalize upstream keys or in map? We'll normalize in loop first to match DB style.
        const normalizedRows = rows.map((r, i) => ({
            ...r,
            _originalIndex: i + 1,
            vehicle_no: r.vehicle_no ? String(r.vehicle_no).trim().toUpperCase() : ''
        }));
        const vehicleNos = normalizedRows.map(r => r.vehicle_no).filter(Boolean);
        let existingVehicles = new Set();
        if (vehicleNos.length > 0) {
            const { data } = await supabase_1.supabase
                .from('transport_vehicles')
                .select('vehicle_no')
                .eq('school_id', schoolId)
                .in('vehicle_no', vehicleNos);
            if (data) {
                data.forEach((v) => existingVehicles.add(v.vehicle_no));
            }
        }
        const seenInBatch = new Set();
        // 2. Row-by-row validation
        for (const row of normalizedRows) {
            const rowNum = row._originalIndex;
            const errors = [];
            const originalData = rows[rowNum - 1]; // Keep original for report
            // Zod Validation
            const parsed = VehicleRowSchema.safeParse(originalData);
            if (!parsed.success) {
                parsed.error.errors.forEach(err => {
                    errors.push({
                        row: rowNum,
                        column: err.path.join('.'),
                        message: err.message,
                        value: originalData[err.path[0]]
                    });
                });
            }
            else {
                // Logic Validation & Duplicates
                const normalizedNo = parsed.data.vehicle_no;
                // Check DB duplicates
                if (existingVehicles.has(normalizedNo)) {
                    errors.push({
                        row: rowNum,
                        column: 'vehicle_no',
                        message: `Vehicle Number '${normalizedNo}' already exists in system`,
                        value: normalizedNo
                    });
                }
                // Check Batch duplicates
                if (seenInBatch.has(normalizedNo)) {
                    errors.push({
                        row: rowNum,
                        column: 'vehicle_no',
                        message: `Duplicate Vehicle Number '${normalizedNo}' inside this file`,
                        value: normalizedNo
                    });
                }
                seenInBatch.add(normalizedNo);
            }
            if (errors.length > 0) {
                result.failedRows.push({ row: rowNum, errors, data: originalData });
            }
            else {
                // Return Valid Row with parsed/normalized data
                result.validRows.push({
                    ...parsed.data,
                    _rowNum: rowNum
                });
            }
        }
        result.isValid = result.failedRows.length === 0;
        return result;
    }
    async execute(validRows, context) {
        const result = {
            totalRows: validRows.length,
            successCount: 0,
            failedCount: 0,
            failedRows: []
        };
        // Execute Sequentially for safety (Best-Effort)
        for (const row of validRows) {
            try {
                // Payload for DB (excluding vehicle_type as it is not in valid schema currently)
                // If DB had vehicle_type, we would add it here.
                const vehiclePayload = {
                    school_id: context.schoolId,
                    vehicle_no: row.vehicle_no,
                    capacity: row.capacity
                };
                const { error } = await supabase_1.supabase
                    .from('transport_vehicles')
                    .insert(vehiclePayload);
                if (error)
                    throw new Error(error.message);
                result.successCount++;
            }
            catch (err) {
                result.failedCount++;
                result.failedRows.push({
                    row: row._rowNum || 0,
                    errors: [{ row: row._rowNum || 0, message: err.message, value: 'DB_INSERT_FAIL' }],
                    data: row
                });
            }
        }
        return result;
    }
}
exports.VehicleImportStrategy = VehicleImportStrategy;
