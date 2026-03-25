"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { useGoldStore, Purity, CalculationResult } from '@/lib/store'
import { translations } from '@/lib/translations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calculator, 
  Printer, 
  RotateCcw, 
  Hash,
  Sparkles,
  ChevronDown,
  ChevronUp,
  List,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase'
import { doc } from 'firebase/firestore'
import { BillReceipt } from './BillReceipt'
import { SHARED_ADMIN_ID, GOLD_CATEGORIES, SILVER_CATEGORIES, ALL_ITEMS } from '@/lib/constants'
import { formatIndianNumber } from '@/lib/format'



export const GoldCalculator = () => {
  const { language, nextBillNumber, incrementBillNumber } = useGoldStore()
  const t = translations[language]
  const db = useFirestore()
  
  const [mounted, setMounted] = useState(false)
  const [goldMode, setGoldMode] = useState<'new' | 'old' | 'exchange'>('new')
  const [isBillOpen, setIsBillOpen] = useState(false)
  const [showNewSuggestions, setShowNewSuggestions] = useState(false)
  const [showOldSuggestions, setShowOldSuggestions] = useState(false)

  const [billNumber, setBillNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [remarks, setRemarks] = useState('')

  const [weightStr, setWeightStr] = useState('')
  const [rateStr, setRateStr] = useState('')
  const [makingValueStr, setMakingValueStr] = useState('')
  const [kdmPercentStr, setKdmPercentStr] = useState('')
  const [stonePriceStr, setStonePriceStr] = useState('')
  const [discountStr, setDiscountStr] = useState('')
  const [amountPaidStr, setAmountPaidStr] = useState('')
  const [oldWeightStr, setOldWeightStr] = useState('')
  const [oldRateStr, setOldRateStr] = useState('')
  const [meltingLossStr, setMeltingLossStr] = useState('')

  const [purity, setPurity] = useState<Purity>('24K')
  const [itemName, setItemName] = useState<string>('')
  const [oldPurity, setOldPurity] = useState<Purity>('24K')
  const [oldItemName, setOldItemName] = useState<string>('')

  const [newItemHints, setNewItemHints] = useState<string[]>([])
  const [oldItemHints, setOldItemHints] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
    setBillNumber(`KBS-${nextBillNumber}`)
  }, [nextBillNumber])

  const priceDocRef = useMemoFirebase(() => doc(db, 'gold_prices', 'current'), [db])
  const { data: dbPrices } = useDoc(priceDocRef)
  
  const activePrices = useMemo(() => {
    if (!dbPrices) return { '24K': 0, 'Silver': 0 }
    return { '24K': dbPrices.adminPrice24k ?? 0, 'Silver': dbPrices.adminPriceSilver ?? 0 }
  }, [dbPrices])

  useEffect(() => {
    if (dbPrices) {
      if (!rateStr) setRateStr(activePrices[purity].toString())
      if (!oldRateStr) setOldRateStr(activePrices[oldPurity].toString())
    }
  }, [dbPrices, activePrices, purity, oldPurity])

  const results = useMemo(() => {
    const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0
    const activeRate = parse(rateStr)
    const oldRate = parse(oldRateStr) || activePrices[oldPurity] || 0
    
    const weight = parseFloat(weightStr) || 0
    const makingTotal = parse(makingValueStr)
    const kdmTotal = purity === 'Silver' ? 0 : (weight * (parseFloat(kdmPercentStr) || 0) / 100) * activeRate
    const stoneCharges = parse(stonePriceStr)
    
    const ornamentValue = weight * activeRate
    const grossAdditions = ornamentValue + makingTotal + kdmTotal + stoneCharges

    const amountPaid = parse(amountPaidStr)
    const netAfterPaid = grossAdditions - amountPaid

    const oldWeight = parseFloat(oldWeightStr) || 0
    const meltingLossPercent = parseFloat(meltingLossStr) || 0
    const lossGrams = (oldWeight * meltingLossPercent) / 100
    const pureWeight = oldWeight - lossGrams
    const oldItemCredit = pureWeight * oldRate
    const discountAmount = parse(discountStr)
    const grossDeductions = oldItemCredit + discountAmount

    const balance = netAfterPaid - grossDeductions
    const finalTotal = grossAdditions - grossDeductions

    return { 
      ornamentValue,
      makingCharges: makingTotal, kdmCharges: kdmTotal, stonePrice: stoneCharges,
      oldItemValue: oldItemCredit, discount: discountAmount, finalTotal, 
      rate: activeRate, oldRate, weight, oldWeight, amountPaid, balance, 
      meltingLoss: meltingLossPercent, pureWeight, grossAdditions, grossDeductions,
      netAfterPaid
    }
  }, [weightStr, rateStr, oldWeightStr, oldRateStr, purity, oldPurity, makingValueStr, kdmPercentStr, meltingLossStr, stonePriceStr, discountStr, amountPaidStr, activePrices, goldMode])

  const currentCalcForBill: CalculationResult = useMemo(() => ({
    id: 'preview',
    billNumber: billNumber.toUpperCase(),
    timestamp: new Date().toISOString(),
    weight: results.weight,
    purity,
    itemName: itemName.toUpperCase(),
    rate: results.rate,
    ornamentValue: results.ornamentValue,
    makingCharges: results.makingCharges,
    kdmCharges: results.kdmCharges,
    stonePrice: results.stonePrice,
    discount: results.discount,
    amountPaid: results.amountPaid,
    balance: results.balance,
    finalTotal: results.finalTotal,
    customerName: customerName.toUpperCase(),
    customerPhone: customerPhone.toUpperCase(),
    customerAddress: customerAddress.toUpperCase(),
    remarks: remarks.toUpperCase(),
    oldWeight: results.oldWeight,
    oldItemName: oldItemName.toUpperCase(),
    oldItemValue: results.oldItemValue,
    oldRate: results.oldRate,
    meltingLoss: results.meltingLoss,
    wastageGrams: purity === 'Silver' ? 0 : results.weight * (parseFloat(kdmPercentStr) || 0) / 100,
    wastageCost: 0,
    gstAmount: 0
  }), [billNumber, results, purity, itemName, customerName, customerPhone, customerAddress, remarks, oldItemName, kdmPercentStr]);

  const handleReset = () => {
    setWeightStr(''); setOldWeightStr(''); setItemName(''); setOldItemName(''); 
    setMakingValueStr(''); setKdmPercentStr(''); setMeltingLossStr(''); setStonePriceStr(''); setDiscountStr(''); 
    setAmountPaidStr(''); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setRemarks(''); 
    setIsBillOpen(false); setBillNumber(`KBS-${nextBillNumber}`);
    setNewItemHints([]); setOldItemHints([]);
    if (activePrices[purity]) setRateStr(activePrices[purity].toString());
    if (activePrices[oldPurity]) setOldRateStr(activePrices[oldPurity].toString());
  }

  const handleFinalPrint = () => {
    const calcId = Math.random().toString(36).substring(7);
    const calculationData: CalculationResult = {
      ...currentCalcForBill,
      id: calcId
    };
    const docRef = doc(db, 'users', SHARED_ADMIN_ID, 'calculations', calcId);
    setDocumentNonBlocking(docRef, calculationData, { merge: true });
    incrementBillNumber(); handleReset();
  }

  const handleQuickAdd = (item: string, type: 'new' | 'old') => {
    const upperItem = item.toUpperCase();
    if (type === 'new') {
      setItemName(prev => prev.trim() ? `${prev.trim()}, ${upperItem}` : upperItem);
      setNewItemHints([]); setShowNewSuggestions(false);
    } else {
      setOldItemName(prev => prev.trim() ? `${prev.trim()}, ${upperItem}` : upperItem);
      setOldItemHints([]); setShowOldSuggestions(false);
    }
  }

  const handleInputChange = (val: string, type: 'new' | 'old') => {
    const upperVal = val.toUpperCase();
    if (type === 'new') {
      setItemName(upperVal);
      if (upperVal.length > 1) {
        const words = upperVal.split(/,\s*/);
        const matches = ALL_ITEMS.filter(item => item.toUpperCase().includes(words[words.length-1])).slice(0, 5);
        setNewItemHints(matches);
      } else { setNewItemHints([]); }
    } else {
      setOldItemName(upperVal);
      if (upperVal.length > 1) {
        const words = upperVal.split(/,\s*/);
        const matches = ALL_ITEMS.filter(item => item.toUpperCase().includes(words[words.length-1])).slice(0, 5);
        setOldItemHints(matches);
      } else { setOldItemHints([]); }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-7xl mx-auto p-2 md:p-8">
      <Card className="border-accent/20 shadow-xl no-print overflow-hidden flex flex-col bg-card">
        <Tabs value={goldMode} onValueChange={(v: any) => setGoldMode(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none h-12 md:h-14 bg-muted/30 p-1">
            <TabsTrigger value="new" className="font-bold h-full text-[10px] md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{t.newGold}</TabsTrigger>
            <TabsTrigger value="old" className="font-bold h-full text-[10px] md:text-sm data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">{t.oldGold}</TabsTrigger>
            <TabsTrigger value="exchange" className="font-bold h-full text-[10px] md:text-sm data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">{t.exchange}</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <CardHeader className="bg-primary/5 py-3 md:py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline text-lg md:text-2xl flex items-center gap-2">
              <Calculator className="w-5 h-5 md:w-6 md:h-6 text-primary" /> {goldMode === 'exchange' ? t.exchange : (goldMode === 'new' ? t.calculator : t.buyingValue)}
            </CardTitle>
            <div className="flex items-center gap-1 md:gap-2 bg-background/80 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-primary/20">
              <Hash className="w-3 h-3 md:w-4 md:h-4 text-primary" />
              <Input value={billNumber} onChange={(e) => setBillNumber(e.target.value.toUpperCase())} className="h-6 md:h-8 w-20 md:w-28 border-none bg-transparent font-black text-primary p-0 text-xs md:text-sm focus-visible:ring-0" />
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn(
          "space-y-4 md:space-y-6 pt-4 md:pt-6 flex-1 overflow-y-auto max-h-[70vh] md:max-h-[800px] transition-colors duration-500",
          goldMode === 'new' ? "bg-amber-100/70" : goldMode === 'old' ? "bg-orange-100/70" : "bg-slate-200/50"
        )}>
          {(goldMode === 'new' || goldMode === 'exchange') && (
            <div className="space-y-4">
              <div className="space-y-2 relative">
                <Label className="font-black text-primary uppercase text-[10px] tracking-widest flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t.newOrnamentDetails}</Label>
                <div className="relative group">
                  <Input value={itemName} onChange={(e) => handleInputChange(e.target.value, 'new')} placeholder={t.enterItemDetails} className="h-10 md:h-12 border-primary/20 focus:border-primary bg-background/50 pr-10 text-sm" />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                </div>
                {newItemHints.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                    {newItemHints.map((hint, idx) => (
                      <Button key={idx} variant="secondary" size="sm" className="h-7 text-[9px] md:text-[10px] font-black uppercase" onClick={() => handleQuickAdd(hint, 'new')}>{hint}</Button>
                    ))}
                  </div>
                )}
                <Button variant="default" size="sm" className="h-7 text-[10px] font-black uppercase gap-1" onClick={() => setShowNewSuggestions(!showNewSuggestions)}>
                  <List className="w-3 h-3" /> {t.selectItemName} {showNewSuggestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
                {showNewSuggestions && (
                  <div className="space-y-3 mt-4 bg-background/40 p-3 rounded-lg border border-primary/10">
                    {(purity === '24K' ? GOLD_CATEGORIES : SILVER_CATEGORIES).map((cat, i) => (
                      <div key={i} className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase text-primary/70">{cat.title}</p>
                        <div className="flex flex-wrap gap-1">
                          {cat.items.map((item, j) => (
                            <Button key={j} variant="outline" size="sm" className="text-[10px] h-7" onClick={() => { handleQuickAdd(item, 'new'); setShowNewSuggestions(false); }}>{item}</Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-xs font-bold">{t.weight}</Label><Input type="text" inputMode="decimal" value={weightStr} onChange={(e) => setWeightStr(e.target.value)} placeholder="0.00" className="h-10 md:h-12 text-sm" /></div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{t.itemType}</Label>
                  <Select value={purity} onValueChange={(val: Purity) => { setPurity(val); setRateStr(activePrices[val].toString()); }}>
                    <SelectTrigger className={cn(
                      "h-10 md:h-12 font-black transition-all duration-300 text-xs md:text-sm",
                      purity === '24K' 
                        ? "bg-amber-200 text-black border-amber-300 shadow-md" 
                        : "bg-slate-200 text-black border-slate-300 shadow-md"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent><SelectItem value="24K">★ {t.gold24k}</SelectItem><SelectItem value="Silver">⚪ {t.silver}</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-xs font-bold">{t.rate}</Label><Input type="text" inputMode="decimal" value={formatIndianNumber(rateStr)} onChange={(e) => setRateStr(e.target.value.replace(/,/g, ''))} className="h-10 md:h-12 font-bold text-primary text-sm" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold">{t.makingCharges}</Label><Input type="text" inputMode="decimal" value={formatIndianNumber(makingValueStr)} onChange={(e) => setMakingValueStr(e.target.value.replace(/,/g, ''))} className="h-10 md:h-12 text-sm" /></div>
              </div>
              {purity !== 'Silver' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{t.kdmCharges} (%)</Label>
                    <Input type="text" inputMode="decimal" value={kdmPercentStr} onChange={(e) => setKdmPercentStr(e.target.value)} placeholder="0.00 %" className="h-10 md:h-12 text-sm" />
                  </div>
                </div>
              )}
            </div>
          )}

          {(goldMode === 'old' || goldMode === 'exchange') && (
            <div className="space-y-4 pt-6 border-t border-dashed border-secondary/40 bg-secondary/5 -mx-6 px-6">
              <div className="space-y-2 relative">
                <Label className="font-black text-secondary uppercase text-[10px] tracking-widest flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t.oldOrnamentDetails}</Label>
                <div className="relative group">
                  <Input value={oldItemName} onChange={(e) => handleInputChange(e.target.value, 'old')} placeholder={t.enterItemDetails} className="h-10 md:h-12 border-secondary/20 focus:border-secondary bg-background/50 pr-10 text-sm" />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/30" />
                </div>
                {oldItemHints.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-secondary/5 rounded-lg border border-secondary/10">
                    {oldItemHints.map((hint, idx) => (
                      <Button key={idx} variant="secondary" size="sm" className="h-7 text-[9px] md:text-[10px] font-black uppercase" onClick={() => handleQuickAdd(hint, 'old')}>{hint}</Button>
                    ))}
                  </div>
                )}
                <Button variant="secondary" size="sm" className="h-7 text-[10px] font-black uppercase gap-1" onClick={() => setShowOldSuggestions(!showOldSuggestions)}>
                  <List className="w-3 h-3" /> {t.selectItemName} {showOldSuggestions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
                {showOldSuggestions && (
                  <div className="space-y-3 mt-4 bg-background/40 p-3 rounded-lg border border-secondary/10">
                    {(oldPurity === '24K' ? GOLD_CATEGORIES : SILVER_CATEGORIES).map((cat, i) => (
                      <div key={i} className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase text-secondary/70">{cat.title}</p>
                        <div className="flex flex-wrap gap-1">
                          {cat.items.map((item, j) => (
                            <Button key={j} variant="outline" size="sm" className="text-[10px] h-7" onClick={() => { handleQuickAdd(item, 'old'); setShowOldSuggestions(false); }}>{item}</Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-xs font-bold">{t.weight}</Label><Input type="text" inputMode="decimal" value={oldWeightStr} onChange={(e) => setOldWeightStr(e.target.value)} placeholder="0.00" className="h-10 md:h-12 text-sm" /></div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{t.itemType}</Label>
                  <Select value={oldPurity} onValueChange={(val: Purity) => { setOldPurity(val); setOldRateStr(activePrices[val].toString()); }}>
                    <SelectTrigger className={cn(
                      "h-10 md:h-12 font-black transition-all duration-300 text-xs md:text-sm",
                      oldPurity === '24K' 
                        ? "bg-amber-200 text-black border-amber-300 shadow-md" 
                        : "bg-slate-200 text-black border-slate-300 shadow-md"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent><SelectItem value="24K">★ {t.gold24k}</SelectItem><SelectItem value="Silver">⚪ {t.silver}</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-xs font-bold">{t.rate}</Label><Input type="text" inputMode="decimal" value={formatIndianNumber(oldRateStr)} onChange={(e) => setOldRateStr(e.target.value.replace(/,/g, ''))} className="h-10 md:h-12 font-bold text-secondary text-sm" /></div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold">{t.meltingLoss}</Label>
                  <Input type="text" inputMode="decimal" value={meltingLossStr} onChange={(e) => setMeltingLossStr(e.target.value)} placeholder="0.00" className="h-10 md:h-12 text-sm" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-6 border-t border-dashed border-primary/20">
            {goldMode !== 'old' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-xs font-bold">{t.stones}</Label><Input type="text" inputMode="decimal" value={formatIndianNumber(stonePriceStr)} onChange={(e) => setStonePriceStr(e.target.value.replace(/,/g, ''))} className="h-10 md:h-12 text-sm" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold">{t.discount}</Label><Input type="text" inputMode="decimal" value={formatIndianNumber(discountStr)} onChange={(e) => setDiscountStr(e.target.value.replace(/,/g, ''))} className="h-10 md:h-12 text-sm" /></div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-bold">{t.amountPaid}</Label>
              <Input type="text" inputMode="decimal" value={formatIndianNumber(amountPaidStr)} onChange={(e) => setAmountPaidStr(e.target.value.replace(/,/g, ''))} className="h-10 md:h-12 font-bold text-green-700 border-green-200 focus:border-green-500 bg-background/50 text-sm" />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-dashed border-primary/20">
            <Label className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">{t.customerDetails}</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value.toUpperCase())} placeholder={t.enterCustomerName} className="h-10 md:h-12 uppercase font-bold text-sm" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.toUpperCase())} placeholder={t.enterCustomerPhone} className="h-10 md:h-12 text-sm" />
              <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value.toUpperCase())} placeholder={t.enterCustomerAddress} className="h-10 md:h-12 text-sm" />
            </div>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value.toUpperCase())} placeholder={t.writeRemarks} className="min-h-[80px] uppercase text-xs" />
          </div>

          <div className="flex gap-3 pt-6 sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 border-t mt-auto">
            <Button variant="outline" className="flex-1 h-12 md:h-14 font-bold text-xs md:text-sm" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" /> {t.reset}</Button>
            <Button className="flex-1 h-12 md:h-14 text-sm md:text-lg font-headline font-black shadow-lg shadow-primary/30" onClick={() => setIsBillOpen(true)}><Printer className="w-5 h-5 mr-2" /> {t.printInvoice}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary border-2 shadow-2xl flex flex-col h-fit lg:sticky lg:top-24 overflow-hidden">
        <CardHeader className={cn("text-primary-foreground text-center py-4 md:py-6", goldMode === 'new' ? "bg-primary" : (goldMode === 'old' ? "bg-secondary" : "bg-accent"))}>
          <div className="font-headline text-lg md:text-xl tracking-[0.2em] font-black uppercase">{t.priceBreakdown}</div>
        </CardHeader>
        <CardContent className="p-4 md:p-8 space-y-6 bg-background">
          <div className="space-y-4">
            <div className="space-y-3 bg-primary/5 p-4 rounded-lg border border-primary/10">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Additions Summary (+)</p>
              <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                <span className="text-muted-foreground truncate max-w-[150px]">New Item ({results.weight} G)</span>
                <span className="font-black">Rs {results.ornamentValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                <span className="text-muted-foreground">{t.makingCharges} (+)</span>
                <span>Rs {Math.round(results.makingCharges).toLocaleString()}</span>
              </div>
              {purity !== 'Silver' && (
                <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                  <span className="text-muted-foreground">{t.kdmCharges} (+)</span>
                  <span>Rs {Math.round(results.kdmCharges).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                <span className="text-muted-foreground">{t.stones} (+)</span>
                <span>Rs {results.stonePrice.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-xs md:text-sm font-black text-primary">
                <span>NEW ITEM TOTAL</span>
                <span>Rs {Math.round(results.grossAdditions).toLocaleString()}</span>
              </div>
            </div>
            
            {results.amountPaid > 0 && (
              <div className="space-y-2 bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex justify-between items-center text-xs md:text-sm font-black text-green-700">
                  <span className="uppercase text-[10px]">Amount Paid (-)</span>
                  <span>Rs {results.amountPaid.toLocaleString()}</span>
                </div>
                <Separator className="bg-green-200" />
                <div className="flex justify-between items-center text-xs md:text-sm font-black text-slate-700">
                  <span>REMAINING</span>
                  <span>Rs {Math.round(results.netAfterPaid).toLocaleString()}</span>
                </div>
              </div>
            )}

            {(results.oldWeight > 0 || results.discount > 0) && (
              <div className="space-y-3 bg-secondary/5 p-4 rounded-lg border border-secondary/10">
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Deductions Summary (-)</p>
                {results.oldWeight > 0 && (
                  <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                    <span className="text-muted-foreground truncate max-w-[150px]">Old Item ({results.oldWeight} G)</span>
                    <span className="font-black">Rs {results.oldItemValue.toLocaleString()}</span>
                  </div>
                )}
                {results.discount > 0 && (
                  <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                    <span className="text-muted-foreground">{t.discount} (-)</span>
                    <span className="font-black text-red-600">Rs {results.discount.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-xs md:text-sm font-black text-secondary">
                  <span>DEDUCTIONS TOTAL</span>
                  <span>Rs {Math.round(results.grossDeductions).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center font-black text-xl md:text-2xl tracking-tighter pt-4 border-t-2 border-slate-100">
              <span className="text-slate-600 text-sm md:text-lg uppercase tracking-widest">GRAND TOTAL</span>
              <span className="text-primary">Rs {Math.round(results.finalTotal).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-auto p-6 md:p-8 rounded-2xl border-4 border-primary/20 bg-primary/5 text-center space-y-2">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black">{t.balance}</div>
            <div className="text-3xl md:text-5xl font-black text-primary tracking-tighter">Rs {Math.round(results.balance).toLocaleString()} {results.balance < 0 ? "(CR)" : ""}</div>
          </div>
        </CardContent>
      </Card>

      {isBillOpen && <BillReceipt calculation={currentCalcForBill} onClose={() => setIsBillOpen(false)} onConfirm={handleFinalPrint} showConfirmButton={true} />}
    </div>
  )
}
