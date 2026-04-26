"use client"

import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Printer,
  Edit2,
  Loader2,
  CheckCircle2,
  Download,
  Share2,
  Globe,
  ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'
import { useGoldStore, CalculationResult, Language } from '@/lib/store'
import { translations } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { numberToWords } from '@/lib/format'

const ReceiptLayout = React.forwardRef<HTMLDivElement, { calculation: CalculationResult; t: any }>(
  ({ calculation, t }, ref) => {
    const { prices } = useGoldStore();
    const hasNewItem = calculation.weight > 0;
    const hasOldItem = calculation.oldWeight && calculation.oldWeight > 0;
    
    const ornamentValueBase = (calculation.ornamentValue || 0) + (calculation.makingCharges || 0) + (calculation.kdmCharges || 0) + (calculation.stonePrice || 0);
    const amountPaid = calculation.amountPaid || 0;
    const netAfterPaid = ornamentValueBase - amountPaid;
    const deductionsTotal = (calculation.oldItemValue || 0) + (calculation.discount || 0);
    const finalBalance = Math.round(netAfterPaid - deductionsTotal);

    const displayItemName = calculation.itemName || (hasNewItem ? t.newGold : t.oldGold);

    return (
      <div 
        ref={ref} 
        id="bill"
        className="receipt-container mx-auto bg-white border-[14px] border-blue-800 p-[10mm] flex flex-col text-slate-900 font-sans shadow-2xl relative"
        style={{ 
          width: '190mm', 
          height: '297mm', 
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        {/* Background Watermark */}
        <div className="absolute top-[42%] left-[4%] flex flex-col items-center pointer-events-none opacity-[0.15] select-none z-0 transform -rotate-[35deg]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/shiva-logo.png" alt="" width={110} height={110} className="mb-1" />
          <span className="text-[140px] font-black text-blue-800 tracking-[0.1em] leading-none">KBS</span>
        </div>

        <div className="relative z-10 flex flex-col h-full bill-header">
          {/* Header */}
          <div className="relative mb-1">
            <div className="flex justify-between items-start">
              <div className="text-[11px] font-black leading-tight text-left uppercase">
                <p className="mb-0.5 text-[#C2410C]">K. MAHESH</p>
                <p className="mb-0.5 text-black">9985881156</p>
                <p className="text-black">7396809809</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center flex-col items-center mb-0.5 scale-90">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/shiva-logo.png" alt="Shiva Shakthi" width={40} height={40} className="mb-0.5" />
                  <p className="text-[16px] font-black text-[#C2410C] tracking-[0.25em] leading-none mb-0.5">K B S</p>
                </div>
                <h1 className="text-[30px] font-headline font-black text-[#C2410C] uppercase tracking-tight leading-none mb-0.5">SHIVA SHAKTHI JEWELLERS</h1>
                <p className="text-[12px] font-black text-slate-800 uppercase tracking-[0.1em] font-sans leading-none mt-2">
                  OLD BAZAAR, ACHAMPET, DIST: NGKL, TELANGANA 509375
                </p>
              </div>

              <div className="text-[11px] font-black leading-tight text-right uppercase">
                <p className="mb-0.5 text-[#C2410C]">K. BRAHMACHARY</p>
                <p className="text-black">9985888106</p>
              </div>
            </div>
          </div>

          {/* Banner Section */}
          <div className="mt-1 mb-0 title-wrapper">
            <h2 className="bill-title">{t.cashInvoice}</h2>
          </div>

          {/* Customer & Bill Details */}
          <div className="flex justify-between items-start py-2 border-b border-slate-200">
            <div className="space-y-2">
              <p className="text-blue-800 font-black mb-1 underline uppercase underline-offset-4 decoration-2 text-[12px]">
                {t.detailsOfReceiver} :
              </p>
              <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2">
                <span className="text-slate-900 font-black uppercase text-[12px]">{t.customerName} :</span>
                <span className="font-black uppercase text-[18px] leading-none border-b border-slate-200 pb-0.5">{calculation.customerName || "WALK-IN"}</span>
                <span className="text-slate-900 font-black uppercase text-[12px]">{t.customerAddress} :</span>
                <span className="font-black uppercase text-[14px] leading-none border-b border-slate-200 pb-0.5">{calculation.customerAddress || "N/A"}</span>
                <span className="text-slate-900 font-black uppercase text-[12px]">{t.customerPhone} :</span>
                <span className="font-black text-[14px] leading-none border-b border-slate-200 pb-0.5">{calculation.customerPhone || "N/A"}</span>
              </div>
            </div>
            <div className="text-right space-y-1.5">
              <p className="font-black text-[14px] leading-none">
                <span className="text-blue-800 uppercase tracking-wider text-[11px]">BILL NO:</span> {calculation.billNumber}
              </p>
              <div className="flex flex-col items-end">
                <p className="font-black text-[14px] leading-none"><span className="text-blue-800 uppercase tracking-wider text-[11px]">{t.date}:</span> {format(new Date(calculation.timestamp), 'dd MMM yyyy')}</p>
                <p className="font-black text-[12px] text-blue-800 uppercase leading-none mt-1">{format(new Date(calculation.timestamp), 'hh:mm a')}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-6">
            <table className="w-full border-collapse border-[2px] border-slate-900 text-[11px]">
              <thead style={{ backgroundColor: '#f1f5f9' }}>
                <tr className="border-b-[2px] border-slate-900 h-9">
                  <th className="border-r-[2px] border-slate-900 p-2 text-left font-black uppercase w-[12%]">{t.prodId}</th>
                  <th className="border-r-[2px] border-slate-900 p-2 text-left font-black uppercase">{t.prodDesc}</th>
                  <th className="border-r-[2px] border-slate-900 p-2 text-center font-black uppercase w-[10%]">{t.gsWt}</th>
                  <th className="border-r-[2px] border-slate-900 p-2 text-center font-black uppercase w-[22%]">{t.ntWt}</th>
                  <th className="border-r-[2px] border-slate-900 p-2 text-center font-black uppercase w-[18%]">RATES (10G)</th>
                  <th className="p-2 text-center font-black uppercase w-[18%]">{t.finalAmt}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="align-top h-36">
                  <td className="border-r-[2px] border-slate-900 p-2">
                    <p className="font-black text-blue-800 text-[9px]">{calculation.purity === '24K' ? t.gold24k : t.silver}</p>
                  </td>
                  <td className="border-r-[2px] border-slate-900 p-2 space-y-2">
                    <div className={cn(
                      "font-black uppercase text-slate-900 tracking-wide flex flex-col gap-0.5",
                      displayItemName.length > 60 ? "text-[9px]" : 
                      displayItemName.length > 40 ? "text-[11px]" : 
                      displayItemName.length > 25 ? "text-[12px]" : "text-[14px]"
                    )}>
                      {displayItemName.split(',').map((item, idx) => (
                        <div key={idx}>{item.trim()}</div>
                      ))}
                    </div>
                    <div className="mt-1 border border-dashed border-slate-300 rounded p-2" style={{ backgroundColor: '#f8fafc' }}>
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5 tracking-widest">{t.remarks}:</p>
                      <p className="text-[10px] italic leading-relaxed text-slate-900 font-black whitespace-pre-wrap">{calculation.remarks || " "}</p>
                    </div>
                  </td>
                  <td className="border-r-[2px] border-slate-900 p-2 text-center font-black text-[14px]">{hasNewItem ? `${calculation.weight} G` : "-"}</td>
                  <td className="border-r-[2px] border-slate-900 p-2 text-center">
                    <div className="flex flex-col gap-1 items-center justify-center">
                      {calculation.oldItemName && (
                        <div className="flex flex-col gap-0.5 items-center">
                          {calculation.oldItemName.split(',').map((item, idx) => (
                            <p key={idx} className="text-[10px] uppercase leading-none font-black text-blue-800 tracking-widest">
                              {item.trim()}
                            </p>
                          ))}
                        </div>
                      )}
                      {calculation.oldWeight && <p className="text-[14px] leading-none font-black">{calculation.oldWeight} G</p>}
                      
                      {calculation.meltingLoss && calculation.meltingLoss > 0 && (
                        <div className="flex flex-col items-center p-1 rounded border border-red-100 w-full mt-1" style={{ backgroundColor: '#fef2f2' }}>
                          <p className="text-[8px] font-black text-red-600 uppercase mb-0">Loss: {calculation.meltingLoss}%</p>
                          <p className="text-[10px] font-black text-slate-800">
                             Net: {(calculation.oldWeight! - (calculation.oldWeight! * calculation.meltingLoss / 100)).toFixed(3)} G
                          </p>
                        </div>
                      )}

                      {calculation.oldItemValue && calculation.oldItemValue > 0 && (
                        <div className="mt-1 pt-1 border-t border-slate-900 w-full">
                          <p className="text-[11px] text-red-700 font-black text-center">CR: Rs {Math.round(calculation.oldItemValue).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border-r-[2px] border-slate-900 p-2 text-center font-black text-[14px]">
                    <div className="flex flex-col gap-1.5 py-1">
                      <div className="border-b border-slate-200 pb-1">
                        <span className="text-[8px] text-blue-800 block uppercase leading-none mb-0.5">Gold (24K)</span>
                        <span className="text-[13px] leading-none">Rs {Math.round((prices['24K']?.adminPrice || 0) * 10).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-500 block uppercase leading-none mb-0.5">Silver</span>
                        <span className="text-[13px] leading-none">Rs {Math.round((prices['Silver']?.adminPrice || 0) * 10).toLocaleString()}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-right font-black text-[15px] text-blue-800">Rs {hasNewItem ? Math.round(calculation.weight * calculation.rate).toLocaleString() : "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculations Breakdown */}
          <div className="flex justify-end mt-4">
            <div className="w-[390px] space-y-1.5 text-[13px] bg-white p-6 border-[2px] border-slate-900 rounded-lg shadow-lg">
              <div className="space-y-1 border-b border-slate-100 pb-2">
                <div className="flex justify-between items-center text-blue-800 font-black mb-1">
                  <span className="uppercase text-[11px] tracking-widest">Additions Subtotal (+)</span>
                  <span className="text-[13px]">Rs {Math.round(ornamentValueBase).toLocaleString()}</span>
                </div>
                {hasNewItem && (
                  <>
                    <div className="flex justify-between items-center ml-2">
                      <span className="font-black text-slate-700 uppercase text-[10px]">Ornament ({calculation.weight} G x {(calculation.rate * 10).toLocaleString()}/10G) :</span>
                      <span className="font-black text-[11px]">Rs {Math.round(calculation.weight * calculation.rate).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center ml-2">
                      <span className="font-black text-slate-700 uppercase text-[10px]">{t.makingCharges} (+) :</span>
                      <span className="font-black text-[11px]">Rs {Math.round(calculation.makingCharges || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center ml-2">
                      <span className="font-black text-slate-700 uppercase text-[10px]">{t.kdmCharges} (+) :</span>
                      <span className="font-black text-[11px]">Rs {Math.round(calculation.kdmCharges || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center ml-2">
                      <span className="font-black text-slate-700 uppercase text-[10px]">{t.stones} (+) :</span>
                      <span className="font-black text-[11px]">Rs {Math.round(calculation.stonePrice || 0).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              {calculation.amountPaid && calculation.amountPaid > 0 ? (
                <div 
                  className="space-y-1 border-b border-green-100 pb-2 p-2 rounded"
                  style={{ backgroundColor: '#F0FDF4' }}
                >
                  <div className="flex justify-between items-center text-green-700 font-black">
                    <span className="uppercase text-[11px]">{t.amountPaid} (-) :</span>
                    <span className="font-black text-[13px]">Rs {Math.round(calculation.amountPaid).toLocaleString()}</span>
                  </div>
                </div>
              ) : null}

              <div className="space-y-1 border-b border-slate-100 pb-2">
                <div className="flex justify-between items-center text-secondary font-black mb-1">
                  <span className="uppercase text-[11px] tracking-widest">Deductions Subtotal (-)</span>
                  <span className="text-[13px]">Rs {Math.round(deductionsTotal).toLocaleString()}</span>
                </div>
                {hasOldItem && calculation.oldItemValue && calculation.oldItemValue > 0 && (
                  <div className="flex justify-between items-center ml-2 text-red-700 font-black">
                    <span className="uppercase text-[10px]">Old Item ({calculation.oldWeight} G x {((calculation.oldRate || 0) * 10).toLocaleString()}/10G) (-) :</span>
                    <span className="font-black text-[11px]">Rs {Math.round(calculation.oldItemValue).toLocaleString()}</span>
                  </div>
                )}
                {calculation.discount && calculation.discount > 0 ? (
                  <div className="flex justify-between items-center ml-2 text-red-700 font-black">
                    <span className="uppercase text-[10px]">{t.discount} (-) :</span>
                    <span className="font-black text-[11px]">Rs {Math.round(calculation.discount).toLocaleString()}</span>
                  </div>
                ) : null}
              </div>

              <div 
                className="flex justify-between items-center border-t-[3px] border-blue-800 pt-2 mt-1 p-2 rounded-md"
                style={{ backgroundColor: '#eff6ff' }}
              >
                <span className="font-black text-blue-800 uppercase text-[13px] tracking-[0.1em]">{t.balance} :</span>
                <span className="font-black text-blue-800 text-[22px] tracking-tighter leading-none">
                  Rs {Math.round(finalBalance).toLocaleString()} {finalBalance < 0 ? "(CR)" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mt-2">
            <p 
              className="font-black uppercase flex items-center border-l-[6px] border-blue-800 pl-5 py-3 rounded-r"
              style={{ backgroundColor: '#eff6ff' }}
            >
              <span className="text-blue-800 text-[14px] font-[900] tracking-widest uppercase mr-4">{t.ornamentValue} :</span> 
              <span className="font-[900] text-black text-[13px] tracking-tight underline decoration-black/30 decoration-2 underline-offset-4">
                {numberToWords(Math.round(ornamentValueBase))}
              </span>
            </p>
          </div>

          {/* Footer Signatures */}
          <div className="mt-auto mb-8 pt-4 pb-4">
            <div className="flex justify-between items-end px-12">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-slate-800 tracking-[0.1em]">{t.customerSignatory}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-slate-800 tracking-[0.1em]">{t.authorizedSignatory}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReceiptLayout.displayName = 'ReceiptLayout';

export interface BillReceiptProps {
  calculation: CalculationResult;
  onClose: () => void;
  onConfirm?: () => void;
  showConfirmButton?: boolean;
}

export const BillReceipt: React.FC<BillReceiptProps> = ({ 
  calculation, 
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
      
      if (document.fonts) {
        await document.fonts.ready;
      }
      
      const html2pdf = (await import('html2pdf.js')).default;
      const element = visibleReceiptRef.current;
      
      const opt = {
        margin: 0,
        filename: `Bill_${calculation.billNumber}.pdf`,
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

      const pdfBlob = await html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then(function (pdf: any) {
          const totalPages = pdf.internal.getNumberOfPages();
          if (totalPages > 1) {
            pdf.deletePage(2);
          }
        })
        .outputPdf('blob');

      return pdfBlob;

    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Export Error",
        description: "Could not generate PDF. Please try printing instead."
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  }

  const handleDownload = async () => {
    const blob = await generatePdfBlob();
    if (!blob) return;
    
    const safeName = (calculation.customerName || 'Customer').replace(/[^a-z0-9]/gi, '_');
    const fileName = `Shiva_Shakthi_Bill_${calculation.billNumber}_${safeName}.pdf`;
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Invoice downloaded as high-quality A4 PDF."
    });
  }

  const handleShareBill = async () => {
    const blob = await generatePdfBlob();
    if (!blob) return;
    
    const safeName = (calculation.customerName || 'Customer').replace(/[^a-z0-9]/gi, '_');
    const fileName = `Bill_${calculation.billNumber}_${safeName}.pdf`;
    const file = new File([blob], fileName, { type: "application/pdf" });
    
    const customerPhoneRaw = calculation.customerPhone || '';
    const cleanPhone = customerPhoneRaw.replace(/\D/g, '');
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Shiva Shakthi Jewellers - Bill ${calculation.billNumber}`,
          text: `Here is your Jewellery Bill for ${calculation.customerName || 'Customer'}.`,
        });
        return;
      } catch (error) {
        console.error('Native sharing failed:', error);
      }
    }

    const text = `*SHIVA SHAKTHI JEWELLERS*\n*Invoice:* ${calculation.billNumber}\n*Customer:* ${calculation.customerName || 'Customer'}\n*Total:* Rs ${Math.round(calculation.finalTotal || 0).toLocaleString()}\n*Balance:* Rs ${Math.round(calculation.balance || 0).toLocaleString()}\n\nPlease find your digital invoice attached.`;
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Sharing via WhatsApp",
      description: `Sharing bill details directly to ${cleanPhone || 'customer'}.`
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-slate-950/95 animate-in fade-in duration-300 overflow-y-auto no-print flex flex-col items-center p-4 md:p-10">
        <div className="max-w-[190mm] w-full relative mb-12 flex flex-col items-center">
          {/* Top bar with language selector and close button */}
          <div className="absolute -top-12 left-0 right-0 flex items-center justify-between z-[110]">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-bold">
                  {languageOptions.find(l => l.code === billLanguage)?.native}
                </span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showLangMenu && "rotate-180")} />
              </button>
              {showLangMenu && (
                <div className="absolute top-full left-0 mt-2 w-44 bg-slate-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[120]">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setBillLanguage(lang.code)
                        setShowLangMenu(false)
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors",
                        billLanguage === lang.code
                          ? "bg-blue-800 text-white"
                          : "text-white/80 hover:bg-white/10"
                      )}
                    >
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
          
          <div className="w-full overflow-x-auto flex justify-center pb-8">
            <ReceiptLayout ref={visibleReceiptRef} calculation={calculation} t={t} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 no-print w-full max-w-[190mm]">
            {showConfirmButton && onConfirm ? (
              <>
                <Button className="h-16 text-xl font-black gap-2 shadow-2xl bg-blue-800 text-white hover:bg-blue-900" onClick={onConfirm}>
                  <CheckCircle2 className="w-6 h-6" /> {t.confirmAndSave}
                </Button>
                <Button variant="outline" className="h-16 text-xl font-black gap-2 border-4 border-blue-800 text-blue-800 hover:bg-blue-50 shadow-xl bg-white" onClick={onClose}>
                  <Edit2 className="w-5 h-5" /> {t.edit}
                </Button>
                
                <Button variant="outline" className="h-16 text-xl font-black gap-3 border-4 border-blue-800 text-blue-800 hover:bg-blue-50 shadow-xl bg-white" onClick={handleDownload} disabled={isExporting}>
                  {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                  {t.downloadInvoice}
                </Button>

                <Button variant="outline" className="h-16 text-xl font-black gap-3 border-4 border-blue-800 text-blue-800 hover:bg-blue-50 shadow-xl bg-white" onClick={handleShareBill} disabled={isExporting}>
                   {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share2 className="w-6 h-6" />}
                   {t.shareInvoice}
                </Button>
              </>
            ) : (
              <>
                <Button className="h-16 text-xl font-black gap-3 shadow-2xl bg-blue-800 text-white hover:bg-blue-900" onClick={handlePrint}>
                  <Printer className="w-6 h-6" /> {t.printInvoice}
                </Button>

                <Button variant="outline" className="h-16 text-xl font-black gap-3 border-4 border-blue-800 text-blue-800 hover:bg-blue-50 shadow-xl bg-white" onClick={handleDownload} disabled={isExporting}>
                  {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                  {t.downloadInvoice}
                </Button>

                <Button variant="outline" className="h-16 text-xl font-black gap-3 border-4 border-blue-800 text-blue-800 hover:bg-blue-50 shadow-xl bg-white" onClick={handleShareBill} disabled={isExporting}>
                  {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Share2 className="w-6 h-6" />}
                  {t.shareInvoice}
                </Button>

                <Button variant="outline" className="h-16 px-8 font-black text-lg border-4 bg-white hover:bg-slate-50" onClick={onClose}>
                  {t.cancel}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="print-only">
        <ReceiptLayout calculation={calculation} t={t} />
      </div>
    </>
  )
}
