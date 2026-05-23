"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { differenceInDays, format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { SHARED_ADMIN_ID } from '@/lib/constants';
import { cn } from '@/lib/utils';

function LoanStatusContent() {
  const searchParams = useSearchParams();
  const amountStr = searchParams.get('a');
  const dateStr = searchParams.get('d');
  const receiptNo = searchParams.get('r');
  const nameStr = searchParams.get('n');

  const db = useFirestore();
  const [dbLoan, setDbLoan] = useState<any>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    async function fetchLoan() {
      if (!receiptNo) {
        setIsLoadingDb(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'users', SHARED_ADMIN_ID, 'gold_loans'),
          where('receiptNumber', '==', receiptNo)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setDbLoan(docData);
        }
      } catch (err) {
        console.error("Error fetching live loan details:", err);
      } finally {
        setIsLoadingDb(false);
      }
    }
    fetchLoan();
  }, [receiptNo, db]);

  useEffect(() => {
    if (amountStr && dateStr) {
      const principal = dbLoan ? dbLoan.amount : parseFloat(amountStr);
      const start = dbLoan
        ? (/^\d+$/.test(dbLoan.timestamp) ? new Date(Number(dbLoan.timestamp)) : new Date(dbLoan.timestamp))
        : (/^\d+$/.test(dateStr) ? new Date(Number(dateStr)) : new Date(dateStr));
      const ratePerMonth = 3; // 3%

      // Stop calculations on closed date if loan is closed
      let calculationEnd = endDate;
      if (dbLoan && dbLoan.status === 'Closed' && dbLoan.closedDate) {
        calculationEnd = new Date(dbLoan.closedDate);
      }

      const totalDays = Math.max(0, differenceInDays(calculationEnd, start));
      const yearlyRate = ratePerMonth * 12;
      const timeInYears = totalDays / 365;
      const totalInterest = (principal * yearlyRate * timeInYears) / 100;

      setResult({
        principal,
        start,
        end: calculationEnd,
        totalDays,
        totalInterest,
        totalAmount: principal + totalInterest,
        receiptNo: dbLoan ? dbLoan.receiptNumber : receiptNo,
        customerName: dbLoan ? dbLoan.customerName : nameStr
      });
    }
  }, [amountStr, dateStr, receiptNo, nameStr, endDate, dbLoan]);

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

  const isClosed = dbLoan && dbLoan.status === 'Closed';

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center space-y-1 mb-6">
           <div className={cn(
             "w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg mb-4 text-white transition-all",
             isClosed ? "bg-red-700 animate-pulse" : "bg-rose-800"
           )}>
             <ShieldCheck className="w-8 h-8" />
           </div>
           <h1 className="text-2xl font-black text-rose-900 uppercase tracking-tight">KBS Gold Loan</h1>
           <p className="text-rose-700 text-sm font-bold uppercase tracking-widest">Verified Receipt Status</p>
        </div>

        <Card className={cn(
          "shadow-xl overflow-hidden rounded-2xl border transition-all duration-300",
          isClosed ? "border-red-200" : "border-rose-200"
        )}>
          <div className={cn("h-1.5 w-full", isClosed ? "bg-red-700" : "bg-rose-800")} />
          <CardContent className="p-0">
             <div className={cn(
               "p-6 text-center text-white transition-colors duration-300",
               isClosed ? "bg-gradient-to-br from-red-950 via-rose-950 to-red-900" : "bg-rose-800"
             )}>
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                  {isClosed ? "Loan Closed & Settled" : "Current Payable Amount"}
                </p>
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
                
                {dbLoan && (
                   <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                      <span className="text-xs font-bold text-rose-900/60 uppercase tracking-wider">Loan Status</span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        isClosed ? "bg-red-100 text-red-700 border-red-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"
                      )}>
                        {dbLoan.status || 'Active'}
                      </span>
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

                {/* If Loan is Closed, show all closing details */}
                {isClosed && (
                  <div className="pt-4 mt-2 border-t border-dashed border-red-200 space-y-3">
                    <h3 className="text-xs font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Settlement Details
                    </h3>
                    
                    {dbLoan.paidAmount !== undefined && (
                      <div className="flex items-center justify-between pb-2 border-b border-rose-50">
                        <span className="text-xs font-medium text-rose-900/60 uppercase tracking-wider">Amount Paid</span>
                        <span className="text-xs font-black text-rose-950">
                          ₹{Math.round(dbLoan.paidAmount).toLocaleString('en-IN')}
                          {dbLoan.paidDate && (
                            <span className="text-[10px] font-bold text-rose-900/50 block text-right">
                              on {format(new Date(dbLoan.paidDate), 'dd MMM yyyy')}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {dbLoan.interestPaid !== undefined && (
                      <div className="flex items-center justify-between pb-2 border-b border-rose-50">
                        <span className="text-xs font-medium text-rose-900/60 uppercase tracking-wider">Interest Paid</span>
                        <span className="text-xs font-black text-rose-950">₹{Math.round(dbLoan.interestPaid).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {dbLoan.remainingBalance !== undefined && (
                      <div className="flex items-center justify-between pb-2 border-b border-rose-50">
                        <span className="text-xs font-medium text-rose-900/60 uppercase tracking-wider">Remaining Balance</span>
                        <span className="text-xs font-black text-rose-950">₹{Math.round(dbLoan.remainingBalance).toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    {dbLoan.goldReturned && (
                      <div className="flex items-center justify-between pb-2 border-b border-rose-50">
                        <span className="text-xs font-medium text-rose-900/60 uppercase tracking-wider">Gold Returned?</span>
                        <span className="text-xs font-black text-rose-950">
                          {dbLoan.goldReturned}
                          {dbLoan.goldReturned === 'Yes' && dbLoan.goldReturnedDate && (
                            <span className="text-[10px] font-bold text-rose-900/50 block text-right">
                              on {format(new Date(dbLoan.goldReturnedDate), 'dd MMM yyyy')}
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {dbLoan.adminNotes && (
                      <div className="pb-1">
                        <span className="text-xs font-medium text-rose-900/60 uppercase tracking-wider block mb-1">Settlement Notes</span>
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-950 font-bold whitespace-pre-wrap">
                          {dbLoan.adminNotes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
             </div>
          </CardContent>
        </Card>

        {!isClosed ? (
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
        ) : (
          <div className="bg-red-50 border border-red-200/50 p-4 rounded-xl text-center">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wider">🎉 This Gold Loan is fully closed & settled.</p>
          </div>
        )}

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
