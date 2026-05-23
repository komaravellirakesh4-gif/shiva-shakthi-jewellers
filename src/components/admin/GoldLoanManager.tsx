"use client"

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGoldStore, GoldLoanRecord } from '@/lib/store'
import { translations } from '@/lib/translations'
import { v4 as uuidv4 } from 'uuid'
import { formatIndianNumber } from '@/lib/format'
import { FileText, Banknote, Calendar as CalendarIcon, User, Phone, MapPin, Scale, Info, Sparkles } from 'lucide-react'
import { GoldLoanReceipt } from '../calculator/GoldLoanReceipt'
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { SHARED_ADMIN_ID } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'

export const GoldLoanManager = () => {
  const { language, nextGoldLoanNumber, incrementGoldLoanNumber } = useGoldStore()
  const t = translations[language]
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()

  // Real-time data subscription
  const goldLoansRef = useMemoFirebase(() => {
    return collection(db, 'users', SHARED_ADMIN_ID, 'gold_loans');
  }, [db])
  const { data: goldLoans, isLoading } = useCollection<any>(goldLoansRef)

  // Dynamic Dashboard Stats
  const stats = useMemo(() => {
    if (!goldLoans) {
      return {
        totalLoans: 0,
        todayCollection: 0,
        pendingAmount: 0,
        customers: 0
      }
    }

    const today = new Date().toISOString().split('T')[0]
    let todaySum = 0
    let totalSum = 0
    const uniqueCusts = new Set<string>()

    goldLoans.forEach(l => {
      const loanAmt = parseFloat(l.amount) || l.amount || 0
      totalSum += loanAmt
      
      // Check if created today (matching timestamp prefix)
      if (l.timestamp && l.timestamp.startsWith(today)) {
        todaySum += loanAmt
      }

      if (l.customerPhone && l.customerPhone !== 'N/A') {
        uniqueCusts.add(l.customerPhone)
      } else if (l.customerName) {
        uniqueCusts.add(l.customerName)
      }
    })

    return {
      totalLoans: goldLoans.length,
      todayCollection: todaySum,
      pendingAmount: totalSum,
      customers: uniqueCusts.size
    }
  }, [goldLoans])

  // Monthly aggregated chart data (last 6 months)
  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const counts: Record<string, number> = {}

    // Initialize last 6 months with 0
    const now = new Date()
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mLabel = months[d.getMonth()]
      last6Months.push(mLabel)
      counts[mLabel] = 0
    }

    if (goldLoans) {
      goldLoans.forEach(loan => {
        if (!loan.timestamp) return
        const date = new Date(loan.timestamp)
        if (isNaN(date.getTime())) return
        const mLabel = months[date.getMonth()]
        if (counts[mLabel] !== undefined) {
          counts[mLabel] += (loan.amount || 0)
        }
      })
    }

    return last6Months.map(m => ({
      month: m,
      amount: counts[m] || 0
    }))
  }, [goldLoans])

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
    const generatedReceiptNo = form.receiptNumber || `KBS${nextGoldLoanNumber}`
    const record: GoldLoanRecord = {
      id: uuidv4(),
      customerName: form.customerName || t.walkIn,
      customerPhone: form.customerPhone || 'N/A',
      customerAddress: form.customerAddress || 'N/A',
      receiptNumber: generatedReceiptNo,
      timestamp: new Date(`${form.date}T${new Date().toTimeString().split(' ')[0]}`).toISOString(),
      itemType: form.itemType,
      weight: parseFloat(form.weight) || 0,
      itemDetails: form.itemDetails || `${form.itemType} Ornaments`,
      relationType: form.relationType,
      relationName: form.relationName || 'N/A',
      amount: parseFloat(form.amount.replace(/,/g, '')) || 0
    }

    setSelectedLoan(record)
  }

  const handleConfirmAndSave = () => {
    if (!selectedLoan) return
    const docRef = doc(db, 'users', SHARED_ADMIN_ID, 'gold_loans', selectedLoan.id)
    setDocumentNonBlocking(docRef, selectedLoan, { merge: true })
    
    // Auto-increment the receipt number for the next time, only if they used the generated one
    if (selectedLoan.receiptNumber === `KBS${nextGoldLoanNumber}`) {
      incrementGoldLoanNumber()
    }
    
    toast({
      title: "Success",
      description: "Gold loan receipt saved to history.",
    })

    // Reset Form
    setForm({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      receiptNumber: `KBS${nextGoldLoanNumber + (selectedLoan.receiptNumber === `KBS${nextGoldLoanNumber}` ? 1 : 0)}`,
      itemType: 'Gold' as 'Gold' | 'Silver',
      weight: '',
      itemDetails: '',
      relationType: 'S/O',
      relationName: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    })
    setSelectedLoan(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-yellow-950 text-white p-2 md:p-6 rounded-3xl overflow-hidden shadow-2xl relative border border-white/5">
      {/* Background Watermark/Glowing orb */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <nav className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex justify-between items-center shadow-2xl mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 text-black w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shadow-lg shadow-yellow-500/20">
            SS
          </div>
          <div>
            <h1 className="text-xl font-headline font-black text-yellow-400 uppercase tracking-tight leading-none">
              Shiva Shakthi Jewellers
            </h1>
            <p className="text-xs text-yellow-500/70 font-bold uppercase tracking-widest mt-1">
              Gold Loan Management Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20 text-yellow-400 text-xs font-black uppercase">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Live System
        </div>
      </nav>

      {/* Dashboard Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { title: "Total Loans", value: stats.totalLoans.toString(), icon: FileText },
          { title: "Today Collection", value: `₹${stats.todayCollection.toLocaleString('en-IN')}`, icon: Sparkles },
          { title: "Outstanding Amount", value: `₹${stats.pendingAmount.toLocaleString('en-IN')}`, icon: Banknote },
          { title: "Total Pawners", value: stats.customers.toString(), icon: User },
        ].map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  {card.title}
                </h2>
                <p className="text-3xl font-black mt-3 text-yellow-400 tracking-tight">
                  {card.value}
                </p>
              </div>
              <div className="bg-yellow-500/10 p-2.5 rounded-lg border border-yellow-500/20 text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Chart */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl mb-8"
      >
        <h2 className="text-lg font-headline font-black text-yellow-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Banknote className="w-5 h-5" /> Monthly Disbursements
        </h2>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11, fontWeight: 'bold' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1c1917',
                  border: '1px solid rgba(234, 179, 8, 0.2)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontFamily: 'sans-serif'
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#eab308"
                strokeWidth={3}
                dot={{ fill: '#eab308', r: 4 }}
                activeDot={{ r: 6, fill: '#facc15' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Interactive Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl"
      >
        <h2 className="text-xl font-headline font-black text-yellow-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" /> Add New Gold Loan Record
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Customer Name */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-yellow-500" /> {t.customerName}
            </Label>
            <Input 
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder={t.enterCustomerName}
              className="h-12 bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-white font-bold uppercase transition-all duration-300"
            />
          </div>

          {/* Customer Phone */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-yellow-500" /> {t.customerPhone}
            </Label>
            <Input 
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value.replace(/\D/g, '') })}
              placeholder={t.enterCustomerPhone}
              className="h-12 bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-white font-bold tracking-widest transition-all duration-300"
              maxLength={10}
            />
          </div>

          {/* Customer Address */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-yellow-500" /> {t.customerAddress || "Address"}
            </Label>
            <Input 
              value={form.customerAddress}
              onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
              placeholder={t.enterCustomerAddress || "Enter address"}
              className="h-12 bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-white font-bold uppercase transition-all duration-300"
            />
          </div>

          {/* Relation Dropdown */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-yellow-500" /> {t.relation}
            </Label>
            <Select value={form.relationType} onValueChange={(val) => setForm({...form, relationType: val})}>
              <SelectTrigger className="h-12 bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-white font-bold">
                <SelectValue placeholder={t.selectRelation} />
              </SelectTrigger>
              <SelectContent className="bg-stone-900 border-white/10 text-white">
                <SelectItem value="S/O">S/O (Son Of)</SelectItem>
                <SelectItem value="D/O">D/O (Daughter Of)</SelectItem>
                <SelectItem value="W/O">W/O (Wife Of)</SelectItem>
                <SelectItem value="C/O">C/O (Care Of)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Relation Name */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-yellow-500" /> {t.enterRelationName}
            </Label>
            <Input 
              value={form.relationName}
              onChange={(e) => setForm({...form, relationName: e.target.value})}
              placeholder={t.enterRelationName}
              className="h-12 bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-white font-bold uppercase transition-all duration-300"
            />
          </div>

          {/* Receipt Number */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-yellow-500" /> Receipt No
            </Label>
            <Input 
              value={form.receiptNumber}
              onChange={(e) => setForm({ ...form, receiptNumber: e.target.value.toUpperCase() })}
              placeholder={`KBS${nextGoldLoanNumber}`}
              className="h-12 bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-yellow-400 font-black uppercase transition-all duration-300"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-yellow-500" /> Date
            </Label>
            <Input 
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-12 bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-white font-bold uppercase transition-all duration-300"
            />
          </div>

          {/* Item Type (Gold/Silver) */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-yellow-500" /> Item Type
            </Label>
            <Select value={form.itemType} onValueChange={(val: 'Gold'|'Silver') => setForm({...form, itemType: val})}>
              <SelectTrigger className="h-12 bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-white font-bold uppercase">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent className="bg-stone-900 border-white/10 text-white">
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-yellow-500" /> Weight (Grams)
            </Label>
            <Input 
              type="number"
              value={form.weight}
              onChange={(e) => setForm({...form, weight: e.target.value})}
              placeholder="Ex: 10.5"
              className="h-12 bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-white font-bold transition-all duration-300"
              step="0.01"
            />
          </div>

          {/* Loan Amount */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5 text-yellow-500" /> Loan Amount (₹)
            </Label>
            <Input 
              value={formatIndianNumber(form.amount)}
              onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/,/g, '') })}
              placeholder="0"
              className="h-14 bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-yellow-400 font-black text-xl transition-all duration-300"
            />
          </div>

          {/* Item Details */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-yellow-500" /> {t.itemDetails}
            </Label>
            <Textarea 
              value={form.itemDetails}
              onChange={(e) => setForm({ ...form, itemDetails: e.target.value })}
              placeholder="E.g., 2 Gold Chains, 1 Ring..."
              className="min-h-[100px] bg-black/40 border-white/10 focus:border-yellow-500/60 focus:ring-1 focus:ring-yellow-500/30 rounded-xl text-white font-bold uppercase resize-y transition-all duration-300"
            />
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <Button 
            size="lg" 
            className="h-14 px-8 font-black text-lg gap-2 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black shadow-lg shadow-yellow-500/10 transition-all duration-300"
            onClick={handleGenerateReceipt}
          >
            <FileText className="w-5 h-5 text-black" />
            Generate & Save Loan
          </Button>
        </div>
      </motion.div>

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
