import { ImportStrategy, ValidationSummary, ExecutionSummary } from '../import.types';
import { supabase } from '../../../config/supabase';
import { z } from 'zod';

// Schema for a single row
const VehicleRowSchema = z.object({
    vehicle_no: z.string().min(1, "Vehicle Number is required").transform(val => val.trim().toUpperCase()),
    // Validate vehicle_type existence but do not persist as per schema restrictions
    vehicle_type: z.string().min(1, "Vehicle Type is required"),
    capacity: z.preprocess(
        (val) => parseInt(String(val), 10),
        z.number().int("Capacity must be an integer").min(1, "Capacity must be greater than 0")
    )
});

export class VehicleImportStrategy implements ImportStrategy {

    async validate(rows: any[], schoolId: string): Promise<ValidationSummary> {
        const result: ValidationSummary = {
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

        let existingVehicles = new Set<string>();
        if (vehicleNos.length > 0) {
            const { data } = await supabase
                .from('transport_vehicles')
                .select('vehicle_no')
                .eq('school_id', schoolId)
                .in('vehicle_no', vehicleNos);

            if (data) {
                data.forEach((v: any) => existingVehicles.add(v.vehicle_no));
            }
        }

        const seenInBatch = new Set<string>();

        // 2. Row-by-row validation
        for (const row of normalizedRows) {
            const rowNum = row._originalIndex;
            const errors: any[] = [];
            const originalData = rows[rowNum - 1]; // Keep original for report

            // Zod Validation
            const parsed = VehicleRowSchema.safeParse(originalData);

            if (!parsed.success) {
                parsed.error.errors.forEach(err => {
                    errors.push({
                        row: rowNum,
                        column: err.path.join('.'),
                        message: err.message,
                        value: originalData[err.path[0] as string]
                    });
                });
            } else {
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
            } else {
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

    async execute(validRows: any[], context: { schoolId: string; userId: string; jobId: string }): Promise<ExecutionSummary> {
        const result: ExecutionSummary = {
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

                const { error } = await supabase
                    .from('transport_vehicles')
                    .insert(vehiclePayload);

                if (error) throw new Error(error.message);

                result.successCount++;

            } catch (err: any) {
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
