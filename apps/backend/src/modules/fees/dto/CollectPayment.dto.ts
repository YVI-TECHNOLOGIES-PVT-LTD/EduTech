export interface CollectPaymentDto {
    application_id?: string;
    student_id?: string;
    demand_id?: string;
    amount: number;
    payment_mode: 'Cash' | 'UPI' | 'Card' | 'Cheque' | 'Bank_Transfer' | 'Online_Gateway';
    transaction_reference?: string;
    bank_name?: string;
    gateway_name?: string;
    gateway_transaction_id?: string;
    payment_channel?: string;
    remarks?: string;
}
