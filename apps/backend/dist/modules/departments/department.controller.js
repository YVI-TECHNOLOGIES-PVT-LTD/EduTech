"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentController = void 0;
const department_service_1 = require("./department.service");
const zod_1 = require("zod");
class DepartmentController {
    static getTenantId(req) {
        return (req.context?.user?.org_id ||
            req.context?.user?.school_id ||
            req.user?.org_id ||
            req.user?.school_id ||
            null);
    }
    // GET /
    static async getAll(req, res) {
        try {
            const schoolId = DepartmentController.getTenantId(req);
            if (!schoolId)
                return res.status(400).json({ message: 'School ID not found in context' });
            const departments = await department_service_1.DepartmentService.getAll(schoolId);
            return res.json(departments);
        }
        catch (err) {
            console.error(err);
            return res.status(500).json({ message: err.message });
        }
    }
    // POST /
    static async create(req, res) {
        try {
            const schoolId = DepartmentController.getTenantId(req);
            if (!schoolId)
                return res.status(400).json({ message: 'School ID not found' });
            const parsed = DepartmentController.schema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
            }
            const dept = await department_service_1.DepartmentService.create(schoolId, parsed.data.name, parsed.data.description);
            return res.status(201).json(dept);
        }
        catch (err) {
            if (err.message.includes('already exists')) {
                return res.status(409).json({ message: err.message });
            }
            return res.status(500).json({ message: err.message });
        }
    }
    // PUT /:id
    static async update(req, res) {
        try {
            const { id } = req.params;
            const schoolId = DepartmentController.getTenantId(req);
            if (!schoolId)
                return res.status(400).json({ message: 'School ID not found' });
            const parsed = DepartmentController.schema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
            }
            const dept = await department_service_1.DepartmentService.update(id, schoolId, parsed.data.name, parsed.data.description);
            return res.json(dept);
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return res.status(404).json({ message: err.message });
            }
            if (err.message.includes('already exists')) {
                return res.status(409).json({ message: err.message });
            }
            return res.status(500).json({ message: err.message });
        }
    }
    // DELETE /:id
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const schoolId = DepartmentController.getTenantId(req);
            if (!schoolId)
                return res.status(400).json({ message: 'School ID not found' });
            await department_service_1.DepartmentService.delete(id, schoolId);
            return res.json({ message: 'Department deleted successfully' });
        }
        catch (err) {
            if (err.message.includes('not found')) {
                return res.status(404).json({ message: err.message });
            }
            if (err.message.includes('Cannot delete department')) {
                return res.status(409).json({ message: err.message });
            }
            return res.status(500).json({ message: err.message });
        }
    }
}
exports.DepartmentController = DepartmentController;
// Schema for Create/Update
DepartmentController.schema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').trim(),
    description: zod_1.z.string().optional().nullable(),
});
