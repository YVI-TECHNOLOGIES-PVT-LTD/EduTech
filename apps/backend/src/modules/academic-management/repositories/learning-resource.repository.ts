import prisma from '../../../lib/prismaClient';
import { ListResourcesDto } from '../dto/request/search-resource.dto';

export interface LearningResourceRow {
  resource_id: string;
  org_id: string;
  title: string;
  description: string | null;
  resource_type: 'file' | 'external_link';
  storage_bucket: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size_bytes: string | number | bigint | null;
  mime_type: string | null;
  external_url: string | null;
  category_id: string | null;
  uploaded_by_staff_id: string;
  resource_status: 'draft' | 'published' | 'archived';
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
  category_name?: string | null;
  category_code?: string | null;
  grades?: Array<{ grade_id: string; grade_name: string; grade_code: string }>;
}

export interface ResourceCategoryRow {
  category_id: string;
  org_id: string;
  category_name: string;
  category_code: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: Date;
}

export class LearningResourceRepository {
  /**
   * Find paginated resources for an organization with optional filters
   */
  static async findMany(orgId: string, filters: ListResourcesDto): Promise<LearningResourceRow[]> {
    const params: any[] = [orgId];
    const whereClauses: string[] = ['r.org_id = $1::uuid'];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      const pIdx = params.length;
      whereClauses.push(
        `(r.title ILIKE $${pIdx} OR r.file_name ILIKE $${pIdx} OR r.description ILIKE $${pIdx})`,
      );
    }

    if (filters.category_id) {
      params.push(filters.category_id);
      whereClauses.push(`r.category_id = $${params.length}::uuid`);
    }

    if (filters.grade_id) {
      params.push(filters.grade_id);
      whereClauses.push(
        `EXISTS (
          SELECT 1 FROM learning_resource_grades lrg
          WHERE lrg.resource_id = r.resource_id AND lrg.grade_id = $${params.length}::uuid
        )`,
      );
    }

    if (filters.mime_type) {
      params.push(filters.mime_type);
      whereClauses.push(`r.mime_type = $${params.length}`);
    }

    if (filters.resource_type) {
      params.push(filters.resource_type);
      whereClauses.push(`r.resource_type = $${params.length}::resource_type`);
    }

    if (filters.status) {
      params.push(filters.status);
      whereClauses.push(`r.resource_status = $${params.length}::resource_status`);
    }

    const sortColumn = ['title', 'file_size_bytes', 'created_at'].includes(filters.sort_by)
      ? filters.sort_by
      : 'created_at';
    const sortDirection = filters.sort_order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const offset = Math.max(0, ((filters.page || 1) - 1) * limit);

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const sql = `
      SELECT 
        r.resource_id,
        r.org_id,
        r.title,
        r.description,
        r.resource_type,
        r.storage_bucket,
        r.storage_path,
        r.file_name,
        r.file_size_bytes,
        r.mime_type,
        r.external_url,
        r.category_id,
        r.uploaded_by_staff_id,
        r.resource_status,
        r.created_at,
        r.created_by,
        r.updated_at,
        r.updated_by,
        rc.category_name,
        rc.category_code,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'grade_id', g.grade_id,
                'grade_name', g.grade_name,
                'grade_code', g.grade_code
              )
            )
            FROM learning_resource_grades lrg
            JOIN grades g ON g.grade_id = lrg.grade_id
            WHERE lrg.resource_id = r.resource_id
          ),
          '[]'::json
        ) AS grades
      FROM learning_resources r
      LEFT JOIN resource_categories rc 
        ON rc.category_id = r.category_id AND rc.org_id = r.org_id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY r.${sortColumn} ${sortDirection}
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    return (await prisma.$queryRawUnsafe(sql, ...params)) as LearningResourceRow[];
  }

  /**
   * Count total resources matching filters for an organization
   */
  static async count(orgId: string, filters: ListResourcesDto): Promise<number> {
    const params: any[] = [orgId];
    const whereClauses: string[] = ['r.org_id = $1::uuid'];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      const pIdx = params.length;
      whereClauses.push(
        `(r.title ILIKE $${pIdx} OR r.file_name ILIKE $${pIdx} OR r.description ILIKE $${pIdx})`,
      );
    }

    if (filters.category_id) {
      params.push(filters.category_id);
      whereClauses.push(`r.category_id = $${params.length}::uuid`);
    }

    if (filters.grade_id) {
      params.push(filters.grade_id);
      whereClauses.push(
        `EXISTS (
          SELECT 1 FROM learning_resource_grades lrg
          WHERE lrg.resource_id = r.resource_id AND lrg.grade_id = $${params.length}::uuid
        )`,
      );
    }

    if (filters.mime_type) {
      params.push(filters.mime_type);
      whereClauses.push(`r.mime_type = $${params.length}`);
    }

    if (filters.resource_type) {
      params.push(filters.resource_type);
      whereClauses.push(`r.resource_type = $${params.length}::resource_type`);
    }

    if (filters.status) {
      params.push(filters.status);
      whereClauses.push(`r.resource_status = $${params.length}::resource_status`);
    }

    const sql = `
      SELECT COUNT(*)::int as total
      FROM learning_resources r
      WHERE ${whereClauses.join(' AND ')};
    `;

    const res: any = await prisma.$queryRawUnsafe(sql, ...params);
    return res[0]?.total || 0;
  }

  /**
   * Find single resource by ID and organization
   */
  static async findById(orgId: string, resourceId: string): Promise<LearningResourceRow | null> {
    const sql = `
      SELECT 
        r.resource_id,
        r.org_id,
        r.title,
        r.description,
        r.resource_type,
        r.storage_bucket,
        r.storage_path,
        r.file_name,
        r.file_size_bytes,
        r.mime_type,
        r.external_url,
        r.category_id,
        r.uploaded_by_staff_id,
        r.resource_status,
        r.created_at,
        r.created_by,
        r.updated_at,
        r.updated_by,
        rc.category_name,
        rc.category_code,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'grade_id', g.grade_id,
                'grade_name', g.grade_name,
                'grade_code', g.grade_code
              )
            )
            FROM learning_resource_grades lrg
            JOIN grades g ON g.grade_id = lrg.grade_id
            WHERE lrg.resource_id = r.resource_id
          ),
          '[]'::json
        ) AS grades
      FROM learning_resources r
      LEFT JOIN resource_categories rc 
        ON rc.category_id = r.category_id AND rc.org_id = r.org_id
      WHERE r.resource_id = $1::uuid AND r.org_id = $2::uuid;
    `;

    const rows = (await prisma.$queryRawUnsafe(sql, resourceId, orgId)) as LearningResourceRow[];
    return rows[0] || null;
  }

  /**
   * Insert new learning resource record
   */
  static async create(data: {
    resourceId?: string;
    orgId: string;
    title: string;
    description?: string | null;
    resourceType: 'file' | 'external_link';
    storageBucket?: string | null;
    storagePath?: string | null;
    fileName?: string | null;
    fileSizeBytes?: number | bigint | null;
    mimeType?: string | null;
    externalUrl?: string | null;
    categoryId?: string | null;
    uploadedByStaffId: string;
    resourceStatus?: 'draft' | 'published' | 'archived';
    createdBy?: string | null;
  }): Promise<LearningResourceRow> {
    const sql = `
      INSERT INTO learning_resources (
        ${data.resourceId ? 'resource_id,' : ''}
        org_id,
        title,
        description,
        resource_type,
        storage_bucket,
        storage_path,
        file_name,
        file_size_bytes,
        mime_type,
        external_url,
        category_id,
        uploaded_by_staff_id,
        resource_status,
        created_by
      ) VALUES (
        ${data.resourceId ? '$1::uuid, $2::uuid,' : '$1::uuid,'}
        $${data.resourceId ? 3 : 2},
        $${data.resourceId ? 4 : 3},
        $${data.resourceId ? 5 : 4}::resource_type,
        $${data.resourceId ? 6 : 5},
        $${data.resourceId ? 7 : 6},
        $${data.resourceId ? 8 : 7},
        $${data.resourceId ? 9 : 8},
        $${data.resourceId ? 10 : 9},
        $${data.resourceId ? 11 : 10},
        $${data.resourceId ? 12 : 11}::uuid,
        $${data.resourceId ? 13 : 12}::uuid,
        $${data.resourceId ? 14 : 13}::resource_status,
        $${data.resourceId ? 15 : 14}::uuid
      )
      RETURNING *;
    `;

    const params: any[] = [];
    if (data.resourceId) params.push(data.resourceId);
    params.push(
      data.orgId,
      data.title,
      data.description || null,
      data.resourceType,
      data.storageBucket || null,
      data.storagePath || null,
      data.fileName || null,
      data.fileSizeBytes ? BigInt(data.fileSizeBytes) : null,
      data.mimeType || null,
      data.externalUrl || null,
      data.categoryId || null,
      data.uploadedByStaffId,
      data.resourceStatus || 'draft',
      data.createdBy || null,
    );

    const rows = (await prisma.$queryRawUnsafe(sql, ...params)) as LearningResourceRow[];
    return rows[0];
  }

  /**
   * Update existing resource metadata
   */
  static async update(
    orgId: string,
    resourceId: string,
    data: {
      title?: string;
      description?: string | null;
      categoryId?: string | null;
      resourceStatus?: 'draft' | 'published' | 'archived';
      updatedBy?: string | null;
    },
  ): Promise<LearningResourceRow | null> {
    const sets: string[] = ['updated_at = now()'];
    const params: any[] = [resourceId, orgId];

    if (data.title !== undefined) {
      params.push(data.title);
      sets.push(`title = $${params.length}`);
    }

    if (data.description !== undefined) {
      params.push(data.description);
      sets.push(`description = $${params.length}`);
    }

    if (data.categoryId !== undefined) {
      params.push(data.categoryId);
      sets.push(`category_id = $${params.length}::uuid`);
    }

    if (data.resourceStatus !== undefined) {
      params.push(data.resourceStatus);
      sets.push(`resource_status = $${params.length}::resource_status`);
    }

    if (data.updatedBy !== undefined) {
      params.push(data.updatedBy);
      sets.push(`updated_by = $${params.length}::uuid`);
    }

    const sql = `
      UPDATE learning_resources
      SET ${sets.join(', ')}
      WHERE resource_id = $1::uuid AND org_id = $2::uuid
      RETURNING *;
    `;

    const rows = (await prisma.$queryRawUnsafe(sql, ...params)) as LearningResourceRow[];
    return rows[0] || null;
  }

  /**
   * Archive a resource (soft deletion / status transition to 'archived')
   */
  static async archive(
    orgId: string,
    resourceId: string,
    updatedBy?: string | null,
  ): Promise<LearningResourceRow | null> {
    const sql = `
      UPDATE learning_resources
      SET resource_status = 'archived'::resource_status,
          updated_at = now(),
          updated_by = $3::uuid
      WHERE resource_id = $1::uuid AND org_id = $2::uuid
      RETURNING *;
    `;

    const rows = (await prisma.$queryRawUnsafe(
      sql,
      resourceId,
      orgId,
      updatedBy || null,
    )) as LearningResourceRow[];
    return rows[0] || null;
  }

  /**
   * Delete resource record physically from PostgreSQL (only valid if draft / unshared)
   */
  static async delete(orgId: string, resourceId: string): Promise<LearningResourceRow | null> {
    const sql = `
      DELETE FROM learning_resources
      WHERE resource_id = $1::uuid AND org_id = $2::uuid
      RETURNING *;
    `;

    const rows = (await prisma.$queryRawUnsafe(sql, resourceId, orgId)) as LearningResourceRow[];
    return rows[0] || null;
  }

  /**
   * Synchronize grade associations for a resource in learning_resource_grades
   */
  static async syncGrades(orgId: string, resourceId: string, gradeIds: string[]): Promise<void> {
    // 1. Delete existing grade associations
    await prisma.$executeRawUnsafe(
      `DELETE FROM learning_resource_grades WHERE resource_id = $1::uuid AND org_id = $2::uuid`,
      resourceId,
      orgId,
    );

    // 2. Insert new associations
    if (gradeIds && gradeIds.length > 0) {
      const uniqueGrades = Array.from(new Set(gradeIds));
      for (const gradeId of uniqueGrades) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO learning_resource_grades (resource_id, grade_id, org_id)
           VALUES ($1::uuid, $2::uuid, $3::uuid)
           ON CONFLICT DO NOTHING`,
          resourceId,
          gradeId,
          orgId,
        );
      }
    }
  }

  /**
   * List active categories for an organization
   */
  static async findCategories(orgId: string): Promise<ResourceCategoryRow[]> {
    const sql = `
      SELECT category_id, org_id, category_name, category_code, description, display_order, is_active, created_at
      FROM resource_categories
      WHERE org_id = $1::uuid AND is_active = true
      ORDER BY display_order ASC, category_name ASC;
    `;
    return (await prisma.$queryRawUnsafe(sql, orgId)) as ResourceCategoryRow[];
  }

  /**
   * Find single category by ID and organization
   */
  static async findCategoryById(
    orgId: string,
    categoryId: string,
  ): Promise<ResourceCategoryRow | null> {
    const sql = `
      SELECT category_id, org_id, category_name, category_code, description, display_order, is_active, created_at
      FROM resource_categories
      WHERE category_id = $1::uuid AND org_id = $2::uuid;
    `;
    const rows = (await prisma.$queryRawUnsafe(sql, categoryId, orgId)) as ResourceCategoryRow[];
    return rows[0] || null;
  }

  /**
   * Resolve staff record for an organization by staff_id
   */
  static async findStaffById(
    orgId: string,
    staffId: string,
  ): Promise<{ staff_id: string; org_id: string; user_id: string | null } | null> {
    const sql = `
      SELECT staff_id, org_id, user_id
      FROM staff
      WHERE staff_id = $1::uuid AND org_id = $2::uuid AND is_active = true;
    `;
    const rows: any = await prisma.$queryRawUnsafe(sql, staffId, orgId);
    return rows[0] || null;
  }

  /**
   * Resolve staff record by user_id
   */
  static async findStaffByUserId(
    orgId: string,
    userId: string,
  ): Promise<{ staff_id: string; org_id: string; user_id: string | null } | null> {
    const sql = `
      SELECT staff_id, org_id, user_id
      FROM staff
      WHERE user_id = $1::uuid AND org_id = $2::uuid AND is_active = true
      LIMIT 1;
    `;
    const rows: any = await prisma.$queryRawUnsafe(sql, userId, orgId);
    return rows[0] || null;
  }

  /**
   * Resolve first active staff in organization as fallback
   */
  static async findFirstActiveStaff(
    orgId: string,
  ): Promise<{ staff_id: string; org_id: string; user_id: string | null } | null> {
    const sql = `
      SELECT staff_id, org_id, user_id
      FROM staff
      WHERE org_id = $1::uuid AND is_active = true
      ORDER BY created_at ASC
      LIMIT 1;
    `;
    const rows: any = await prisma.$queryRawUnsafe(sql, orgId);
    return rows[0] || null;
  }

  /**
   * Verify whether a list of grade IDs belong to the given organization
   */
  static async validateGradesBelongToOrg(orgId: string, gradeIds: string[]): Promise<boolean> {
    if (!gradeIds || gradeIds.length === 0) return true;
    const uniqueIds = Array.from(new Set(gradeIds));
    const sql = `
      SELECT COUNT(*)::int as match_count
      FROM grades
      WHERE org_id = $1::uuid AND grade_id = ANY($2::uuid[]);
    `;
    const res: any = await prisma.$queryRawUnsafe(sql, orgId, uniqueIds);
    return (res[0]?.match_count || 0) === uniqueIds.length;
  }
}
