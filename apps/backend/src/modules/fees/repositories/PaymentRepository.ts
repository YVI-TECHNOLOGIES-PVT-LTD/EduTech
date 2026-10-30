import { Prisma } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { toSafeUuid } from '../services/FeeStructureManagerService';

export interface WebhookEventRecord {
  payment_webhook_event_id: string;
  provider_name: string;
  provider_event_id: string;
  event_type: string;
  payment_order_id: string | null;
  payment_transaction_id: string | null;
  payload: any;
  status: 'received' | 'processed' | 'failed' | 'ignored';
  received_at: Date;
  processed_at: Date | null;
  processing_error: string | null;
  created_at: Date;
}

export interface PaymentOrderRecord {
  payment_order_id: string;
  student_id: string;
  student_charge_due_id: string;
  amount: number;
  currency_code: string;
  status: 'created' | 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';
  order_reference: string;
  description: string | null;
  expires_at: Date | null;
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
}

export interface PaymentTransactionRecord {
  payment_transaction_id: string;
  payment_order_id: string;
  payment_method: string;
  status: 'initiated' | 'pending' | 'success' | 'failed' | 'cancelled';
  gateway_name: string | null;
  gateway_transaction_id: string | null;
  gateway_order_id: string | null;
  amount: number;
  currency_code: string;
  transaction_date: Date | null;
  failure_code: string | null;
  failure_message: string | null;
  gateway_response: any | null;
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
}

export interface PaymentAllocationRecord {
  payment_allocation_id: string;
  payment_transaction_id: string;
  student_charge_due_id: string;
  allocated_amount: number;
  allocated_at: Date;
  notes: string | null;
  created_at: Date;
  created_by: string | null;
}

export interface StudentChargeDueRecord {
  student_charge_due_id: string;
  student_charge_id: string;
  installment_term_id: string | null;
  amount_due: number;
  due_date: Date;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'waived' | 'cancelled';
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
}

export interface StudentChargeRecord {
  student_charge_id: string;
  student_id: string;
  student_fee_assignment_id: string | null;
  fee_component_id: string | null;
  source_type: string;
  source_id: string | null;
  description: string;
  amount: number;
  currency_code: string;
  charge_date: Date;
  status: 'active' | 'cancelled' | 'waived';
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
}

/**
 * Parameterized PostgreSQL repository for payment models that lack Prisma delegates in schema.prisma.
 * Strictly guarantees physical ACID durability directly within PostgreSQL.
 */
export class PaymentRepository {
  private static getClient(client?: any) {
    return client || prisma;
  }

  // =========================================================================
  // 1. PAYMENT WEBHOOK EVENTS (Durable Deduplication & Ingestion)
  // =========================================================================

  /**
   * Find webhook event by unique provider and provider event ID.
   */
  public static async findWebhookEvent(
    providerName: string,
    providerEventId: string,
    client?: any,
  ): Promise<WebhookEventRecord | null> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT payment_webhook_event_id, provider_name, provider_event_id, event_type,
             payment_order_id, payment_transaction_id, payload, status,
             received_at, processed_at, processing_error, created_at
      FROM payment_webhook_events
      WHERE provider_name = ${providerName} AND provider_event_id = ${providerEventId}
      LIMIT 1;
    `;
    return rows[0] || null;
  }

  /**
   * Insert webhook event with database-level uniqueness enforcement (uq_payment_webhook_provider_event).
   */
  public static async createWebhookEvent(
    data: {
      providerName: string;
      providerEventId: string;
      eventType: string;
      payload: any;
      status?: 'received' | 'processed' | 'failed' | 'ignored';
      paymentOrderId?: string | null;
      paymentTransactionId?: string | null;
    },
    client?: any,
  ): Promise<WebhookEventRecord> {
    const db = this.getClient(client);
    const status = data.status || 'received';
    const payloadJson = JSON.stringify(data.payload || {});

    const rows: any = await db.$queryRaw`
      INSERT INTO payment_webhook_events (
        payment_webhook_event_id, provider_name, provider_event_id,
        event_type, payment_order_id, payment_transaction_id,
        payload, status, received_at
      ) VALUES (
        gen_random_uuid(), ${data.providerName}, ${data.providerEventId},
        ${data.eventType}, ${data.paymentOrderId ? data.paymentOrderId : null}::uuid,
        ${data.paymentTransactionId ? data.paymentTransactionId : null}::uuid,
        ${payloadJson}::jsonb, ${status}::payment_webhook_status, now()
      )
      RETURNING payment_webhook_event_id, provider_name, provider_event_id, event_type,
                payment_order_id, payment_transaction_id, payload, status,
                received_at, processed_at, processing_error, created_at;
    `;
    return rows[0];
  }

  /**
   * Update webhook event processing status.
   */
  public static async updateWebhookEventStatus(
    paymentWebhookEventId: string,
    data: {
      status: 'received' | 'processed' | 'failed' | 'ignored';
      processingError?: string | null;
      paymentOrderId?: string | null;
      paymentTransactionId?: string | null;
    },
    client?: any,
  ): Promise<void> {
    const db = this.getClient(client);
    await db.$executeRaw`
      UPDATE payment_webhook_events
      SET status = ${data.status}::payment_webhook_status,
          processed_at = now(),
          processing_error = ${data.processingError || null},
          payment_order_id = COALESCE(${data.paymentOrderId ? data.paymentOrderId : null}::uuid, payment_order_id),
          payment_transaction_id = COALESCE(${data.paymentTransactionId ? data.paymentTransactionId : null}::uuid, payment_transaction_id),
          updated_at = now()
      WHERE payment_webhook_event_id = ${paymentWebhookEventId}::uuid;
    `;
  }

  /**
   * Find webhook event by its internal primary key ID.
   */
  public static async findWebhookEventById(
    paymentWebhookEventId: string,
    client?: any,
  ): Promise<WebhookEventRecord | null> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT payment_webhook_event_id, provider_name, provider_event_id, event_type,
             payment_order_id, payment_transaction_id, payload, status,
             received_at, processed_at, processing_error, created_at
      FROM payment_webhook_events
      WHERE payment_webhook_event_id = ${paymentWebhookEventId}::uuid
      LIMIT 1;
    `;
    return rows[0] || null;
  }

  /**
   * Find webhook events matching a given status for recovery / reprocessing.
   */
  public static async findWebhookEventsByStatus(
    providerName: string,
    status: 'received' | 'processed' | 'failed' | 'ignored',
    limit: number = 50,
    olderThanMs: number = 0,
    client?: any,
  ): Promise<WebhookEventRecord[]> {
    const db = this.getClient(client);
    let rows: any;
    if (olderThanMs > 0) {
      const cutoffDate = new Date(Date.now() - olderThanMs);
      rows = await db.$queryRaw`
        SELECT payment_webhook_event_id, provider_name, provider_event_id, event_type,
               payment_order_id, payment_transaction_id, payload, status,
               received_at, processed_at, processing_error, created_at
        FROM payment_webhook_events
        WHERE provider_name = ${providerName}
          AND status = ${status}::payment_webhook_status
          AND received_at <= ${cutoffDate}
        ORDER BY received_at DESC
        LIMIT ${limit};
      `;
    } else {
      rows = await db.$queryRaw`
        SELECT payment_webhook_event_id, provider_name, provider_event_id, event_type,
               payment_order_id, payment_transaction_id, payload, status,
               received_at, processed_at, processing_error, created_at
        FROM payment_webhook_events
        WHERE provider_name = ${providerName}
          AND status = ${status}::payment_webhook_status
        ORDER BY received_at DESC
        LIMIT ${limit};
      `;
    }
    return rows;
  }

  // =========================================================================
  // 2. PAYMENT ORDERS
  // =========================================================================

  /**
   * Create a local pending payment order.
   */
  public static async createPaymentOrder(
    data: {
      studentId: string;
      studentChargeDueId: string;
      amount: number;
      orderReference: string;
      description?: string | null;
      createdBy?: string | null;
      status?: 'created' | 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';
    },
    client?: any,
  ): Promise<PaymentOrderRecord> {
    const db = this.getClient(client);
    const status = data.status || 'created';
    const rows: any = await db.$queryRaw`
      INSERT INTO payment_orders (
        payment_order_id, student_id, student_charge_due_id, amount,
        currency_code, status, order_reference, description, created_by
      ) VALUES (
        gen_random_uuid(), ${data.studentId}::uuid, ${data.studentChargeDueId}::uuid,
        ${data.amount}::numeric, 'INR', ${status}::payment_order_status,
        ${data.orderReference}, ${data.description || null},
        ${data.createdBy ? data.createdBy : null}::uuid
      )
      RETURNING payment_order_id, student_id, student_charge_due_id,
                amount::float8 as amount, currency_code, status,
                order_reference, description, expires_at,
                created_at, created_by, updated_at, updated_by;
    `;
    return rows[0];
  }

  /**
   * Find payment order by ID, optionally validating tenant isolation.
   */
  public static async findPaymentOrderById(
    paymentOrderId: string,
    orgId?: string,
    client?: any,
  ): Promise<any | null> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT po.payment_order_id, po.student_id, po.student_charge_due_id,
             po.amount::float8 as amount, po.currency_code, po.status,
             po.order_reference, po.description, po.created_at,
             s.org_id, s.first_name, s.last_name, s.admission_no,
             scd.amount_due::float8 as due_amount_due, scd.status as due_status,
             sc.student_charge_id, sc.description as charge_description,
             fc.component_name,
             ipt.term_name
      FROM payment_orders po
      JOIN students s ON s.student_id = po.student_id
      LEFT JOIN student_charge_dues scd ON scd.student_charge_due_id = po.student_charge_due_id
      LEFT JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      LEFT JOIN fee_components fc ON fc.fee_component_id = sc.fee_component_id
      LEFT JOIN installment_plan_terms ipt ON ipt.installment_term_id = scd.installment_term_id
      WHERE po.payment_order_id = ${paymentOrderId}::uuid
      ${orgId ? Prisma.sql`AND s.org_id = ${orgId}::uuid` : Prisma.empty}
      LIMIT 1;
    `;
    if (!rows.length) return null;
    const r = rows[0];
    return {
      payment_order_id: r.payment_order_id,
      student_id: r.student_id,
      student_charge_due_id: r.student_charge_due_id,
      amount: r.amount,
      currency_code: r.currency_code,
      status: r.status,
      order_reference: r.order_reference,
      description: r.description,
      created_at: r.created_at,
      students: {
        student_id: r.student_id,
        org_id: r.org_id,
        first_name: r.first_name,
        last_name: r.last_name,
        admission_no: r.admission_no,
      },
      student_charge_dues: {
        student_charge_due_id: r.student_charge_due_id,
        amount_due: r.due_amount_due,
        status: r.due_status,
        student_charges: {
          student_charge_id: r.student_charge_id,
          description: r.charge_description,
          fee_components: r.component_name ? { component_name: r.component_name } : null,
        },
        installment_plan_terms: r.term_name ? { term_name: r.term_name } : null,
      },
    };
  }

  /**
   * Update payment order status.
   */
  public static async updatePaymentOrderStatus(
    paymentOrderId: string,
    status: 'created' | 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired',
    updatedBy?: string | null,
    client?: any,
  ): Promise<void> {
    const db = this.getClient(client);
    await db.$executeRaw`
      UPDATE payment_orders
      SET status = ${status}::payment_order_status,
          updated_by = ${updatedBy ? updatedBy : null}::uuid,
          updated_at = now()
      WHERE payment_order_id = ${paymentOrderId}::uuid;
    `;
  }

  // =========================================================================
  // 3. PAYMENT TRANSACTIONS
  // =========================================================================

  /**
   * Create payment transaction.
   */
  public static async createPaymentTransaction(
    data: {
      paymentOrderId: string;
      paymentMethod: string;
      amount: number;
      status?: 'initiated' | 'pending' | 'success' | 'failed' | 'cancelled';
      gatewayName?: string | null;
      gatewayOrderId?: string | null;
      gatewayTransactionId?: string | null;
      transactionDate?: Date | null;
      createdBy?: string | null;
    },
    client?: any,
  ): Promise<PaymentTransactionRecord> {
    const db = this.getClient(client);
    const status = data.status || 'initiated';
    const rows: any = await db.$queryRaw`
      INSERT INTO payment_transactions (
        payment_transaction_id, payment_order_id, payment_method, status,
        gateway_name, gateway_order_id, gateway_transaction_id,
        amount, currency_code, transaction_date, created_by
      ) VALUES (
        gen_random_uuid(), ${data.paymentOrderId}::uuid,
        ${data.paymentMethod}::payment_method, ${status}::payment_transaction_status,
        ${data.gatewayName || null}, ${data.gatewayOrderId || null},
        ${data.gatewayTransactionId || null}, ${data.amount}::numeric,
        'INR', ${data.transactionDate || new Date()},
        ${data.createdBy ? data.createdBy : null}::uuid
      )
      RETURNING payment_transaction_id, payment_order_id, payment_method, status,
                gateway_name, gateway_order_id, gateway_transaction_id,
                amount::float8 as amount, currency_code, transaction_date,
                failure_code, failure_message, gateway_response,
                created_at, created_by, updated_at, updated_by;
    `;
    return rows[0];
  }

  /**
   * Find transaction by order ID (latest transaction).
   */
  public static async findTransactionByOrderId(
    paymentOrderId: string,
    client?: any,
  ): Promise<PaymentTransactionRecord | null> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT payment_transaction_id, payment_order_id, payment_method, status,
             gateway_name, gateway_order_id, gateway_transaction_id,
             amount::float8 as amount, currency_code, transaction_date,
             failure_code, failure_message, gateway_response,
             created_at, created_by, updated_at, updated_by
      FROM payment_transactions
      WHERE payment_order_id = ${paymentOrderId}::uuid
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    return rows[0] || null;
  }

  /**
   * Find transaction by gateway order ID or gateway transaction ID.
   */
  public static async findTransactionByGatewayRef(
    gatewayRef: string,
    client?: any,
  ): Promise<PaymentTransactionRecord | null> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT payment_transaction_id, payment_order_id, payment_method, status,
             gateway_name, gateway_order_id, gateway_transaction_id,
             amount::float8 as amount, currency_code, transaction_date,
             failure_code, failure_message, gateway_response,
             created_at, created_by, updated_at, updated_by
      FROM payment_transactions
      WHERE gateway_order_id = ${gatewayRef} OR gateway_transaction_id = ${gatewayRef}
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    return rows[0] || null;
  }

  /**
   * Find transaction joined with its parent order and associated student charge due.
   */
  public static async findTransactionWithOrderAndDueByGatewayRef(
    gatewayRef: string,
    client?: any,
  ): Promise<any | null> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT pt.payment_transaction_id, pt.payment_order_id, pt.payment_method, pt.status as transaction_status,
             pt.gateway_name, pt.gateway_order_id, pt.gateway_transaction_id, pt.amount::float8 as transaction_amount,
             po.payment_order_id, po.student_id, po.student_charge_due_id, po.amount::float8 as order_amount, po.status as order_status,
             s.org_id,
             scd.student_charge_due_id, scd.amount_due::float8 as due_amount_due, scd.status as due_status,
             sc.student_charge_id, sc.description as charge_description
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      LEFT JOIN student_charge_dues scd ON scd.student_charge_due_id = po.student_charge_due_id
      LEFT JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      WHERE pt.gateway_order_id = ${gatewayRef} OR pt.gateway_transaction_id = ${gatewayRef}
      ORDER BY pt.created_at DESC
      LIMIT 1;
    `;
    if (!rows.length) return null;
    const r = rows[0];
    return {
      payment_transaction_id: r.payment_transaction_id,
      payment_order_id: r.payment_order_id,
      payment_method: r.payment_method,
      status: r.transaction_status,
      gateway_name: r.gateway_name,
      gateway_order_id: r.gateway_order_id,
      gateway_transaction_id: r.gateway_transaction_id,
      amount: r.transaction_amount,
      payment_orders: {
        payment_order_id: r.payment_order_id,
        org_id: r.org_id,
        student_id: r.student_id,
        student_charge_due_id: r.student_charge_due_id,
        amount: r.order_amount,
        status: r.order_status,
        student_charge_dues: {
          student_charge_due_id: r.student_charge_due_id,
          amount_due: r.due_amount_due,
          status: r.due_status,
          student_charges: {
            student_charge_id: r.student_charge_id,
            description: r.charge_description,
          },
        },
      },
    };
  }

  /**
   * Update payment transaction status, response, and metadata.
   */
  public static async updatePaymentTransaction(
    paymentTransactionId: string,
    data: {
      status: 'initiated' | 'pending' | 'success' | 'failed' | 'cancelled';
      gatewayTransactionId?: string | null;
      failureCode?: string | null;
      failureMessage?: string | null;
      gatewayResponse?: any | null;
      transactionDate?: Date | null;
      updatedBy?: string | null;
    },
    client?: any,
  ): Promise<PaymentTransactionRecord> {
    const db = this.getClient(client);
    const gatewayResponseJson = data.gatewayResponse ? JSON.stringify(data.gatewayResponse) : null;

    const rows: any = await db.$queryRaw`
      UPDATE payment_transactions
      SET status = ${data.status}::payment_transaction_status,
          gateway_transaction_id = COALESCE(${data.gatewayTransactionId || null}, gateway_transaction_id),
          failure_code = ${data.failureCode || null},
          failure_message = ${data.failureMessage || null},
          gateway_response = CASE
            WHEN ${gatewayResponseJson}::text IS NOT NULL THEN ${gatewayResponseJson}::jsonb
            ELSE gateway_response
          END,
          transaction_date = COALESCE(${data.transactionDate || null}, transaction_date),
          updated_by = ${data.updatedBy ? data.updatedBy : null}::uuid,
          updated_at = now()
      WHERE payment_transaction_id = ${paymentTransactionId}::uuid
      RETURNING payment_transaction_id, payment_order_id, payment_method, status,
                gateway_name, gateway_order_id, gateway_transaction_id,
                amount::float8 as amount, currency_code, transaction_date,
                failure_code, failure_message, gateway_response,
                created_at, created_by, updated_at, updated_by;
    `;
    return rows[0];
  }

  // =========================================================================
  // 4. PAYMENT ALLOCATIONS
  // =========================================================================

  /**
   * Create an allocation linking a successful transaction to a student charge due.
   */
  public static async createPaymentAllocation(
    data: {
      paymentTransactionId: string;
      studentChargeDueId: string;
      allocatedAmount: number;
      notes?: string | null;
      createdBy?: string | null;
    },
    client?: any,
  ): Promise<PaymentAllocationRecord> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      INSERT INTO payment_allocations (
        payment_allocation_id, payment_transaction_id, student_charge_due_id,
        allocated_amount, allocated_at, notes, created_by
      ) VALUES (
        gen_random_uuid(), ${data.paymentTransactionId}::uuid,
        ${data.studentChargeDueId}::uuid, ${data.allocatedAmount}::numeric,
        now(), ${data.notes || null},
        ${data.createdBy ? data.createdBy : null}::uuid
      )
      RETURNING payment_allocation_id, payment_transaction_id, student_charge_due_id,
                allocated_amount::float8 as allocated_amount, allocated_at, notes,
                created_at, created_by;
    `;
    return rows[0];
  }

  /**
   * Calculate total verified allocated amount for a given student charge due.
   */
  public static async getTotalAllocatedForDue(
    studentChargeDueId: string,
    client?: any,
  ): Promise<number> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT COALESCE(SUM(pa.allocated_amount), 0)::float8 as total_allocated
      FROM payment_allocations pa
      JOIN payment_transactions pt ON pt.payment_transaction_id = pa.payment_transaction_id
      WHERE pa.student_charge_due_id = ${studentChargeDueId}::uuid
        AND pt.status = 'success'::payment_transaction_status;
    `;
    return rows[0]?.total_allocated || 0;
  }

  // =========================================================================
  // 5. STUDENT CHARGE DUES & STUDENT CHARGES
  // =========================================================================

  /**
   * Find student charge due by ID with associated student charge details.
   */
  public static async findDueById(studentChargeDueId: string, client?: any): Promise<any | null> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT scd.student_charge_due_id, scd.student_charge_id, scd.installment_term_id,
             scd.amount_due::float8 as amount_due, scd.due_date, scd.status as due_status,
             sc.student_id, sc.description as charge_description, sc.amount::float8 as charge_amount,
             sc.status as charge_status,
             ipt.term_name
      FROM student_charge_dues scd
      JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      LEFT JOIN installment_plan_terms ipt ON ipt.installment_term_id = scd.installment_term_id
      WHERE scd.student_charge_due_id = ${studentChargeDueId}::uuid
      LIMIT 1;
    `;
    return rows[0] || null;
  }

  /**
   * Update student charge due status.
   */
  public static async updateDueStatus(
    studentChargeDueId: string,
    status: 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'waived' | 'cancelled',
    updatedBy?: string | null,
    client?: any,
  ): Promise<void> {
    const db = this.getClient(client);
    await db.$executeRaw`
      UPDATE student_charge_dues
      SET status = ${status}::student_charge_due_status,
          updated_by = ${updatedBy ? updatedBy : null}::uuid,
          updated_at = now()
      WHERE student_charge_due_id = ${studentChargeDueId}::uuid;
    `;
  }

  /**
   * Query all active dues for a student with calculated remaining balances.
   */
  public static async getEligibleDuesForStudent(studentId: string, client?: any): Promise<any[]> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT scd.student_charge_due_id, scd.student_charge_id, scd.amount_due::float8 as amount_due,
             scd.due_date, scd.status as due_status,
             sc.description as charge_description,
             fc.component_name, fc.component_code,
             ipt.term_name,
             COALESCE((
               SELECT SUM(pa.allocated_amount)::float8
               FROM payment_allocations pa
               JOIN payment_transactions pt ON pt.payment_transaction_id = pa.payment_transaction_id
               WHERE pa.student_charge_due_id = scd.student_charge_due_id
                 AND pt.status = 'success'::payment_transaction_status
             ), 0) as previously_allocated_amount
      FROM student_charge_dues scd
      JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      LEFT JOIN fee_components fc ON fc.fee_component_id = sc.fee_component_id
      LEFT JOIN installment_plan_terms ipt ON ipt.installment_term_id = scd.installment_term_id
      WHERE sc.student_id = ${studentId}::uuid
        AND sc.status = 'active'::student_charge_status
        AND scd.status NOT IN ('cancelled'::student_charge_due_status, 'waived'::student_charge_due_status)
      ORDER BY scd.due_date ASC;
    `;
    return rows.map((r: any) => ({
      student_charge_due_id: r.student_charge_due_id,
      student_charge_id: r.student_charge_id,
      description: r.charge_description,
      component_name: r.component_name || 'Tuition / Fees',
      installment_term: r.term_name || 'Standard Term',
      amount_due: r.amount_due,
      previously_allocated_amount: r.previously_allocated_amount,
      remaining_payable_amount: Math.max(
        0,
        Math.round((r.amount_due - r.previously_allocated_amount + Number.EPSILON) * 100) / 100,
      ),
      due_date:
        r.due_date instanceof Date ? r.due_date.toISOString().split('T')[0] : String(r.due_date),
      status: r.due_status,
    }));
  }

  /**
   * Find due with calculated allocated amount and details for a student.
   */
  public static async findDueWithAllocations(
    dueId: string,
    studentId: string,
    client?: any,
  ): Promise<any | null> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT scd.student_charge_due_id, scd.student_charge_id, scd.amount_due::float8 as amount_due,
             scd.due_date, scd.status as due_status,
             sc.student_id, sc.description as charge_description,
             fc.component_name, ipt.term_name,
             COALESCE((
               SELECT SUM(pa.allocated_amount)::float8
               FROM payment_allocations pa
               JOIN payment_transactions pt ON pt.payment_transaction_id = pa.payment_transaction_id
               WHERE pa.student_charge_due_id = scd.student_charge_due_id
                 AND pt.status = 'success'::payment_transaction_status
             ), 0) as allocated_amount
      FROM student_charge_dues scd
      JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      LEFT JOIN fee_components fc ON fc.fee_component_id = sc.fee_component_id
      LEFT JOIN installment_plan_terms ipt ON ipt.installment_term_id = scd.installment_term_id
      WHERE scd.student_charge_due_id = ${dueId}::uuid
        AND sc.student_id = ${studentId}::uuid
        AND sc.status = 'active'::student_charge_status
      LIMIT 1;
    `;
    if (!rows.length) return null;
    const r = rows[0];
    return {
      student_charge_due_id: r.student_charge_due_id,
      student_charge_id: r.student_charge_id,
      amount_due: r.amount_due,
      due_date: r.due_date,
      status: r.due_status,
      student_charges: {
        student_charge_id: r.student_charge_id,
        description: r.charge_description,
        fee_components: r.component_name ? { component_name: r.component_name } : null,
      },
      installment_plan_terms: r.term_name ? { term_name: r.term_name } : null,
      allocated_amount: r.allocated_amount,
    };
  }

  /**
   * Find payment order for verification joined with student, enrollment, transaction, and due.
   */
  public static async findPaymentOrderForVerification(
    paymentOrderId: string,
    orgId?: string,
    client?: any,
  ): Promise<any | null> {
    const db = this.getClient(client);
    const rows: any = await db.$queryRaw`
      SELECT po.payment_order_id, po.student_id, po.student_charge_due_id,
             po.amount::float8 as order_amount, po.currency_code, po.status as order_status,
             po.order_reference, po.description as order_description, po.created_at as order_created_at,
             s.org_id, s.first_name, s.last_name, s.admission_no,
             pt.payment_transaction_id, pt.payment_method, pt.status as transaction_status,
             pt.gateway_name, pt.gateway_order_id, pt.gateway_transaction_id,
             pt.amount::float8 as transaction_amount, pt.created_at as transaction_created_at,
             scd.amount_due::float8 as due_amount_due, scd.status as due_status,
             sc.student_charge_id, sc.description as charge_description,
             ipt.term_name,
             ay.academic_year_name, g.grade_name
      FROM payment_orders po
      JOIN students s ON s.student_id = po.student_id
      LEFT JOIN LATERAL (
        SELECT * FROM payment_transactions pt_sub
        WHERE pt_sub.payment_order_id = po.payment_order_id
        ORDER BY pt_sub.created_at DESC
        LIMIT 1
      ) pt ON true
      LEFT JOIN student_charge_dues scd ON scd.student_charge_due_id = po.student_charge_due_id
      LEFT JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      LEFT JOIN installment_plan_terms ipt ON ipt.installment_term_id = scd.installment_term_id
      LEFT JOIN LATERAL (
        SELECT se.academic_year_grade_id
        FROM student_enrollments se
        WHERE se.student_id = s.student_id AND se.status = 'active'
        ORDER BY se.created_at DESC LIMIT 1
      ) latest_se ON true
      LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = latest_se.academic_year_grade_id
      LEFT JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      LEFT JOIN grades g ON g.grade_id = ayg.grade_id
      WHERE po.payment_order_id = ${paymentOrderId}::uuid
      ${orgId ? Prisma.sql`AND s.org_id = ${orgId}::uuid` : Prisma.empty}
      LIMIT 1;
    `;
    if (!rows.length) return null;
    const r = rows[0];
    return {
      payment_order_id: r.payment_order_id,
      student_id: r.student_id,
      student_charge_due_id: r.student_charge_due_id,
      amount: r.order_amount,
      currency_code: r.currency_code,
      status: r.order_status,
      order_reference: r.order_reference,
      description: r.order_description,
      created_at: r.order_created_at,
      students: {
        student_id: r.student_id,
        org_id: r.org_id,
        first_name: r.first_name,
        last_name: r.last_name,
        admission_no: r.admission_no,
        student_enrollments: [
          {
            academic_year_grades: {
              academic_years: { academic_year_name: r.academic_year_name || 'N/A' },
              grades: { grade_name: r.grade_name || 'N/A' },
            },
          },
        ],
      },
      student_charge_dues: {
        student_charge_due_id: r.student_charge_due_id,
        amount_due: r.due_amount_due,
        status: r.due_status,
        student_charges: {
          student_charge_id: r.student_charge_id,
          description: r.charge_description,
        },
        installment_plan_terms: r.term_name ? { term_name: r.term_name } : null,
      },
      payment_transactions: r.payment_transaction_id
        ? [
            {
              payment_transaction_id: r.payment_transaction_id,
              payment_order_id: r.payment_order_id,
              payment_method: r.payment_method,
              status: r.transaction_status,
              gateway_name: r.gateway_name,
              gateway_order_id: r.gateway_order_id,
              gateway_transaction_id: r.gateway_transaction_id,
              amount: r.transaction_amount,
              created_at: r.transaction_created_at,
            },
          ]
        : [],
    };
  }

  /**
   * Find transaction receipt details.
   */
  public static async getReceiptDetails(
    orgId: string,
    transactionId: string,
    client?: any,
  ): Promise<any | null> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const safeTxId = toSafeUuid(transactionId);
    const idCondition = safeTxId
      ? Prisma.sql`(pt.payment_transaction_id = ${safeTxId}::uuid OR pt.payment_order_id = ${safeTxId}::uuid)`
      : Prisma.sql`(po.order_reference = ${transactionId} OR po.order_reference ILIKE ${`%${transactionId.replace(/^RCPT-/, '')}%`})`;

    const rows: any = await db.$queryRaw`
      SELECT pt.payment_transaction_id, pt.payment_order_id, pt.payment_method, pt.status as transaction_status,
             pt.amount::float8 as transaction_amount, pt.currency_code, pt.transaction_date, pt.created_at as transaction_created_at,
             pt.gateway_name, pt.gateway_transaction_id,
             po.order_reference,
             s.student_id, s.admission_no, s.first_name, s.last_name,
             sc.description as obligation_description,
             ipt.term_name,
             ay.academic_year_name, g.grade_name
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      LEFT JOIN student_charge_dues scd ON scd.student_charge_due_id = po.student_charge_due_id
      LEFT JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      LEFT JOIN installment_plan_terms ipt ON ipt.installment_term_id = scd.installment_term_id
      LEFT JOIN LATERAL (
        SELECT se.academic_year_grade_id
        FROM student_enrollments se
        WHERE se.student_id = s.student_id AND se.status = 'active'
        ORDER BY se.created_at DESC LIMIT 1
      ) latest_se ON true
      LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = latest_se.academic_year_grade_id
      LEFT JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      LEFT JOIN grades g ON g.grade_id = ayg.grade_id
      WHERE ${idCondition}
        ${safeOrgId ? Prisma.sql`AND s.org_id = ${safeOrgId}::uuid` : Prisma.empty}
      ORDER BY 
        CASE WHEN pt.status = 'success' THEN 1 ELSE 2 END ASC,
        pt.created_at DESC
      LIMIT 1;
    `;
    if (!rows.length) return null;
    const r = rows[0];
    const receiptNo = `RCPT-${new Date(r.transaction_created_at).getFullYear()}-${(r.order_reference || '').split('-')[1] || r.payment_transaction_id.slice(0, 6)}`;
    const studentFullName = `${r.first_name} ${r.last_name || ''}`.trim();
    const mode =
      r.payment_method === 'cash'
        ? 'Cash'
        : r.payment_method === 'upi'
          ? 'UPI'
          : r.payment_method === 'card'
            ? 'Card'
            : r.payment_method === 'bank_transfer' || r.payment_method === 'net_banking'
              ? 'Bank_Transfer'
              : r.payment_method === 'cheque'
                ? 'Cheque'
                : r.payment_method
                  ? r.payment_method.charAt(0).toUpperCase() + r.payment_method.slice(1)
                  : 'Online';
    const createdAtIso = (r.transaction_date || r.transaction_created_at).toISOString();

    return {
      id: r.payment_transaction_id,
      receipt_no: receiptNo,
      receipt_number: receiptNo,
      receipt_type: r.transaction_status === 'cancelled' ? 'CANCELLED' : 'ORIGINAL',
      receipt_date: createdAtIso,
      created_at: createdAtIso,
      print_count: 1,
      student_id: r.student_id,
      student_name: studentFullName,
      student: {
        first_name: r.first_name,
        last_name: r.last_name,
        admission_no: r.admission_no,
      },
      admission_no: r.admission_no,
      grade_name: r.grade_name || 'N/A',
      academic_year_name: r.academic_year_name || 'N/A',
      payment_transaction_id: r.payment_transaction_id,
      payment_order_id: r.payment_order_id,
      order_reference: r.order_reference,
      amount: r.transaction_amount,
      currency: r.currency_code,
      payment_method: r.payment_method,
      transaction_reference: r.gateway_transaction_id,
      obligation_description: r.obligation_description || 'Fee Obligation',
      installment_term: r.term_name || 'Standard Term',
      collected_by:
        r.gateway_name === 'Offline Manual'
          ? 'Authorized Staff'
          : r.gateway_name || 'Payment Gateway',
      transaction_status: r.transaction_status,
      status: r.transaction_status === 'success' ? 'GENERATED' : r.transaction_status.toUpperCase(),
      transaction: {
        id: r.payment_transaction_id,
        payment_transaction_id: r.payment_transaction_id,
        amount: r.transaction_amount,
        payment_mode: mode,
        transaction_reference: r.gateway_transaction_id || r.order_reference,
        created_at: createdAtIso,
        student_id: r.student_id,
        student: {
          full_name: studentFullName,
          student_code: r.admission_no,
          admission_no: r.admission_no,
        },
        cashier: {
          email:
            r.gateway_name === 'Offline Manual'
              ? 'finance.office@edutrack.edu'
              : 'online.gateway@edutrack.edu',
        },
      },
    };
  }

  /**
   * List official receipts for an organization with pagination and filters.
   */
  public static async listReceipts(
    orgId: string,
    filter: {
      from?: string;
      to?: string;
      receipt_type?: string;
      payment_mode?: string;
      search?: string;
      limit?: number;
      offset?: number;
      page?: number;
    } = {},
    client?: any,
  ): Promise<{ receipts: any[]; total: number }> {
    const db = this.getClient(client);
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 50));
    const offset = Number(filter.offset) || (filter.page ? (Number(filter.page) - 1) * limit : 0);

    const fromDate = filter.from ? new Date(`${filter.from}T00:00:00.000Z`) : null;
    const toDate = filter.to ? new Date(`${filter.to}T23:59:59.999Z`) : null;
    const dateFromFilter =
      fromDate && !isNaN(fromDate.getTime())
        ? Prisma.sql`AND pt.created_at >= ${fromDate}`
        : Prisma.empty;
    const dateToFilter =
      toDate && !isNaN(toDate.getTime())
        ? Prisma.sql`AND pt.created_at <= ${toDate}`
        : Prisma.empty;

    let statusSql = Prisma.sql`AND pt.status = 'success'::payment_transaction_status`;
    if (filter.receipt_type === 'CANCELLED') {
      statusSql = Prisma.sql`AND pt.status = 'cancelled'::payment_transaction_status`;
    }

    let methodSql = Prisma.empty;
    if (filter.payment_mode) {
      const modeNorm = filter.payment_mode.toLowerCase().replace(/[\s-]/g, '_');
      if (modeNorm === 'cash') {
        methodSql = Prisma.sql`AND pt.payment_method = 'cash'::payment_method`;
      } else if (modeNorm === 'upi') {
        methodSql = Prisma.sql`AND pt.payment_method = 'upi'::payment_method`;
      } else if (modeNorm === 'card') {
        methodSql = Prisma.sql`AND pt.payment_method = 'card'::payment_method`;
      } else if (modeNorm === 'bank_transfer') {
        methodSql = Prisma.sql`AND pt.payment_method IN ('bank_transfer'::payment_method, 'net_banking'::payment_method)`;
      } else if (modeNorm === 'cheque') {
        methodSql = Prisma.sql`AND pt.payment_method = 'other'::payment_method`;
      }
    }

    let searchSql = Prisma.empty;
    if (filter.search && filter.search.trim()) {
      const s = `%${filter.search.trim()}%`;
      searchSql = Prisma.sql`AND (
        s.first_name ILIKE ${s} OR
        s.last_name ILIKE ${s} OR
        s.admission_no ILIKE ${s} OR
        po.order_reference ILIKE ${s} OR
        pt.gateway_transaction_id ILIKE ${s}
      )`;
    }

    const orgSql = safeOrgId ? Prisma.sql`s.org_id = ${safeOrgId}::uuid` : Prisma.sql`true`;

    const countRows: any = await db.$queryRaw`
      SELECT COUNT(*)::int as total
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      WHERE ${orgSql}
        ${statusSql}
        ${dateFromFilter}
        ${dateToFilter}
        ${methodSql}
        ${searchSql};
    `;
    const total = countRows[0]?.total || 0;

    const rows: any = await db.$queryRaw`
      SELECT pt.payment_transaction_id, pt.payment_order_id, pt.payment_method, pt.status as transaction_status,
             pt.amount::float8 as amount, pt.currency_code, pt.transaction_date, pt.created_at,
             pt.gateway_name, pt.gateway_transaction_id,
             po.order_reference,
             s.student_id, s.admission_no, s.first_name, s.last_name,
             sc.description as obligation_description,
             ipt.term_name,
             ay.academic_year_name, g.grade_name
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      LEFT JOIN student_charge_dues scd ON scd.student_charge_due_id = po.student_charge_due_id
      LEFT JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      LEFT JOIN installment_plan_terms ipt ON ipt.installment_term_id = scd.installment_term_id
      LEFT JOIN LATERAL (
        SELECT se.academic_year_grade_id
        FROM student_enrollments se
        WHERE se.student_id = s.student_id AND se.status = 'active'
        ORDER BY se.created_at DESC LIMIT 1
      ) latest_se ON true
      LEFT JOIN academic_year_grades ayg ON ayg.academic_year_grade_id = latest_se.academic_year_grade_id
      LEFT JOIN academic_years ay ON ay.academic_year_id = ayg.academic_year_id
      LEFT JOIN grades g ON g.grade_id = ayg.grade_id
      WHERE ${orgSql}
        ${statusSql}
        ${dateFromFilter}
        ${dateToFilter}
        ${methodSql}
        ${searchSql}
      ORDER BY pt.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const receipts = rows.map((r: any) => {
      const receiptNo = `RCPT-${new Date(r.created_at).getFullYear()}-${(r.order_reference || '').split('-')[1] || r.payment_transaction_id.slice(0, 6)}`;
      const studentFullName = `${r.first_name} ${r.last_name || ''}`.trim();
      const mode =
        r.payment_method === 'cash'
          ? 'Cash'
          : r.payment_method === 'upi'
            ? 'UPI'
            : r.payment_method === 'card'
              ? 'Card'
              : r.payment_method === 'bank_transfer' || r.payment_method === 'net_banking'
                ? 'Bank_Transfer'
                : r.payment_method
                  ? r.payment_method.charAt(0).toUpperCase() + r.payment_method.slice(1)
                  : 'Online';
      const createdAtIso = (r.transaction_date || r.created_at).toISOString();

      return {
        id: r.payment_transaction_id,
        receipt_no: receiptNo,
        receipt_type:
          r.transaction_status === 'cancelled' ? 'CANCELLED' : filter.receipt_type || 'ORIGINAL',
        status:
          r.transaction_status === 'success' ? 'GENERATED' : r.transaction_status.toUpperCase(),
        created_at: createdAtIso,
        print_count: 1,
        student_id: r.student_id,
        student_name: studentFullName,
        admission_no: r.admission_no,
        grade_name: r.grade_name || 'N/A',
        academic_year_name: r.academic_year_name || 'N/A',
        payment_transaction_id: r.payment_transaction_id,
        payment_order_id: r.payment_order_id,
        order_reference: r.order_reference,
        amount: r.amount,
        currency: r.currency_code,
        payment_method: r.payment_method,
        transaction_reference: r.gateway_transaction_id,
        obligation_description: r.obligation_description || 'Fee Obligation',
        installment_term: r.term_name || 'Standard Term',
        collected_by:
          r.gateway_name === 'Offline Manual'
            ? 'Authorized Staff'
            : r.gateway_name || 'Payment Gateway',
        transaction: {
          id: r.payment_transaction_id,
          payment_transaction_id: r.payment_transaction_id,
          amount: r.amount,
          payment_mode: mode,
          transaction_reference: r.gateway_transaction_id || r.order_reference,
          created_at: createdAtIso,
          student_id: r.student_id,
          student: {
            full_name: studentFullName,
            student_code: r.admission_no,
            admission_no: r.admission_no,
          },
          cashier: {
            email:
              r.gateway_name === 'Offline Manual'
                ? 'finance.office@edutrack.edu'
                : 'online.gateway@edutrack.edu',
          },
        },
      };
    });

    return { receipts, total };
  }

  /**
   * Get payment history scoped to tenant organization.
   */
  public static async getPaymentHistory(
    orgId: string,
    filter: any = {},
    client?: any,
  ): Promise<{ transactions: any[]; pagination: any }> {
    const db = this.getClient(client);
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const offset = (page - 1) * limit;

    const studentIdFilter = filter.studentId
      ? Prisma.sql`AND s.student_id = ${filter.studentId}::uuid`
      : Prisma.empty;
    const statusFilter = filter.status
      ? Prisma.sql`AND pt.status = ${filter.status}::payment_transaction_status`
      : Prisma.empty;
    const methodFilter = filter.paymentMethod
      ? Prisma.sql`AND pt.payment_method = ${filter.paymentMethod}::payment_method`
      : Prisma.empty;
    const dateFromFilter = filter.dateFrom
      ? Prisma.sql`AND pt.created_at >= ${new Date(filter.dateFrom)}`
      : Prisma.empty;
    const dateToFilter = filter.dateTo
      ? Prisma.sql`AND pt.created_at <= ${new Date(filter.dateTo)}`
      : Prisma.empty;

    const countRows: any = await db.$queryRaw`
      SELECT COUNT(*)::int as total
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      WHERE s.org_id = ${orgId}::uuid
        ${studentIdFilter}
        ${statusFilter}
        ${methodFilter}
        ${dateFromFilter}
        ${dateToFilter};
    `;
    const total = countRows[0]?.total || 0;

    const rows: any = await db.$queryRaw`
      SELECT pt.payment_transaction_id, pt.payment_order_id, pt.payment_method, pt.status,
             pt.amount::float8 as amount, pt.currency_code, pt.transaction_date, pt.created_at,
             pt.gateway_name, pt.gateway_transaction_id,
             po.order_reference,
             s.student_id, s.admission_no, s.first_name, s.last_name,
             sc.description as obligation_description,
             ipt.term_name,
             COALESCE((
               SELECT SUM(pa.allocated_amount)::float8
               FROM payment_allocations pa
               WHERE pa.payment_transaction_id = pt.payment_transaction_id
             ), 0) as allocated_amount
      FROM payment_transactions pt
      JOIN payment_orders po ON po.payment_order_id = pt.payment_order_id
      JOIN students s ON s.student_id = po.student_id
      LEFT JOIN student_charge_dues scd ON scd.student_charge_due_id = po.student_charge_due_id
      LEFT JOIN student_charges sc ON sc.student_charge_id = scd.student_charge_id
      LEFT JOIN installment_plan_terms ipt ON ipt.installment_term_id = scd.installment_term_id
      WHERE s.org_id = ${orgId}::uuid
        ${studentIdFilter}
        ${statusFilter}
        ${methodFilter}
        ${dateFromFilter}
        ${dateToFilter}
      ORDER BY pt.created_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

    const transactions = rows.map((r: any) => ({
      payment_transaction_id: r.payment_transaction_id,
      order_reference: r.order_reference,
      student_id: r.student_id,
      student_name: `${r.first_name} ${r.last_name || ''}`.trim(),
      admission_no: r.admission_no,
      amount: r.amount,
      currency_code: r.currency_code,
      payment_method: r.payment_method,
      status: r.status,
      gateway_name: r.gateway_name,
      gateway_transaction_id: r.gateway_transaction_id,
      transaction_date: r.transaction_date || r.created_at,
      allocated_amount: r.allocated_amount,
      unallocated_amount: Math.max(
        0,
        Math.round((r.amount - r.allocated_amount + Number.EPSILON) * 100) / 100,
      ),
      obligation_description: r.obligation_description || 'Fee Obligation',
      term_name: r.term_name || 'Standard',
    }));

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Helper to execute a sequence of queries inside a native database transaction.
   */
  public static async runInTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return await prisma.$transaction(fn, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 10000,
    });
  }
}
