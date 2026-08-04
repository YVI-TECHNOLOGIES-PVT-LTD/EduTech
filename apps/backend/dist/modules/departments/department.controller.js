"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentController = void 0;
const department_service_1 = require("./department.service");
const zod_1 = require("zod");
class DepartmentController {
    // GET /
    static async getAll(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ message: "School ID not found in context" });
            const departments = await department_service_1.DepartmentService.getAll(schoolId);
            res.json(departments);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    }
    // POST /
    static async create(req, res) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ message: "School ID not found" });
            const parsed = DepartmentController.schema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Validation error", errors: parsed.error.errors });
            }
            const dept = await department_service_1.DepartmentService.create(schoolId, parsed.data.name);
            res.status(201).json(dept);
        }
        catch (err) {
            if (err.message.includes('already exists')) {
                return res.status(409).json({ message: err.message });
            }
            res.status(500).json({ message: err.message });
        }
    }
    // PUT /:id
    static async update(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ message: "School ID not found" });
            const parsed = DepartmentController.schema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Validation error", errors: parsed.error.errors });
            }
            const dept = await department_service_1.DepartmentService.update(id, schoolId, parsed.data.name);
            res.json(dept);
        }
        catch (err) {
            if (err.message.includes('already exists')) {
                return res.status(409).json({ message: err.message });
            }
            res.status(500).json({ message: err.message });
        }
    }
    // DELETE /:id
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId)
                return res.status(400).json({ message: "School ID not found" });
            await department_service_1.DepartmentService.delete(id, schoolId);
            res.json({ message: "Department deleted successfully" });
        }
        catch (err) {
            // Updated string match to align with service error message
            if (err.message.includes('Cannot delete department')) {
                return res.status(409).json({ message: err.message });
            }
            res.status(500).json({ message: err.message });
        }
    }
}
exports.DepartmentController = DepartmentController;
// Schema for Create/Update
DepartmentController.schema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").trim()
});
