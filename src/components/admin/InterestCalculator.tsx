"use client"

import React, { useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Percent,
  IndianRupee,
  Calendar as CalendarIcon,
  RotateCcw,
  TrendingUp,
  Clock,
  Banknote,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  Download
} from 'lucide-react'
import { format, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns'
import { formatIndianNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

interface InterestResult {
  principalAmount: number
  interestRate: number
  totalDays: number
  totalMonths: number
  totalYears: number
  dailyInterest: number
  monthlyInterest: number
  yearlyInterest: number
  totalInterest: number
  totalAmount: number
  fromDate: Date
  toDate: Date
}

export function InterestCalculator() {
  const [amount, setAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  // Separate display text states for the date input fields
  const [fromDateText, setFromDateText] = useState('')
  const [toDateText, setToDateText] = useState(() => {
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  })
  const [result, setResult] = useState<InterestResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const fromDateRef = useRef<HTMLInputElement>(null)
  const toDateRef = useRef<HTMLInputElement>(null)

  // Convert YYYY-MM-DD to DD-MM-YYYY for display
  const isoToDisplay = (isoDate: string) => {
    if (!isoDate) return ''
    const parts = isoDate.split('-')
    if (parts.length !== 3 || parts[0].length !== 4) return ''
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }

  // Handle typed DD-MM-YYYY input and convert to YYYY-MM-DD internally
  const handleDateTextChange = (
    value: string,
    setIso: (val: string) => void,
    setDisplay: (val: string) => void
  ) => {
    // Allow only digits and dashes
    const cleaned = value.replace(/[^0-9-]/g, '')
    
    // Auto-insert dashes after DD and MM
    let formatted = cleaned
    const digitsOnly = cleaned.replace(/-/g, '')
    if (digitsOnly.length <= 8) {
      if (digitsOnly.length > 4) {
        formatted = `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2, 4)}-${digitsOnly.slice(4)}`
      } else if (digitsOnly.length > 2) {
        formatted = `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`
      } else {
        formatted = digitsOnly
      }
    }

    // Always update display text so user sees what they type
    setDisplay(formatted)
    
    // Try to parse complete DD-MM-YYYY to YYYY-MM-DD
    const match = formatted.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (match) {
      const [, dd, mm, yyyy] = match
      const day = parseInt(dd), month = parseInt(mm), year = parseInt(yyyy)
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
        setIso(`${yyyy}-${mm}-${dd}`)
        return
      }
    }
    
    // If incomplete or invalid, clear the ISO date so validation won't pass prematurely
    setIso('')
  }

  // When date picker sets an ISO date, sync the display text
  const handlePickerChange = (
    isoValue: string,
    setIso: (val: string) => void,
    setDisplay: (val: string) => void
  ) => {
    setIso(isoValue)
    setDisplay(isoToDisplay(isoValue))
  }

  const isFormValid = useMemo(() => {
    return amount && parseFloat(amount.replace(/,/g, '')) > 0 &&
      interestRate && parseFloat(interestRate) > 0 &&
      fromDate && toDate && new Date(toDate) > new Date(fromDate)
  }, [amount, interestRate, fromDate, toDate])

  const calculateInterest = () => {
    if (!isFormValid) return

    setIsCalculating(true)

    // Animate calculation
    setTimeout(() => {
      const principal = parseFloat(amount.replace(/,/g, ''))
      const rate = parseFloat(interestRate)
      const start = new Date(fromDate)
      const end = new Date(toDate)

      const totalDays = differenceInDays(end, start)
      const totalMonths = differenceInMonths(end, start)
      const totalYears = differenceInYears(end, start)

      // Rate is per month, convert to yearly for calculation
      const monthlyRate = rate
      const yearlyRate = monthlyRate * 12
      // Simple Interest: (P × R × T) / 100, where R is yearly rate
      const timeInYears = totalDays / 365
      const totalInterest = (principal * yearlyRate * timeInYears) / 100
      const dailyInterest = totalDays > 0 ? totalInterest / totalDays : 0
      const monthlyInterest = (principal * monthlyRate) / 100
      const yearlyInterest = (principal * yearlyRate) / 100

      setResult({
        principalAmount: principal,
        interestRate: rate,
        totalDays,
        totalMonths,
        totalYears,
        dailyInterest,
        monthlyInterest,
        yearlyInterest,
        totalInterest,
        totalAmount: principal + totalInterest,
        fromDate: start,
        toDate: end
      })

      setIsCalculating(false)
    }, 600)
  }

  const handleReset = () => {
    setAmount('')
    setInterestRate('')
    setFromDate('')
    setToDate('')
    setFromDateText('')
    setToDateText('')
    setResult(null)
  }

  const handleExport = () => {
    if (!result) return
    const rows = [
      ["SHIVA SHAKTHI JEWELLERS - INTEREST CALCULATION REPORT"],
      [],
      ["Generated On", format(new Date(), 'dd MMM yyyy, hh:mm a')],
      [],
      ["DETAILS", "VALUE"],
      ["Principal Amount", `Rs. ${Math.round(result.principalAmount).toLocaleString('en-IN')}`],
      ["Interest Rate", `${result.interestRate}% per month`],
      ["From Date", format(result.fromDate, 'dd MMM yyyy')],
      ["To Date", format(result.toDate, 'dd MMM yyyy')],
      ["Duration (Days)", result.totalDays.toString()],
      ["Duration (Months)", result.totalMonths.toString()],
      [],
      ["INTEREST BREAKDOWN", ""],
      ["Daily Interest", `Rs. ${result.dailyInterest.toFixed(2)}`],
      ["Monthly Interest", `Rs. ${Math.round(result.monthlyInterest).toLocaleString('en-IN')}`],
      ["Yearly Interest", `Rs. ${Math.round(result.yearlyInterest).toLocaleString('en-IN')}`],
      ["Total Interest", `Rs. ${Math.round(result.totalInterest).toLocaleString('en-IN')}`],
      [],
      ["TOTAL PAYABLE", `Rs. ${Math.round(result.totalAmount).toLocaleString('en-IN')}`],
    ]
    const csvContent = "\uFEFF" + rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `Interest_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="gold-gradient w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
          <Percent className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight text-foreground">
            Interest Calculator
          </h1>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            Calculate simple interest on principal amount
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <Card className="border-primary/10 shadow-lg overflow-hidden">
          <div className="h-1 gold-gradient" />
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Banknote className="w-4 h-4 text-primary" />
              Enter Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <IndianRupee className="w-3 h-3 text-primary" />
                Principal Amount (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">₹</span>
                <Input
                  type="text"
                  value={formatIndianNumber(amount)}
                  onChange={(e) => setAmount(e.target.value.replace(/,/g, ''))}
                  placeholder="Enter amount"
                  className="pl-8 h-12 text-base font-bold border-primary/15 focus:border-primary bg-muted/30"
                />
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Percent className="w-3 h-3 text-primary" />
                Interest Rate (% per month)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="e.g. 1, 1.5, 2"
                  className="h-12 text-base font-bold border-primary/15 focus:border-primary bg-muted/30 pr-10"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">%</span>
              </div>
            </div>

            {/* Dates Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="w-3 h-3 text-primary" />
                  From Date
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={fromDateText}
                    onChange={(e) => handleDateTextChange(e.target.value, setFromDate, setFromDateText)}
                    placeholder="DD-MM-YYYY"
                    className="h-12 font-bold border-primary/15 focus:border-primary bg-muted/30 text-sm pr-10"
                  />
                  <input
                    ref={fromDateRef}
                    type="date"
                    value={fromDate}
                    onChange={(e) => handlePickerChange(e.target.value, setFromDate, setFromDateText)}
                    className="sr-only"
                    tabIndex={-1}
                  />
                  <button
                    type="button"
                    onClick={() => fromDateRef.current?.showPicker?.()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <CalendarIcon className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="w-3 h-3 text-primary" />
                  To Date
                </Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={toDateText}
                    onChange={(e) => handleDateTextChange(e.target.value, setToDate, setToDateText)}
                    placeholder="DD-MM-YYYY"
                    className="h-12 font-bold border-primary/15 focus:border-primary bg-muted/30 text-sm pr-10"
                  />
                  <input
                    ref={toDateRef}
                    type="date"
                    value={toDate}
                    onChange={(e) => handlePickerChange(e.target.value, setToDate, setToDateText)}
                    min={fromDate}
                    className="sr-only"
                    tabIndex={-1}
                  />
                  <button
                    type="button"
                    onClick={() => toDateRef.current?.showPicker?.()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <CalendarIcon className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>
            </div>

            {/* Duration Preview */}
            {fromDate && toDate && new Date(toDate) > new Date(fromDate) && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10 animate-fade-in">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-bold text-primary">
                  Duration: {formatDuration(differenceInDays(new Date(toDate), new Date(fromDate)))}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  ({differenceInDays(new Date(toDate), new Date(fromDate))} days)
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={calculateInterest}
                disabled={!isFormValid || isCalculating}
                className="flex-1 h-12 gold-gradient text-white font-bold text-sm uppercase tracking-wider gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50"
              >
                {isCalculating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Calculate Interest
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="h-12 px-4 border-primary/15 hover:bg-primary/5 font-bold"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result Card */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Main Result */}
              <Card className="border-primary/10 shadow-lg overflow-hidden animate-slide-up">
                <div className="h-1 gold-gradient" />
                <CardContent className="p-0">
                  {/* Total Interest Highlight */}
                  <div className="gold-gradient p-6 text-center">
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Interest Amount</p>
                    <p className="text-white text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: 'Arial, sans-serif' }}>
                      ₹{Math.round(result.totalInterest).toLocaleString('en-IN')}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-white/60 text-xs font-medium">
                        {format(result.fromDate, 'dd MMM yyyy')}
                      </span>
                      <ArrowRight className="w-3 h-3 text-white/60" />
                      <span className="text-white/60 text-xs font-medium">
                        {format(result.toDate, 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Principal Amount</span>
                      <span className="text-sm font-bold text-foreground">₹{Math.round(result.principalAmount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interest Rate</span>
                      <span className="text-sm font-bold text-foreground">{result.interestRate}% / month</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</span>
                      <span className="text-sm font-bold text-foreground">{formatDuration(result.totalDays)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Daily Interest</span>
                      <span className="text-sm font-bold text-green-600">₹{result.dailyInterest.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Interest</span>
                      <span className="text-sm font-bold text-blue-600">₹{Math.round(result.monthlyInterest).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 border-b border-border/50">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Yearly Interest</span>
                      <span className="text-sm font-bold text-orange-600">₹{Math.round(result.yearlyInterest).toLocaleString('en-IN')}</span>
                    </div>

                    {/* Total Payable */}
                    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-primary/5 border border-primary/15 mt-2">
                      <span className="text-xs font-black text-primary uppercase tracking-wider">Total Payable</span>
                      <span className="text-lg font-black text-primary" style={{ fontFamily: 'Arial, sans-serif' }}>
                        ₹{Math.round(result.totalAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                variant="outline"
                className="w-full h-11 gap-2 font-bold text-[10px] uppercase tracking-widest text-green-700 border-green-200 hover:bg-green-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Report to CSV
              </Button>
            </>
          ) : (
            /* Empty State */
            <Card className="border-primary/10 shadow-sm overflow-hidden h-full min-h-[400px] flex items-center justify-center">
              <div className="h-1 gold-gradient absolute top-0 left-0 right-0" />
              <CardContent className="text-center space-y-4 p-8">
                <div className="w-20 h-20 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto">
                  <Percent className="w-8 h-8 text-primary/30" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Interest Result</h3>
                  <p className="text-xs text-muted-foreground max-w-[240px] mx-auto leading-relaxed">
                    Enter the principal amount, interest rate and date range, then click calculate to see the interest breakdown.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">
                  <span>Amount</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>Rate</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>Dates</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>Result</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
