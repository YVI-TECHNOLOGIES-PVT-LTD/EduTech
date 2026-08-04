export interface GenerateReceiptDto {
    payment_transaction_id: string;
    receipt_type?: 'ORIGINAL' | 'DUPLICATE' | 'REPRINT' | 'CANCELLED';
}
