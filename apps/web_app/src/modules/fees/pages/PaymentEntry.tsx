import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Coins,
  Search,
  CreditCard,
  CheckCircle2,
  Printer,
  ArrowLeft,
  Clock,
  User,
  Filter,
  QrCode,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Download,
  RefreshCw,
  FileText,
  Check,
  X,
  ChevronRight,
  Info,
  Receipt,
  Wallet,
  Banknote,
  Landmark,
  Smartphone,
  AlertTriangle,
  History,
  Send,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

const GLASS_CARD =
  'backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)] rounded-3xl p-6 transition-all duration-300';

export interface StudentListItem {
  student_id: string;
  admission_no: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dob: string | null;
  gender: string | null;
  status: string;
  enrollment: {
    enrollment_id: string;
    roll_number: string | null;
    status: string;
    academic_year_id: string | null;
    academic_year_name: string;
    grade_id: string | null;
    grade_name: string;
    section_id: string | null;
    section_name: string | null;
  } | null;
  assignment: {
    assignment_id: string;
    fee_structure_id: string;
    fee_structure_name: string;
    installment_plan_id: string;
    installment_plan_name: string;
    assigned_at: string;
    status: string;
  } | null;
}

export interface StudentLedgerSummary {
  student: {
    student_id: string;
    admission_no: string;
    full_name: string;
  };
  summary: {
    currency: string;
    total_assigned_structure_amount: number;
    total_assessed_amount: number;
    total_paid_amount: number;
    total_transactions_amount: number;
    unallocated_payments_amount: number;
    outstanding_balance: number;
    overdue_balance: number;
    has_assessed_charges: boolean;
    has_assigned_structure: boolean;
    reliability_notes: string[];
  };
}

export interface EligibleObligation {
  student_charge_due_id: string;
  student_charge_id: string;
  component_name: string;
  description: string;
  due_date: string;
  status: string;
  original_amount: number;
  previously_allocated_amount: number;
  remaining_payable_amount: number;
  is_overdue: boolean;
  can_collect: boolean;
}

export interface PaymentHistoryItem {
  payment_transaction_id: string;
  payment_order_id: string;
  order_reference: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  amount: number;
  payment_method: string;
  status: string;
  gateway_name: string;
  gateway_transaction_id: string | null;
  created_at: string;
  receipt_no: string;
  allocations_count: number;
  total_allocated: number;
  allocation_status: string;
}

export interface ReceiptDocument {
  receipt_no: string;
  payment_transaction_id: string;
  payment_order_id: string;
  payment_date: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: string;
  gateway_reference: string;
  student: {
    student_id: string;
    student_name: string;
    admission_no: string;
  };
  allocations: {
    allocation_id: string;
    student_charge_due_id: string;
    component_name: string;
    allocated_amount: number;
    due_date: string;
  }[];
  issued_at: string;
  institution_name: string;
}

// Official Razorpay Checkout Script Loader
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof (window as any).Razorpay !== 'undefined') {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const PaymentEntry: React.FC = () => {
  const [workspaceTab, setWorkspaceTab] = useState<'COLLECT' | 'HISTORY'>('COLLECT');

  // Academic Years
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');

  // Student Search
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);

  // Student Ledger & Obligations
  const [loadingStudentData, setLoadingStudentData] = useState(false);
  const [studentLedger, setStudentLedger] = useState<StudentLedgerSummary | null>(null);
  const [obligations, setObligations] = useState<EligibleObligation[]>([]);
  const [selectedObligation, setSelectedObligation] = useState<EligibleObligation | null>(null);

  // Payment Form Fields
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Online Gateway State
  const [activeOnlineOrder, setActiveOnlineOrder] = useState<any | null>(null);
  const [showGatewaySimulation, setShowGatewaySimulation] = useState(false);
  const [simulatedPaymentId, setSimulatedPaymentId] = useState<string>('');

  // Active Confirmed Receipt Display
  const [activeReceipt, setActiveReceipt] = useState<ReceiptDocument | null>(null);

  // Payment History State
  const [historyItems, setHistoryItems] = useState<PaymentHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');
  const [historyMethodFilter, setHistoryMethodFilter] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [viewingReceiptModal, setViewingReceiptModal] = useState<ReceiptDocument | null>(null);
  const [loadingReceiptDetails, setLoadingReceiptDetails] = useState(false);

  // Currency Formatter
  const formatMoney = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Initial Metadata
  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const res = await apiClient.get('/academic-years').catch(() => ({ data: [] }));
      const years = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setAcademicYears(years);
      if (years.length > 0) {
        setSelectedYearId(years[0].academic_year_id || years[0].id || '');
      }
    } catch (err) {
      console.error('Error fetching academic years:', err);
    }
  };

  // 2. Search Students List
  const fetchStudents = useCallback(
    async (query = '', yearId = selectedYearId) => {
      setSearching(true);
      try {
        const res = await apiClient.get('/fees/ledger/students', {
          params: {
            query: query || undefined,
            academicYearId: yearId || undefined,
            limit: 25,
          },
        });
        const list: StudentListItem[] = res.data?.data || [];
        setStudents(list);

        // If no student is selected, pre-select the first student if available
        if (!selectedStudent && list.length > 0) {
          handleSelectStudent(list[0]);
        }
      } catch (err) {
        console.error('Error searching students:', err);
      } finally {
        setSearching(false);
      }
    },
    [selectedYearId, selectedStudent]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(searchQuery, selectedYearId);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedYearId, fetchStudents]);

  // 3. Select Student & Load Ledger + Obligations
  const handleSelectStudent = async (student: StudentListItem) => {
    setSelectedStudent(student);
    setSelectedObligation(null);
    setCollectAmount('');
    setReferenceNo('');
    setRemarks('');
    setActiveReceipt(null);
    setLoadingStudentData(true);

    try {
      const [ledgerRes, obligationsRes] = await Promise.all([
        apiClient
          .get(`/fees/ledger/students/${student.student_id}`, {
            params: { academicYearId: selectedYearId || undefined },
          })
          .catch(() => ({ data: { data: null } })),
        apiClient
          .get(`/fees/payments/students/${student.student_id}/obligations`)
          .catch(() => ({ data: { data: { obligations: [] } } })),
      ]);

      const ledger = ledgerRes.data?.data || null;
      const obList: EligibleObligation[] = obligationsRes.data?.data?.obligations || [];

      setStudentLedger(ledger);
      setObligations(obList);

      // Auto-select the first unpaid obligation
      const firstPayable = obList.find((o) => o.remaining_payable_amount > 0);
      if (firstPayable) {
        setSelectedObligation(firstPayable);
        setCollectAmount(firstPayable.remaining_payable_amount.toFixed(2));
      }
    } catch (err: any) {
      console.error('Error loading student dues:', err);
      toast.error('Failed to load obligations for selected student');
    } finally {
      setLoadingStudentData(false);
    }
  };

  // 4. Handle selecting obligation
  const handleObligationChange = (ob: EligibleObligation) => {
    setSelectedObligation(ob);
    setCollectAmount(ob.remaining_payable_amount.toFixed(2));
  };

  // 5. Payment Method Categories
  const isOnlineMethod = ['upi', 'card', 'net_banking', 'wallet'].includes(paymentMethod);

  // 6. Validation before submitting
  const validatePayment = (): boolean => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return false;
    }
    if (!selectedObligation) {
      toast.error('Please select an eligible fee obligation to pay');
      return false;
    }
    const entered = Number(collectAmount);
    if (isNaN(entered) || entered <= 0) {
      toast.error('Please enter a valid positive payment amount');
      return false;
    }
    if (entered > selectedObligation.remaining_payable_amount) {
      toast.error(
        `Amount cannot exceed remaining payable due of ${formatMoney(selectedObligation.remaining_payable_amount)}`
      );
      return false;
    }
    if (['bank_transfer', 'other'].includes(paymentMethod) && !referenceNo.trim()) {
      toast.error('Transaction reference / UTR / Cheque number is required for bank transfer/other');
      return false;
    }
    return true;
  };

  // 7. Initiate Payment Submission
  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePayment()) return;
    setShowConfirmModal(true);
  };

  // 8. Confirm & Process Payment
  const handleProcessConfirmedPayment = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      const amountVal = Math.round(Number(collectAmount) * 100) / 100;

      if (!isOnlineMethod) {
        // OFFLINE PAYMENT FLOW
        const payload = {
          student_id: selectedStudent!.student_id,
          student_charge_due_id: selectedObligation!.student_charge_due_id,
          amount: amountVal,
          payment_method: paymentMethod,
          transaction_reference: referenceNo.trim() || undefined,
          payment_date: paymentDate,
          remarks: remarks.trim() || undefined,
        };

        const res = await apiClient.post('/fees/payments/collect', payload);
        const receiptData = res.data?.data?.receipt;

        toast.success(`Payment of ${formatMoney(amountVal)} recorded successfully!`);
        setActiveReceipt(receiptData);

        // Refresh obligations and ledger
        if (selectedStudent) {
          handleSelectStudent(selectedStudent);
        }
      } else {
        // ONLINE GATEWAY FLOW
        const orderPayload = {
          student_id: selectedStudent!.student_id,
          student_charge_due_id: selectedObligation!.student_charge_due_id,
          amount: amountVal,
          payment_method: paymentMethod,
          notes: remarks.trim() || `Online fee collection for ${selectedStudent!.full_name}`,
        };

        const orderRes = await apiClient.post('/fees/payments/create-order', orderPayload);
        const orderData = orderRes.data?.data;
        const orderInfo = orderData?.order || orderData;
        setActiveOnlineOrder(orderInfo);

        // Check if simulation mode or real Razorpay checkout
        if (orderInfo.is_simulation) {
          setSimulatedPaymentId(`pay_sim_${Date.now()}`);
          setShowGatewaySimulation(true);
        } else {
          // Load official Razorpay Checkout script
          const isScriptLoaded = await loadRazorpayScript();
          if (!isScriptLoaded) {
            toast.error('Failed to load official Razorpay Checkout SDK. Please verify internet connectivity.');
            setSubmitting(false);
            return;
          }

          const rzp = new (window as any).Razorpay({
            key: orderInfo.key_id,
            amount: Math.round(orderInfo.amount * 100),
            currency: orderInfo.currency || 'INR',
            name: 'EduTrack ERP',
            description: `Fee Collection - ${selectedStudent!.full_name}`,
            order_id: orderInfo.gateway_order_id,
            handler: async (response: any) => {
              await verifyGatewayPayment({
                payment_order_id: orderInfo.payment_order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
            },
            prefill: {
              name: selectedStudent!.full_name,
            },
            theme: {
              color: '#4f46e5',
            },
            modal: {
              ondismiss: () => {
                setSubmitting(false);
                toast.info('Razorpay checkout closed without completing payment.');
              },
            },
          });

          rzp.on('payment.failed', (resp: any) => {
            loggerFailedPayment(resp);
          });

          rzp.open();
        }
      }
    } catch (err: any) {
      console.error('Payment processing error:', err);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  const loggerFailedPayment = (resp: any) => {
    toast.error(`Payment failed: ${resp.error?.description || 'Gateway transaction declined'}`);
    setSubmitting(false);
  };

  // 9. Gateway Verification Callback
  const verifyGatewayPayment = async (verificationPayload: {
    payment_order_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    setSubmitting(true);
    try {
      const verifyRes = await apiClient.post('/fees/payments/verify', {
        paymentOrderId: verificationPayload.payment_order_id,
        razorpayOrderId: verificationPayload.razorpay_order_id,
        razorpayPaymentId: verificationPayload.razorpay_payment_id,
        razorpaySignature: verificationPayload.razorpay_signature,
      });
      const receiptData = verifyRes.data?.data?.receipt;

      toast.success('Online payment verified and allocated successfully!');
      setActiveReceipt(receiptData);
      setShowGatewaySimulation(false);
      setActiveOnlineOrder(null);

      if (selectedStudent) {
        handleSelectStudent(selectedStudent);
      }
    } catch (err: any) {
      console.error('Gateway verification failed:', err);
      toast.error(err.response?.data?.message || 'Payment signature verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  // 10. Simulate Verification Action (Development Only)
  const handleExecuteSimulation = async (simStatus: 'SUCCESS' | 'FAILURE') => {
    if (!activeOnlineOrder) return;

    if (simStatus === 'FAILURE') {
      setShowGatewaySimulation(false);
      setActiveOnlineOrder(null);
      toast.error('Online payment cancelled by user or gateway declined transaction');
      return;
    }

    await verifyGatewayPayment({
      payment_order_id: activeOnlineOrder.payment_order_id,
      razorpay_order_id: activeOnlineOrder.gateway_order_id || `order_sim_${Date.now()}`,
      razorpay_payment_id: simulatedPaymentId || `pay_sim_${Date.now()}`,
      razorpay_signature: `sim_valid_sig_${Date.now()}`,
    });
  };

  // 11. Fetch Payment History
  const fetchPaymentHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get('/fees/payments/history', {
        params: {
          studentId: selectedStudent?.student_id || undefined,
          status: historyStatusFilter || undefined,
          paymentMethod: historyMethodFilter || undefined,
          page: historyPage,
          limit: 15,
        },
      });

      const data = res.data?.data;
      setHistoryItems(data?.items || []);
      setHistoryTotalPages(data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      toast.error('Failed to load payment history');
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedStudent, historyStatusFilter, historyMethodFilter, historyPage]);

  useEffect(() => {
    if (workspaceTab === 'HISTORY') {
      fetchPaymentHistory();
    }
  }, [workspaceTab, fetchPaymentHistory]);

  // 12. View Specific Receipt in History
  const handleViewReceipt = async (transactionId: string) => {
    setLoadingReceiptDetails(true);
    try {
      const res = await apiClient.get(`/fees/payments/receipts/${transactionId}`);
      setViewingReceiptModal(res.data?.data);
    } catch (err: any) {
      toast.error('Failed to load official receipt details');
    } finally {
      setLoadingReceiptDetails(false);
    }
  };

  // 13. Printable Receipt Handler
  const handlePrintReceipt = (doc: ReceiptDocument) => {
    const win = window.open('', '_blank', 'width=750,height=900');
    if (!win) {
      toast.error('Please allow popups to print official receipts');
      return;
    }

    const allocationsHtml = doc.allocations
      .map(
        (a) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 8px;">${a.component_name || 'Fee Due'}</td>
          <td style="padding: 10px 8px; text-align: center;">${a.due_date ? new Date(a.due_date).toLocaleDateString('en-IN') : '—'}</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 600;">₹${Number(a.allocated_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `
      )
      .join('');

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${doc.receipt_no} - EduTrack ERP</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            padding: 32px;
            margin: 0;
            background: #fff;
          }
          .receipt-box {
            border: 2px solid #0f172a;
            border-radius: 16px;
            padding: 28px;
            max-width: 680px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 22px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #0f172a;
          }
          .header p {
            margin: 4px 0 0;
            font-size: 12px;
            color: #64748b;
          }
          .badge {
            display: inline-block;
            background: #dcfce7;
            color: #15803d;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 9999px;
            margin-top: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 24px;
            font-size: 13px;
            margin-bottom: 24px;
          }
          .meta-label {
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
          }
          .meta-value {
            font-weight: 600;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-bottom: 24px;
          }
          th {
            background: #f8fafc;
            color: #475569;
            text-align: left;
            padding: 8px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #cbd5e1;
          }
          .total-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
          .total-amount {
            font-size: 22px;
            font-weight: 800;
            color: #047857;
          }
          .footer {
            text-align: center;
            border-top: 1px dashed #cbd5e1;
            padding-top: 16px;
            font-size: 11px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .receipt-box { border: 1px solid #000; border-radius: 0; padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <h1>${doc.institution_name || 'EduTrack ERP'}</h1>
            <p>Official Student Fee Payment Receipt</p>
            <div class="badge">Verified Payment • Status: ${doc.status}</div>
          </div>

          <div class="meta-grid">
            <div>
              <div class="meta-label">Receipt Reference</div>
              <div class="meta-value">${doc.receipt_no}</div>
            </div>
            <div>
              <div class="meta-label">Payment Date & Time</div>
              <div class="meta-value">${new Date(doc.payment_date || doc.issued_at).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div class="meta-label">Student Name</div>
              <div class="meta-value">${doc.student.student_name}</div>
            </div>
            <div>
              <div class="meta-label">Admission Number</div>
              <div class="meta-value">${doc.student.admission_no}</div>
            </div>
            <div>
              <div class="meta-label">Payment Method</div>
              <div class="meta-value" style="text-transform: uppercase;">${doc.payment_method.replace('_', ' ')}</div>
            </div>
            <div>
              <div class="meta-label">Transaction / Gateway Reference</div>
              <div class="meta-value">${doc.gateway_reference || 'N/A'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Obligation / Component</th>
                <th style="text-align: center;">Due Date</th>
                <th style="text-align: right;">Amount Allocated</th>
              </tr>
            </thead>
            <tbody>
              ${allocationsHtml}
            </tbody>
          </table>

          <div class="total-box">
            <div>
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b;">Total Amount Collected</div>
              <div style="font-size: 12px; color: #475569;">Indian Rupees (INR)</div>
            </div>
            <div class="total-amount">₹${Number(doc.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>

          <div class="footer">
            <p>This is a computer-generated official ERP financial receipt and does not require a physical signature.</p>
            <p>Payment Transaction ID: ${doc.payment_transaction_id} • Issued At: ${new Date(doc.issued_at).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 text-slate-800 dark:text-slate-100 animate-in fade-in duration-300">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <span>Finance</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Payment Collection</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Coins className="w-9 h-9 text-indigo-600 dark:text-indigo-400" />
            Payment Collection
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Collect, verify, and allocate student fee payments against authoritative obligations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Year Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-1.5 shadow-sm text-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              aria-label="Academic Year"
              className="bg-transparent text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
            >
              {academicYears.map((y) => (
                <option key={y.academic_year_id || y.id} value={y.academic_year_id || y.id}>
                  {y.name || y.academic_year_id} {y.is_current ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => {
              if (selectedStudent) handleSelectStudent(selectedStudent);
              if (workspaceTab === 'HISTORY') fetchPaymentHistory();
              toast.info('Refreshed workspace state');
            }}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm transition-all"
            title="Refresh Workspace"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── TOP TABS NAVIGATION ── */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
        <button
          onClick={() => setWorkspaceTab('COLLECT')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
            workspaceTab === 'COLLECT'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Collect Fee Payment
        </button>
        <button
          onClick={() => setWorkspaceTab('HISTORY')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
            workspaceTab === 'HISTORY'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Payment Transactions History
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: COLLECT PAYMENT ── */}
      {/* ════════════════════════════════════════════════════════════════════════════════ */}
      {workspaceTab === 'COLLECT' && (
        <div className="space-y-8">
          {/* Active Generated Receipt Banner (Shown immediately after collection) */}
          {activeReceipt && (
            <div className="p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 space-y-4 animate-in fade-in duration-300 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Transaction Confirmed & Allocated
                    </span>
                    <h3 className="text-xl font-black">Official Receipt {activeReceipt.receipt_no}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Amount Collected: <b>{formatMoney(activeReceipt.amount)}</b> via{' '}
                      <span className="uppercase">{activeReceipt.payment_method.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handlePrintReceipt(activeReceipt)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Printer className="w-4 h-4" /> Print Official Receipt
                  </button>
                  <button
                    onClick={() => setActiveReceipt(null)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Collection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── LEFT COLUMN: Student Search & Selection (4 Cols) ── */}
            <div className="lg:col-span-4 space-y-6">
              <div className={GLASS_CARD}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    1. Select Student
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Tenant Scoped
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    aria-label="Search student by name or admission number"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white pl-10 pr-4 py-2.5 rounded-2xl outline-none text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Search name, admission #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searching && (
                    <div className="absolute right-3.5 top-3">
                      <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Students List */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {students.map((st) => {
                    const isSelected = selectedStudent?.student_id === st.student_id;
                    return (
                      <div
                        key={st.student_id}
                        onClick={() => handleSelectStudent(st)}
                        className={`p-3 rounded-2xl cursor-pointer border transition-all text-xs ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 shadow-sm'
                            : 'bg-white/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900 dark:text-white">{st.full_name}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {st.admission_no}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          <span>
                            {st.enrollment?.grade_name || 'No Grade'} • {st.enrollment?.section_name || '—'}
                          </span>
                          <span className="capitalize">{st.status}</span>
                        </div>
                      </div>
                    );
                  })}

                  {students.length === 0 && !searching && (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No students found matching query.
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Student Ledger Summary Card */}
              {selectedStudent && (
                <div className={GLASS_CARD}>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10 mb-4">
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        {selectedStudent.full_name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Admission: <span className="font-mono font-bold">{selectedStudent.admission_no}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400">
                      {selectedStudent.enrollment?.grade_name || 'Student'}
                    </span>
                  </div>

                  {loadingStudentData ? (
                    <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      Loading verified ledger balance...
                    </div>
                  ) : studentLedger ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Assessed</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {formatMoney(studentLedger.summary.total_assessed_amount)}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                            Total Paid
                          </span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300">
                            {formatMoney(studentLedger.summary.total_paid_amount)}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-widest text-rose-600 dark:text-rose-400 block">
                            Outstanding Balance
                          </span>
                          <span className="text-lg font-black text-rose-700 dark:text-rose-300">
                            {formatMoney(studentLedger.summary.outstanding_balance)}
                          </span>
                        </div>
                        {studentLedger.summary.overdue_balance > 0 && (
                          <div className="text-right">
                            <span className="text-[9px] uppercase font-bold text-amber-600 block">Overdue</span>
                            <span className="text-xs font-bold text-amber-700">
                              {formatMoney(studentLedger.summary.overdue_balance)}
                            </span>
                          </div>
                        )}
                      </div>

                      {studentLedger.summary.reliability_notes?.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                          <div className="flex items-center gap-1 font-bold">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            Ledger Diagnostic Notes
                          </div>
                          {studentLedger.summary.reliability_notes.map((note, idx) => (
                            <p key={idx} className="text-[10px]">
                              • {note}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-4">No ledger summary available.</div>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Obligation Selector & Payment Entry (8 Cols) ── */}
            <div className="lg:col-span-8 space-y-6">
              {/* Step 2: Eligible Obligation Selector */}
              <div className={GLASS_CARD}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                    <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    2. Select Eligible Fee Obligation
                  </h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Authoritative Dues
                  </span>
                </div>

                {loadingStudentData ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading obligations...</div>
                ) : obligations.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-white/10 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No unpaid obligations found
                    </p>
                    <p className="text-[11px] text-slate-400">
                      This student has cleared all scheduled fee dues, or no charges have been assessed yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {obligations.map((ob) => {
                      const isSelected =
                        selectedObligation?.student_charge_due_id === ob.student_charge_due_id;
                      return (
                        <div
                          key={ob.student_charge_due_id}
                          onClick={() => handleObligationChange(ob)}
                          className={`p-4 rounded-2xl cursor-pointer border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                            isSelected
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                              : 'bg-white/40 dark:bg-slate-800/30 border-slate-200 dark:border-white/10 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                {ob.component_name}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  ob.is_overdue
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                                    : ob.status === 'partially_paid'
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                }`}
                              >
                                {ob.is_overdue ? 'Overdue' : ob.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {ob.description || 'Standard Term Obligation'}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Due: {new Date(ob.due_date).toLocaleDateString('en-IN')}
                              </span>
                              <span>Original: {formatMoney(ob.original_amount)}</span>
                              {ob.previously_allocated_amount > 0 && (
                                <span className="text-emerald-600 font-bold">
                                  Paid: {formatMoney(ob.previously_allocated_amount)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-white/5 pt-2 md:pt-0">
                            <div className="text-right">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                                Remaining Payable
                              </span>
                              <span className="text-base font-black text-rose-600 dark:text-rose-400">
                                {formatMoney(ob.remaining_payable_amount)}
                              </span>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Payment Configuration & Submission Form */}
              <form onSubmit={handleInitiatePayment} className={`${GLASS_CARD} space-y-6`}>
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-4">
                  <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    3. Payment Entry & Method
                  </h3>
                  {selectedObligation && (
                    <span className="text-xs font-bold text-slate-500">
                      Obligation: <b className="text-slate-800 dark:text-slate-200">{selectedObligation.component_name}</b>
                    </span>
                  )}
                </div>

                {/* Amount Input with Quick Pills */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Amount to Collect (INR ₹) <span className="text-rose-500">*</span>
                    </label>
                    {selectedObligation && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCollectAmount(selectedObligation.remaining_payable_amount.toFixed(2))}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold hover:bg-indigo-100 transition-all"
                        >
                          Full ({formatMoney(selectedObligation.remaining_payable_amount)})
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCollectAmount((selectedObligation.remaining_payable_amount / 2).toFixed(2))
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold hover:bg-slate-200 transition-all"
                        >
                          50%
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-sm font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selectedObligation?.remaining_payable_amount || 999999}
                      value={collectAmount}
                      onChange={(e) => setCollectAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={!selectedObligation}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-8 pr-4 py-2.5 rounded-2xl outline-none font-mono font-bold text-base focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                    />
                  </div>
                  {selectedObligation && Number(collectAmount) > selectedObligation.remaining_payable_amount && (
                    <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Amount exceeds eligible due of {formatMoney(selectedObligation.remaining_payable_amount)}
                    </p>
                  )}
                </div>

                {/* Payment Method Selector Grid */}
                <div className="space-y-3">
                  <label className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                    Supported Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Offline Methods */}
                    <div
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 rounded-2xl border cursor-pointer text-center space-y-1 transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-sm'
                          : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/30 hover:border-slate-300'
                      }`}
                    >
                      <Banknote className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
                      <div className="text-xs font-black">Cash</div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Offline Counter</div>
                    </div>

                    <div
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-3 rounded-2xl border cursor-pointer text-center space-y-1 transition-all ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-sm'
                          : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/30 hover:border-slate-300'
                      }`}
                    >
                      <Landmark className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
                      <div className="text-xs font-black">Bank Transfer</div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">NEFT / RTGS / IMPS</div>
                    </div>

                    <div
                      onClick={() => setPaymentMethod('other')}
                      className={`p-3 rounded-2xl border cursor-pointer text-center space-y-1 transition-all ${
                        paymentMethod === 'other'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-sm'
                          : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/30 hover:border-slate-300'
                      }`}
                    >
                      <Receipt className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
                      <div className="text-xs font-black">Cheque / DD</div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">Other Offline</div>
                    </div>

                    {/* Online Gateway Methods */}
                    <div
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-2xl border cursor-pointer text-center space-y-1 transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 shadow-sm'
                          : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/30 hover:border-slate-300'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 mx-auto text-indigo-600 dark:text-indigo-400" />
                      <div className="text-xs font-black">UPI QR / App</div>
                      <div className="text-[9px] uppercase font-bold text-indigo-500">Gateway Flow</div>
                    </div>

                    <div
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border cursor-pointer text-center space-y-1 transition-all ${
                        paymentMethod === 'card'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 shadow-sm'
                          : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/30 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 mx-auto text-indigo-600 dark:text-indigo-400" />
                      <div className="text-xs font-black">Debit / Credit</div>
                      <div className="text-[9px] uppercase font-bold text-indigo-500">Gateway Flow</div>
                    </div>

                    <div
                      onClick={() => setPaymentMethod('net_banking')}
                      className={`p-3 rounded-2xl border cursor-pointer text-center space-y-1 transition-all ${
                        paymentMethod === 'net_banking'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 shadow-sm'
                          : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/30 hover:border-slate-300'
                      }`}
                    >
                      <Landmark className="w-5 h-5 mx-auto text-indigo-600 dark:text-indigo-400" />
                      <div className="text-xs font-black">Net Banking</div>
                      <div className="text-[9px] uppercase font-bold text-indigo-500">Gateway Flow</div>
                    </div>

                    <div
                      onClick={() => setPaymentMethod('wallet')}
                      className={`p-3 rounded-2xl border cursor-pointer text-center space-y-1 transition-all ${
                        paymentMethod === 'wallet'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100 shadow-sm'
                          : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/30 hover:border-slate-300'
                      }`}
                    >
                      <Wallet className="w-5 h-5 mx-auto text-indigo-600 dark:text-indigo-400" />
                      <div className="text-xs font-black">Prepaid Wallet</div>
                      <div className="text-[9px] uppercase font-bold text-indigo-500">Gateway Flow</div>
                    </div>
                  </div>

                  {/* Mode explanation */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>
                      {isOnlineMethod
                        ? 'Online Payment Mode: Creates a secure payment order and validates payment via Razorpay / Gateway before updating ledger.'
                        : 'Offline Payment Mode: Staff verified counter transaction. Allocates immediately and creates verifiable official receipt.'}
                    </span>
                  </div>
                </div>

                {/* Additional Payment Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Payment Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-4 py-2.5 rounded-2xl outline-none text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  {/* Transaction Reference / Cheque No / UTR */}
                  <div className="space-y-1">
                    <label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                      Transaction Reference / UTR / Cheque #{' '}
                      {['bank_transfer', 'other'].includes(paymentMethod) && (
                        <span className="text-rose-500">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      placeholder={
                        paymentMethod === 'bank_transfer'
                          ? 'Enter Bank UTR Number'
                          : paymentMethod === 'other'
                            ? 'Enter Cheque / DD Number'
                            : 'Optional receipt / slip reference'
                      }
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-4 py-2.5 rounded-2xl outline-none text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Optional Remarks */}
                <div className="space-y-1">
                  <label className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    Staff Remarks / Internal Audit Notes
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Received at Front Office Counter 1"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-4 py-2.5 rounded-2xl outline-none text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      !selectedObligation ||
                      !collectAmount ||
                      Number(collectAmount) <= 0 ||
                      submitting
                    }
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Processing Transaction...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Review & Collect Payment ({formatMoney(Number(collectAmount) || 0)})
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: PAYMENT HISTORY ── */}
      {/* ════════════════════════════════════════════════════════════════════════════════ */}
      {workspaceTab === 'HISTORY' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <select
                aria-label="Filter by Status"
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="initiated">Initiated</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              {/* Method Filter */}
              <select
                aria-label="Filter by Payment Method"
                value={historyMethodFilter}
                onChange={(e) => setHistoryMethodFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="net_banking">Net Banking</option>
                <option value="wallet">Wallet</option>
                <option value="other">Other / Cheque</option>
              </select>

              {selectedStudent && (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl">
                  Scoped to: {selectedStudent.full_name}
                </span>
              )}
            </div>

            <button
              onClick={() => fetchPaymentHistory()}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh History
            </button>
          </div>

          {/* History Records Table */}
          <div className={GLASS_CARD}>
            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                Loading authoritative payment history...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No payment transaction records found matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 text-[10px] uppercase font-black tracking-wider text-slate-400">
                      <th className="pb-3 px-2">Date & Time</th>
                      <th className="pb-3 px-2">Receipt / Reference</th>
                      <th className="pb-3 px-2">Student</th>
                      <th className="pb-3 px-2">Method & Gateway</th>
                      <th className="pb-3 px-2">Amount</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2">Allocation</th>
                      <th className="pb-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {historyItems.map((item) => (
                      <tr
                        key={item.payment_transaction_id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all"
                      >
                        <td className="py-3 px-2 text-slate-500">
                          {new Date(item.created_at).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {item.receipt_no}
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {item.student_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.admission_no}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-bold uppercase text-[11px] block">
                            {item.payment_method.replace('_', ' ')}
                          </span>
                          <span className="text-[9px] text-slate-400 uppercase">
                            {item.gateway_name}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-black text-slate-900 dark:text-white">
                          {formatMoney(item.amount)}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              item.status === 'success'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : item.status === 'failed'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`text-[10px] font-bold capitalize ${
                              item.allocation_status === 'allocated'
                                ? 'text-emerald-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.allocation_status} ({item.allocations_count})
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => handleViewReceipt(item.payment_transaction_id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-all"
                            title="View Official Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirmModal && selectedStudent && selectedObligation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Confirm Payment Collection
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedStudent.full_name} ({selectedStudent.admission_no})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Obligation:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedObligation.component_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400">
                  {paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-bold text-slate-900 dark:text-white">{paymentDate}</span>
              </div>
              {referenceNo && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {referenceNo}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 dark:border-white/10 pt-2 flex justify-between items-center">
                <span className="font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Total To Collect:
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatMoney(Number(collectAmount))}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessConfirmedPayment}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Confirm & Collect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GATEWAY SIMULATION MODAL (For Online flows when testing or keys missing) ── */}
      {showGatewaySimulation && activeOnlineOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black uppercase tracking-tight">Gateway Checkout</h3>
              </div>
              <button
                onClick={() => setShowGatewaySimulation(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>DEV SIMULATION ONLY — No server Razorpay keys detected. Real payments use official Checkout.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                  {activeOnlineOrder.gateway_order_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {activeOnlineOrder.payment_transaction_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Due:</span>
                <span className="font-black text-indigo-600 text-sm">
                  {formatMoney(activeOnlineOrder.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">
                Simulated Gateway Payment ID
              </label>
              <input
                type="text"
                value={simulatedPaymentId}
                onChange={(e) => setSimulatedPaymentId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-3 py-2 rounded-xl text-xs font-mono outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleExecuteSimulation('FAILURE')}
                className="flex-1 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Decline / Cancel
              </button>
              <button
                onClick={() => handleExecuteSimulation('SUCCESS')}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Authorize & Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW RECEIPT MODAL (From History) ── */}
      {viewingReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black uppercase tracking-tight">Official Fee Receipt</h3>
              </div>
              <button
                onClick={() => setViewingReceiptModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-2">
                <div className="flex justify-between font-mono font-bold text-sm">
                  <span>{viewingReceiptModal.receipt_no}</span>
                  <span className="text-emerald-600 uppercase font-black">
                    {viewingReceiptModal.status}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Student:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {viewingReceiptModal.student.student_name} ({viewingReceiptModal.student.admission_no})
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Method:</span>
                  <span className="font-bold uppercase">
                    {viewingReceiptModal.payment_method.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment Date:</span>
                  <span>{new Date(viewingReceiptModal.payment_date).toLocaleString('en-IN')}</span>
                </div>
                {viewingReceiptModal.gateway_reference && (
                  <div className="flex justify-between text-slate-500">
                    <span>Reference:</span>
                    <span className="font-mono">{viewingReceiptModal.gateway_reference}</span>
                  </div>
                )}
              </div>

              {/* Allocations breakdown */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Allocated Fee Obligations
                </span>
                <div className="divide-y divide-slate-100 dark:divide-white/5 border border-slate-100 dark:border-white/10 rounded-2xl p-3">
                  {viewingReceiptModal.allocations.map((al) => (
                    <div key={al.allocation_id} className="py-2 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {al.component_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Due: {new Date(al.due_date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <span className="font-mono font-black text-emerald-600">
                        {formatMoney(al.allocated_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 flex justify-between items-center">
                <span className="text-xs uppercase font-black text-emerald-800 dark:text-emerald-300">
                  Total Amount Paid
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatMoney(viewingReceiptModal.amount)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setViewingReceiptModal(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Close
              </button>
              <button
                onClick={() => handlePrintReceipt(viewingReceiptModal)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentEntry;
