"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { differenceInDays, format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

function LoanStatusContent() {
  const searchParams = useSearchParams();
  const amountStr = searchParams.get('a');
  const dateStr = searchParams.get('d');
  const receiptNo = searchParams.get('r');
  const nameStr = searchParams.get('n');

  const [result, setResult] = useState<any>(null);
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    if (amountStr && dateStr) {
      const principal = parseFloat(amountStr);
      const start = /^\d+$/.test(dateStr) ? new Date(Number(dateStr)) : new Date(dateStr);
      const ratePerMonth = 3; // 3%

      const totalDays = Math.max(0, differenceInDays(endDate, start));
      const yearlyRate = ratePerMonth * 12;
      const timeInYears = totalDays / 365;
      const totalInterest = (principal * yearlyRate * timeInYears) / 100;

      setResult({
        principal,
        start,
        end: endDate,
        totalDays,
        totalInterest,
        totalAmount: principal + totalInterest,
        receiptNo,
        customerName: nameStr
      });
    }
  }, [amountStr, dateStr, receiptNo, nameStr, endDate]);

  if (!amountStr || !dateStr) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center text-rose-800 font-bold">Invalid QR Code or Missing Data</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-rose-800" />
      </div>
    );
  }

  const formatDuration = (days: number) => {
    const years = Math.floor(days / 365)
    const months = Math.floor((days % 365) / 30)
    const remainingDays = days % 30
    const parts = []
    if (years > 0) parts.push(`${years} Year${years > 1 ? 's' : ''}`)
    if (months > 0) parts.push(`${months} Month${months > 1 ? 's' : ''}`)
    if (remainingDays > 0) parts.push(`${remainingDays} Day${remainingDays > 1 ? 's' : ''}`)
    return parts.join(', ') || '0 Days'
  }

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center space-y-1 mb-6">
           <div className="w-16 h-16 bg-rose-800 text-white rounded-full flex items-center justify-center mx-auto shadow-lg mb-4">
             <ShieldCheck className="w-8 h-8" />
           </div>
           <h1 className="text-2xl font-black text-rose-900 uppercase tracking-tight">KBS Gold Loan</h1>
           <p className="text-rose-700 text-sm font-bold uppercase tracking-widest">Verified Receipt Status</p>
        </div>

        <Card className="border-rose-200 shadow-xl overflow-hidden rounded-2xl">
          <div className="h-1.5 bg-rose-800 w-full" />
          <CardContent className="p-0">
             <div className="bg-rose-800 p-6 text-center text-white">
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Current Payable Amount</p>
                <p className="text-4xl font-black tracking-tight" style={{ fontFamily: 'Arial, sans-serif' }}>
                   ₹{Math.round(result.totalAmount).toLocaleString('en-IN')}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                   <span className="text-white/80 text-xs font-medium">
                     {format(result.start, 'dd MMM yyyy')}
                   </span>
                   <ArrowRight className="w-3 h-3 text-white/60" />
                   <span className="text-white/80 text-xs font-medium">
                     {format(result.end, 'dd MMM yyyy')}
                   </span>
                </div>
             </div>
             
             <div className="p-6 space-y-4 bg-white">
                {result.receiptNo && (
                   <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                      <span className="text-xs font-bold text-rose-900/60 uppercase tracking-wider">Receipt No</span>
                      <span className="text-sm font-black text-rose-950">{result.receiptNo}</span>
                   </div>
                )}
                {result.customerName && (
                   <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                      <span className="text-xs font-bold text-rose-900/60 uppercase tracking-wider">Customer</span>
                      <span className="text-sm font-bold text-rose-950 uppercase">{result.customerName}</span>
                   </div>
                )}
                <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                   <span className="text-xs font-bold text-rose-900/60 uppercase tracking-wider">Principal Amount</span>
                   <span className="text-sm font-black text-rose-950">₹{Math.round(result.principal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                   <span className="text-xs font-bold text-rose-900/60 uppercase tracking-wider">Interest Rate</span>
                   <span className="text-sm font-bold text-rose-950">3% / month</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                   <span className="text-xs font-bold text-rose-900/60 uppercase tracking-wider">Duration</span>
                   <span className="text-sm font-bold text-rose-950">{formatDuration(result.totalDays)}</span>
                </div>
                <div className="flex items-center justify-between pb-1 border-rose-100">
                   <span className="text-xs font-bold text-rose-900/60 uppercase tracking-wider">Total Interest</span>
                   <span className="text-sm font-black text-rose-700">₹{Math.round(result.totalInterest).toLocaleString('en-IN')}</span>
                </div>
             </div>
          </CardContent>
        </Card>

        <div className="bg-white p-4 rounded-xl shadow-lg border border-rose-200 space-y-2">
           <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider text-center">Calculate for a Different Date</label>
           <input 
             type="date" 
             className="w-full h-12 px-4 rounded-xl border-2 border-rose-100 bg-rose-50 text-rose-950 font-bold focus:outline-none focus:border-rose-400 focus:ring-0 transition-colors text-center uppercase tracking-widest"
             value={format(endDate, 'yyyy-MM-dd')}
             onChange={(e) => {
               if(e.target.value) {
                 setEndDate(new Date(e.target.value));
               }
             }}
           />
        </div>

        <div className="text-center mt-6">
           <p className="text-[10px] font-bold text-rose-900/50 uppercase tracking-widest">Calculated on {format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
        </div>
      </div>
    </div>
  );
}

export default function LoanStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-800" />
      </div>
    }>
      <LoanStatusContent />
    </Suspense>
  );
}
