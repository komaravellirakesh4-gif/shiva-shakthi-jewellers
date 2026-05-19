"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGoldStore, GoldLoanRecord } from '@/lib/store'
import { translations } from '@/lib/translations'
import { v4 as uuidv4 } from 'uuid'
import { formatIndianNumber } from '@/lib/format'
import { FileText } from 'lucide-react'
import { GoldLoanReceipt } from '../calculator/GoldLoanReceipt'
import { useFirestore, setDocumentNonBlocking } from '@/firebase'
import { doc } from 'firebase/firestore'
import { SHARED_ADMIN_ID } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'

export const GoldLoanManager = () => {
  const { language, nextGoldLoanNumber, incrementGoldLoanNumber } = useGoldStore()
  const t = translations[language]
  const db = useFirestore()
  const { toast } = useToast()

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    receiptNumber: `KBS${nextGoldLoanNumber}`,
    itemType: 'Gold' as 'Gold' | 'Silver',
    weight: '',
    itemDetails: '',
    relationType: 'S/O',
    relationName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [selectedLoan, setSelectedLoan] = useState<GoldLoanRecord | null>(null)

  const handleGenerateReceipt = () => {
    // Generate a unique ID and current timestamp
    const generatedReceiptNo = form.receiptNumber || `KBS${nextGoldLoanNumber}`
    const record: GoldLoanRecord = {
      id: uuidv4(),
      customerName: form.customerName || t.walkIn,
      customerPhone: form.customerPhone || 'N/A',
      customerAddress: form.customerAddress || 'N/A',
      receiptNumber: generatedReceiptNo,
      timestamp: new Date(`${form.date}T12:00:00`).toISOString(),
      itemType: form.itemType,
      weight: parseFloat(form.weight) || 0,
      itemDetails: form.itemDetails || `${form.itemType} Ornaments`,
      relationType: form.relationType,
      relationName: form.relationName || 'N/A',
      amount: parseFloat(form.amount.replace(/,/g, '')) || 0
    }
    
    // Auto-increment the receipt number for the next time, only if they didn't manually override it completely
    if (generatedReceiptNo === `KBS${nextGoldLoanNumber}`) {
      incrementGoldLoanNumber()
    }

    setSelectedLoan(record)
  }

  const handleConfirmAndSave = () => {
    if (!selectedLoan) return;
    const docRef = doc(db, 'users', SHARED_ADMIN_ID, 'gold_loans', selectedLoan.id);
    setDocumentNonBlocking(docRef, selectedLoan, { merge: true });
    
    toast({
      title: "Success",
      description: "Gold loan receipt saved to history.",
    });

    // Reset Form
    setForm({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      receiptNumber: `KBS${nextGoldLoanNumber}`,
      itemType: 'Gold' as 'Gold' | 'Silver',
      weight: '',
      itemDetails: '',
      relationType: 'S/O',
      relationName: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedLoan(null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Card className="border-rose-900/10 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
        <div className="h-1 bg-gradient-to-r from-rose-700 via-rose-500 to-rose-700" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-rose-700" />
            </div>
            <CardTitle className="text-xl font-black text-rose-950 uppercase tracking-tight">
              {t.goldLoan || "Gold Loan"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">{t.customerName}</Label>
              <Input 
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                placeholder={t.enterCustomerName}
                className="h-12 border-rose-100 focus-visible:ring-rose-500 font-bold uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">{t.customerPhone}</Label>
              <Input 
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value.replace(/\D/g, '') })}
                placeholder={t.enterCustomerPhone}
                className="h-12 border-rose-100 focus-visible:ring-rose-500 font-bold tracking-widest"
                maxLength={10}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">{t.customerAddress || "Address"}</Label>
              <Input 
                value={form.customerAddress}
                onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                placeholder={t.enterCustomerAddress || "Enter address"}
                className="h-12 border-rose-100 focus-visible:ring-rose-500 font-bold uppercase"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">Receipt No</Label>
              <Input 
                value={form.receiptNumber}
                onChange={(e) => setForm({ ...form, receiptNumber: e.target.value.toUpperCase() })}
                placeholder={`KBS${nextGoldLoanNumber}`}
                className="h-12 border-rose-100 focus-visible:ring-rose-500 font-bold uppercase text-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">Date</Label>
              <Input 
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="h-12 border-rose-100 focus-visible:ring-rose-500 font-bold uppercase"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">Amount (₹)</Label>
              <Input 
                value={formatIndianNumber(form.amount)}
                onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/,/g, '') })}
                placeholder="0"
                className="h-12 border-rose-100 focus-visible:ring-rose-500 font-black text-rose-700 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">{t.relation}</Label>
              <Select value={form.relationType} onValueChange={(val) => setForm({...form, relationType: val})}>
                <SelectTrigger className="h-12 border-rose-100 focus:ring-rose-500 font-bold">
                  <SelectValue placeholder={t.selectRelation} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S/O">S/O (Son Of)</SelectItem>
                  <SelectItem value="D/O">D/O (Daughter Of)</SelectItem>
                  <SelectItem value="W/O">W/O (Wife Of)</SelectItem>
                  <SelectItem value="C/O">C/O (Care Of)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">{t.enterRelationName}</Label>
              <Input 
                value={form.relationName}
                onChange={(e) => setForm({...form, relationName: e.target.value})}
                placeholder={t.enterRelationName}
                className="h-12 border-rose-100 focus-visible:ring-rose-500 font-bold uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">Item Type</Label>
              <Select value={form.itemType} onValueChange={(val: 'Gold'|'Silver') => setForm({...form, itemType: val})}>
                <SelectTrigger className="h-12 border-rose-100 focus:ring-rose-500 font-bold uppercase">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">Weight (Grams)</Label>
              <Input 
                type="number"
                value={form.weight}
                onChange={(e) => setForm({...form, weight: e.target.value})}
                placeholder="Ex: 10.5"
                className="h-12 border-rose-100 focus-visible:ring-rose-500 font-bold"
                step="0.01"
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-rose-900/70">{t.itemDetails}</Label>
              <Textarea 
                value={form.itemDetails}
                onChange={(e) => setForm({ ...form, itemDetails: e.target.value })}
                placeholder="E.g., 2 Gold Chains, 1 Ring..."
                className="min-h-[100px] border-rose-100 focus-visible:ring-rose-500 font-bold uppercase resize-y"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
             <Button 
               size="lg" 
               className="h-14 px-8 font-black text-lg gap-2 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-800 hover:to-rose-700 text-white shadow-lg shadow-rose-900/20"
               onClick={handleGenerateReceipt}
             >
               <FileText className="w-5 h-5" />
               {t.generateReceipt || "Generate Receipt"}
             </Button>
          </div>
        </CardContent>
      </Card>

      {selectedLoan && (
        <GoldLoanReceipt 
          loan={selectedLoan} 
          onClose={() => setSelectedLoan(null)} 
          onConfirm={handleConfirmAndSave}
          showConfirmButton={true}
        />
      )}
    </div>
  )
}
