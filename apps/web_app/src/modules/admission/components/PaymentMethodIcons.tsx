import React from 'react';
import {
    Landmark,
    Banknote,
    QrCode,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../../components/ui/tooltip";
import { motion } from 'framer-motion';

interface PaymentIconProps {
    selectedId: string;
    onSelect: (id: string, category: string, label: string) => void;
}

export const ICONS = [
    { id: 'UPI', category: 'UPI', name: 'UPI', icon: QrCode, label: 'UPI QR', tooltip: 'Pay via UPI', color: '#000000' },
    { id: 'PHONEPE', category: 'UPI', name: 'PhonePe', src: '/Phonepe.png', label: 'PhonePe', tooltip: 'PhonePe Payments' },
    { id: 'GPAY', category: 'UPI', name: 'Google Pay', src: '/Googlepay.png', label: 'Google Pay', tooltip: 'Google Pay GPay' },
    { id: 'VISA', category: 'CARD', name: 'Visa', src: '/visacard.png', label: 'Visa Card', tooltip: 'Visa Debit/Credit Cards' },
    { id: 'MASTERCARD', category: 'CARD', name: 'Mastercard', src: '/mastercard.png', label: 'Mastercard', tooltip: 'Mastercard Debit/Credit Cards' },
    { id: 'RUPAY', category: 'CARD', name: 'RuPay', src: '/RupayCard.png', label: 'RuPay Card', tooltip: 'RuPay Debit Cards' },
    { id: 'BANK_TRANSFER', category: 'BANK_TRANSFER', name: 'Bank Transfer', icon: Landmark, label: 'Bank Transfer', tooltip: 'NEFT / RTGS / IMPS', color: '#1A1F71' },
    { id: 'CASH', category: 'CASH', name: 'Cash', icon: Banknote, label: 'Cash', tooltip: 'Cash at Counter', color: '#10B981' },
];

export const PaymentMethodIcons: React.FC<PaymentIconProps> = ({ selectedId, onSelect }) => {
    return (
        <TooltipProvider delayDuration={100}>
            <div className="space-y-4 mt-8">
                <div className="flex items-center gap-4 px-1">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                        Select Payment Method
                    </p>
                    <div className="h-px w-full bg-slate-200 dark:bg-slate-800 opacity-20" />
                </div>

                <div className="flex flex-wrap items-center gap-8 p-6 rounded-3xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-inner min-h-[90px]">
                    {ICONS.map((item) => {
                        const isSelected = item.id === selectedId;

                        return (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onSelect(item.id, item.category, item.label)}
                                        className={`relative transition-all duration-300 flex items-center justify-center cursor-pointer shrink-0 p-3 rounded-2xl ${isSelected
                                                ? 'bg-blue-500/10 border-2 border-blue-500 shadow-lg shadow-blue-500/20'
                                                : 'bg-transparent border-2 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <div className={`transition-all duration-500 ${isSelected ? 'opacity-100' : 'opacity-60 saturate-100 brightness-110'}`}>
                                            {item.src ? (
                                                <div className="w-12 h-8 flex items-center justify-center">
                                                    <img
                                                        src={item.src}
                                                        alt={item.name}
                                                        className="max-h-full max-w-full object-contain"
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                            ) : (
                                                item.icon && <item.icon
                                                    className="w-8 h-8"
                                                    style={{ color: item.color }}
                                                    strokeWidth={1.5}
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </div>

                                        {isSelected && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="top"
                                    className="bg-slate-900 border-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl"
                                >
                                    {item.tooltip}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </div>
        </TooltipProvider>
    );
};
