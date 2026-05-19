"use client"

import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Printer, Loader2, Download, Globe, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { useGoldStore, GoldLoanRecord, Language } from '@/lib/store'
import { translations } from '@/lib/translations'
import { useToast } from '@/hooks/use-toast'
import { Share2, CheckCircle2, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'

// Extracted Terms & Conditions from User Image
const TERMS_AND_CONDITIONS = [
  "1. The rate of interest is agreed between the parties.",
  "2. Maximum period of Limitation (11 Months) for redemption.",
  "3. Pawner will give correct address and in case of any change of address he shall inform the pawnee.",
  "4. On expiry of the period agreed, the pawned articles will be auctioned and over which the pawner will have no claim whatsoever.",
  "5. The Pawner will get token which he/she is bound to preserve and he should produce it before the pawnee at the time of redeeming the pawner articles.",
  "6. A duplicate of the token can be had on submission of letter and on payment of Rs. 50-00.",
  "7. I declare that the above mentioned Gold or Silver ornaments pledged are of my own.",
  "8. Pawner shall give 3 days notice before to the Pawn Broker to release his /her articles after paying full amount.",
  "9. The pawner only should produce the token.",
  "10. If articles are lost the amount of valuation will be refused.",
  "11. If the pledged article is lost the value will be given as mentioned the Receipt.",
  "12. If articles or not redeemed in 11 months will be sold without notice."
];

const ReceiptHalf = ({ loan, t }: { loan: GoldLoanRecord, t: any }) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shivashakthijewellers.vercel.app';
  const qrUrl = `${baseUrl}/loan-status?a=${loan.amount}&d=${loan.timestamp}&r=${loan.receiptNumber}&n=${encodeURIComponent(loan.customerName)}`;

  return (
    <div className="h-[148.5mm] w-[210mm] relative bg-[#fff5f8] border-b-2 border-dashed border-slate-300 p-6 flex flex-col box-border overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] z-0 transform -rotate-[30deg]">
        <span className="text-[180px] font-black text-rose-900 tracking-[0.1em] leading-none">KBS</span>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-16"></div> {/* Spacer for balance */}
          <div className="text-center flex-1">
            <h1 className="text-[28px] font-headline font-black text-rose-700 uppercase tracking-tight leading-none mb-2">{t.shopName}</h1>
            <p className="text-[12px] font-bold text-slate-800 uppercase tracking-[0.1em] font-sans leading-none">
              {t.shopAddress}
            </p>
          </div>
          <div className="w-16 flex justify-end">
            <div className="bg-white p-1 rounded-md border border-rose-200 shadow-sm">
              <QRCodeSVG value={qrUrl} size={54} level="L" fgColor="#881337" />
              <p className="text-[6px] text-center mt-0.5 font-bold text-rose-900 leading-none">SCAN TO CHECK</p>
            </div>
          </div>
        </div>

        {/* Banner Section */}
        <div className="flex justify-center mb-4">
          <div className="bg-rose-700 text-white px-6 py-1.5 rounded-full border-[3px] border-double border-white shadow-[0_0_0_2px_#be123c]">
            <h2 className="text-[14px] font-black uppercase tracking-widest">{t.goldLoanReceipt}</h2>
          </div>
        </div>

        {/* Form Fields - Grid Layout */}
        <div className="flex-1 border-[2px] border-rose-900 bg-white p-5 rounded-xl relative shadow-sm overflow-hidden">
           <div className="grid grid-cols-2 gap-x-12 gap-y-3 pb-8">
             
             {/* Date / Time & Receipt No */}
             <div className="col-span-2 flex justify-between border-b border-rose-100 pb-2">
                <div className="flex gap-4">
                  <div className="font-black text-rose-900 uppercase text-[12px] w-24">Receipt No:</div>
                  <div className="font-bold text-[14px]">{loan.receiptNumber}</div>
                </div>
                <div className="flex gap-4">
                  <div className="font-black text-rose-900 uppercase text-[12px] w-24">Date & Time:</div>
                  <div className="font-bold text-[14px]">{format(new Date(loan.timestamp), 'dd/MM/yyyy hh:mm a')}</div>
                </div>
             </div>

             {/* Customer Name */}
             <div className="col-span-2 flex items-end border-b border-rose-100 pb-2">
               <div className="font-black text-rose-900 uppercase text-[12px] w-32 shrink-0">{t.customerName}:</div>
               <div className={cn(
                 "font-bold uppercase w-full ml-4 line-clamp-1",
                 loan.customerName.length > 30 ? "text-[12px] leading-tight" : "text-[16px]"
               )}>{loan.customerName}</div>
             </div>

             {/* Customer Address */}
             {loan.customerAddress && loan.customerAddress !== 'N/A' && (
               <div className="col-span-2 flex items-end border-b border-rose-100 pb-2">
                 <div className="font-black text-rose-900 uppercase text-[12px] w-32 shrink-0">{t.customerAddress || "Address"}:</div>
                 <div className={cn(
                   "font-bold uppercase w-full ml-4 line-clamp-2",
                   loan.customerAddress.length > 50 ? "text-[11px] leading-tight" : "text-[14px]"
                 )}>{loan.customerAddress}</div>
               </div>
             )}

             {/* Relation */}
             <div className="col-span-2 flex items-end border-b border-rose-100 pb-2">
               <div className="font-black text-rose-900 uppercase text-[12px] w-32 shrink-0">{loan.relationType || "Relation"}:</div>
               <div className="font-bold text-[16px] uppercase w-full ml-4 line-clamp-1">{loan.relationName}</div>
             </div>

             {/* Mobile No */}
             <div className="col-span-1 flex items-end border-b border-rose-100 pb-2">
               <div className="font-black text-rose-900 uppercase text-[12px] w-32 shrink-0">Mobile No:</div>
               <div className="font-bold text-[16px] w-full ml-4">{loan.customerPhone}</div>
             </div>

             {/* Amount */}
             <div className="col-span-1 flex items-end border-b border-rose-100 pb-2">
               <div className="font-black text-rose-900 uppercase text-[12px] w-24 shrink-0">Amount:</div>
               <div className="font-black text-[20px] text-rose-700 w-full ml-4">₹ {Math.round(loan.amount).toLocaleString('en-IN')}</div>
             </div>

             {/* Item Type & Weight */}
             <div className="col-span-1 flex items-end border-b border-rose-100 pb-2">
               <div className="font-black text-rose-900 uppercase text-[12px] w-24 shrink-0">Item Type:</div>
               <div className="font-bold text-[16px] uppercase w-full ml-4">{loan.itemType}</div>
             </div>
             
             <div className="col-span-1 flex items-end border-b border-rose-100 pb-2">
               <div className="font-black text-rose-900 uppercase text-[12px] w-32 shrink-0">Weight (G):</div>
               <div className="font-bold text-[16px] uppercase w-full ml-4">{loan.weight > 0 ? `${loan.weight} G` : '-'}</div>
             </div>

             {/* Item Details */}
             <div className="col-span-2 flex items-start pt-1">
               <div className="font-black text-rose-900 uppercase text-[12px] w-32 shrink-0 pt-1">{t.itemDetails}:</div>
               <div className={cn(
                 "font-bold uppercase w-full ml-4 min-h-[30px] whitespace-pre-wrap border-b border-dashed border-rose-300 pb-2",
                 loan.itemDetails.length > 150 ? "text-[9px] leading-tight line-clamp-4" : 
                 loan.itemDetails.length > 80 ? "text-[11px] leading-snug line-clamp-3" : "text-[13px] leading-relaxed line-clamp-2"
               )}>
                 {loan.itemDetails}
               </div>
             </div>
           </div>

           {/* Signatures */}
           <div className="absolute bottom-2 left-6 right-6 flex justify-between items-end">
              <div className="text-center">
                <div className="w-40 border-t-2 border-rose-900 mb-1"></div>
                <p className="text-[10px] font-black uppercase text-rose-900 tracking-[0.1em]">Signature of the Pawner</p>
              </div>
              <div className="text-center">
                <div className="w-40 border-t-2 border-rose-900 mb-1"></div>
                <p className="text-[10px] font-black uppercase text-rose-900 tracking-[0.1em]">{t.authorizedSignatory}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

const TermsHalf = () => {
  return (
    <div className="h-[148.5mm] w-[210mm] relative bg-[#ffb6c1] border-b-2 border-dashed border-rose-400 p-8 flex flex-col justify-center items-center box-border text-rose-950 font-sans shadow-inner overflow-hidden">
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] z-0 transform -rotate-[30deg]">
          <span className="text-[180px] font-black text-rose-900 tracking-[0.1em] leading-none">KBS</span>
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <h2 className="text-[20px] font-black underline decoration-2 underline-offset-4 mb-3 text-rose-800">TERMS & CONDITIONS</h2>
        
          <div className="text-center mb-4 space-y-0.5 font-bold text-[14px] text-rose-800">
            <p>ప్రతి మూడు నెలలకు వడ్డీ చెల్లించవలెను.</p>
            <p>11 నెలల తరువాత మీ వస్తువులు ఇవ్వబడవు.</p>
            <p>డబ్బు కట్టిన తరువాత 3 రోజులకు మీ వస్తువులు ఇవ్వబడును.</p>
          </div>

          <div className="grid grid-cols-1 gap-y-1.5 text-[11px] w-full max-w-4xl px-8 font-medium">
          {TERMS_AND_CONDITIONS.map((term, i) => (
            <p key={i} className="leading-tight">{term}</p>
          ))}
        </div>

          <div className="mt-6 text-center bg-rose-800 text-white py-1.5 px-6 rounded-lg shadow-md font-bold text-[12px]">
            <p>NOTE : Business Hours from 9-00 a.m. to 6-00 p.m.</p>
            <p>Tuesday, Festival and Amavasya Days Shop is closed.</p>
          </div>
        </div>
    </div>
  )
}

const ReceiptLayout = React.forwardRef<HTMLDivElement, { loan: GoldLoanRecord; t: any }>(
  ({ loan, t }, ref) => {
    return (
      <div 
        ref={ref} 
        id="gold-loan-bill"
        className="mx-auto flex flex-col bg-slate-200"
        style={{ width: '210mm', backgroundColor: '#e2e8f0' }}
      >
        {/* Page 1: Front (Two Receipts) */}
        <div className="bg-white shadow-xl mb-8 print:mb-0 print:shadow-none" style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always' }}>
           <ReceiptHalf loan={loan} t={t} />
           <ReceiptHalf loan={loan} t={t} />
        </div>

        {/* Page 2: Back (Two Terms) */}
        <div className="bg-[#ffb6c1] shadow-xl print:shadow-none" style={{ width: '210mm', height: '297mm' }}>
           <TermsHalf />
           <TermsHalf />
        </div>
      </div>
    );
  }
);
ReceiptLayout.displayName = 'ReceiptLayout';

export interface GoldLoanReceiptProps {
  loan: GoldLoanRecord;
  onClose: () => void;
  onConfirm?: () => void;
  showConfirmButton?: boolean;
}

export const GoldLoanReceipt: React.FC<GoldLoanReceiptProps> = ({ 
  loan, 
  onClose,
  onConfirm,
  showConfirmButton = false
}) => {
  const { language } = useGoldStore()
  const [billLanguage, setBillLanguage] = useState<Language>(language)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const t = translations[billLanguage]
  const { toast } = useToast()

  const languageOptions: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  ]
  const visibleReceiptRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const generatePdfBlob = async (): Promise<Blob | null> => {
    if (!visibleReceiptRef.current) return null;
    
    setIsExporting(true);
    try {
      window.scrollTo(0, 0);
      if (document.fonts) { await document.fonts.ready; }
      
      const html2pdf = (await import('html2pdf.js')).default;
      const element = visibleReceiptRef.current;
      
      const opt = {
        margin: 0,
        filename: `GoldLoan_${loan.receiptNumber}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 2,
          scrollY: 0,
          useCORS: true,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      return await html2pdf().set(opt).from(element).outputPdf('blob');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ variant: "destructive", title: "Export Error", description: "Could not generate PDF." });
      return null;
    } finally {
      setIsExporting(false);
    }
  }

  const handleDownload = async () => {
    const blob = await generatePdfBlob();
    if (!blob) return;
    
    const safeName = (loan.customerName || 'Customer').replace(/[^a-z0-9]/gi, '_');
    const fileName = `GoldLoan_${loan.receiptNumber}_${safeName}.pdf`;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "Success", description: "Loan receipt downloaded as A4 PDF." });
  }

  const handleShareBill = async () => {
    const blob = await generatePdfBlob();
    if (!blob) return;
    
    const safeName = (loan.customerName || 'Customer').replace(/[^a-z0-9]/gi, '_');
    const fileName = `GoldLoan_${loan.receiptNumber}_${safeName}.pdf`;
    const file = new File([blob], fileName, { type: "application/pdf" });
    
    const customerPhoneRaw = loan.customerPhone || '';
    const cleanPhone = customerPhoneRaw.replace(/\D/g, '');
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `KBS Gold Loan - ${loan.receiptNumber}`,
          text: `Here is your Gold Loan Receipt for ${loan.customerName || 'Customer'}.`,
        });
        return;
      } catch (error) {
        console.error('Native sharing failed:', error);
      }
    }

    const text = `*KBS GOLD LOAN*\n*Receipt No:* ${loan.receiptNumber}\n*Customer:* ${loan.customerName || 'Customer'}\n*Amount:* Rs ${Math.round(loan.amount || 0).toLocaleString()}\n\nPlease find your digital receipt attached.`;
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Sharing via WhatsApp",
      description: `Sharing loan receipt to ${cleanPhone || 'customer'}.`
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-slate-950/95 animate-in fade-in duration-300 overflow-y-auto no-print flex flex-col items-center p-4 md:p-10">
        <div className="w-[210mm] relative mb-12 flex flex-col items-center">
          {/* Top bar */}
          <div className="absolute -top-12 left-0 right-0 flex items-center justify-between z-[110]">
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-bold">{languageOptions.find(l => l.code === billLanguage)?.native}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showLangMenu && "rotate-180")} />
              </button>
              {showLangMenu && (
                <div className="absolute top-full left-0 mt-2 w-44 bg-slate-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[120]">
                  {languageOptions.map((lang) => (
                    <button key={lang.code} onClick={() => { setBillLanguage(lang.code); setShowLangMenu(false); }} className={cn("w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors", billLanguage === lang.code ? "bg-blue-800 text-white" : "text-white/80 hover:bg-white/10")}>
                      <span>{lang.native}</span>
                      <span className="text-[10px] uppercase tracking-wider text-white/50">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
              <X className="w-8 h-8" />
            </Button>
          </div>
          
          <div className="w-full overflow-x-auto flex flex-col items-center pb-8 pt-4">
             <div className="text-white/50 text-sm font-bold mb-4 uppercase tracking-widest flex items-center gap-2"><Printer className="w-4 h-4"/> Printable A4 Document Preview</div>
             <ReceiptLayout ref={visibleReceiptRef} loan={loan} t={t} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 no-print w-full max-w-[210mm]">
            {showConfirmButton && onConfirm ? (
              <>
                <Button className="h-16 text-xl font-black gap-2 shadow-2xl bg-rose-700 text-white hover:bg-rose-800" onClick={onConfirm}>
                  <CheckCircle2 className="w-6 h-6" /> Confirm & Save
                </Button>
                <Button variant="outline" className="h-16 text-xl font-black gap-2 border-4 border-rose-700 text-rose-700 hover:bg-rose-50 shadow-xl bg-white" onClick={onClose}>
                  <Edit2 className="w-5 h-5" /> Edit
                </Button>
                
                <Button variant="outline" className="h-16 text-xl font-black gap-3 border-4 border-rose-700 text-rose-700 hover:bg-rose-50 shadow-xl bg-white" onClick={handleDownload} disabled={isExporting}>
                  {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                  Download PDF
                </Button>

                <Button variant="outline" className="h-16 text-xl font-black gap-3 border-4 border-rose-700 text-rose-700 hover:bg-rose-50 shadow-xl bg-white" onClick={handleShareBill} disabled={isExporting}>
                   {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share2 className="w-6 h-6" />}
                   Share Receipt
                </Button>
              </>
            ) : (
              <>
                <Button className="h-16 text-xl font-black gap-3 shadow-2xl bg-rose-700 text-white hover:bg-rose-800" onClick={handlePrint}>
                  <Printer className="w-6 h-6" /> {t.printGoldLoan || "Print Loan Receipt"}
                </Button>
                
                <Button variant="outline" className="h-16 text-xl font-black gap-3 border-4 border-rose-700 text-rose-700 hover:bg-rose-50 shadow-xl bg-white" onClick={handleDownload} disabled={isExporting}>
                  {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                  Download PDF
                </Button>

                <Button variant="outline" className="h-16 text-xl font-black gap-3 border-4 border-rose-700 text-rose-700 hover:bg-rose-50 shadow-xl bg-white" onClick={handleShareBill} disabled={isExporting}>
                  {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share2 className="w-6 h-6" />}
                  Share Receipt
                </Button>

                <Button variant="outline" className="h-16 px-8 font-black text-lg border-4 bg-white hover:bg-slate-50" onClick={onClose}>
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="print-only">
        <ReceiptLayout loan={loan} t={t} />
      </div>
    </>
  )
}
