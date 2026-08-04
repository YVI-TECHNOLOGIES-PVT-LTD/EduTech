import { Request, Response } from 'express';
import { DepartmentService } from './department.service';
import { z } from 'zod';

export class DepartmentController {

    // Schema for Create/Update
    private static schema = z.object({
        name: z.string().min(1, "Name is required").trim()
    });

    // GET /
    static async getAll(req: Request, res: Response) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId) return res.status(400).json({ message: "School ID not found in context" });

            const departments = await DepartmentService.getAll(schoolId);
            res.json(departments);
        } catch (err: any) {
            console.error(err);
            res.status(500).json({ message: err.message });
        }
    }

    // POST /
    static async create(req: Request, res: Response) {
        try {
            const schoolId = req.context?.user?.school_id;
            if (!schoolId) return res.status(400).json({ message: "School ID not found" });

            const parsed = DepartmentController.schema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Validation error", errors: parsed.error.errors });
            }

            const dept = await DepartmentService.create(schoolId, parsed.data.name);
            res.status(201).json(dept);
        } catch (err: any) {
            if (err.message.includes('already exists')) {
                return res.status(409).json({ message: err.message });
            }
            res.status(500).json({ message: err.message });
        }
    }

    // PUT /:id
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId) return res.status(400).json({ message: "School ID not found" });

            const parsed = DepartmentController.schema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: "Validation error", errors: parsed.error.errors });
            }

            const dept = await DepartmentService.update(id, schoolId, parsed.data.name);
            res.json(dept);
        } catch (err: any) {
            if (err.message.includes('already exists')) {
                return res.status(409).json({ message: err.message });
            }
            res.status(500).json({ message: err.message });
        }
    }

    // DELETE /:id
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const schoolId = req.context?.user?.school_id;
            if (!schoolId) return res.status(400).json({ message: "School ID not found" });

            await DepartmentService.delete(id, schoolId);
            res.json({ message: "Department deleted successfully" });
        } catch (err: any) {
            // Updated string match to align with service error message
            if (err.message.includes('Cannot delete department')) {
                return res.status(409).json({ message: err.message });
            }
            res.status(500).json({ message: err.message });
        }
    }
}
