"use client"

import React, { useState, useEffect } from 'react'
import { useGoldStore } from '@/lib/store'
import { translations } from '@/lib/translations'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RefreshCw, Save, TrendingUp, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase'
import { doc } from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { formatIndianNumber } from '@/lib/format'



export const PriceManager = () => {
  const { updatePrice, language } = useGoldStore()
  const t = translations[language]
  const { toast } = useToast()
  const db = useFirestore()
  const { isUserLoading } = useUser()
  
  const [gold24kStr, setGold24kStr] = useState('')
  const [silverStr, setSilverStr] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const priceDocRef = useMemoFirebase(() => doc(db, 'gold_prices', 'current'), [db])
  const { data: dbPrices, isLoading: isPricesLoading } = useDoc(priceDocRef)

  useEffect(() => {
    if (dbPrices) {
      // Store standardizes on per-gram, but we show per 10 grams in Admin UI
      setGold24kStr(((dbPrices.adminPrice24k ?? 0) * 10).toString())
      setSilverStr(((dbPrices.adminPriceSilver ?? 0) * 10).toString())
    }
  }, [dbPrices])

  if (isUserLoading || isPricesLoading) {
    return (
      <Card className="border-accent/20">
        <CardContent className="pt-12 pb-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-2">{t.syncingPrices}</p>
        </CardContent>
      </Card>
    )
  }

  const handleSaveAll = async () => {
    const goldPrice10g = parseFloat(gold24kStr.replace(/,/g, '')) || 0
    const silverPrice10g = parseFloat(silverStr.replace(/,/g, '')) || 0
    
    // Convert back to per-gram for storage and store consistency
    const goldPricePerGram = goldPrice10g / 10
    const silverPricePerGram = silverPrice10g / 10

    setIsUpdating(true)
    try {
      const timestamp = new Date().toISOString()
      const goldPriceData = { id: 'current', adminPrice24k: goldPricePerGram, adminPriceSilver: silverPricePerGram, lastUpdated: timestamp }
      setDocumentNonBlocking(priceDocRef, goldPriceData, { merge: true })
      
      updatePrice('24K', goldPricePerGram, goldPricePerGram)
      updatePrice('Silver', silverPricePerGram, silverPricePerGram)
      
      toast({ title: "Prices Updated", description: "The new rates (per 10g) are now live for all users." })
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not sync prices to database." })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className={cn(
      "border-primary shadow-2xl transition-all duration-700 animate-gold-shine",
      "border-2"
    )}>
      <CardHeader className="bg-primary/5">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-secondary" />
              {t.priceManagement}
            </CardTitle>
            <CardDescription className="animate-gold-text-shine font-black">{t.perGramFixed}</CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={() => {
            if (dbPrices) {
              setGold24kStr(((dbPrices.adminPrice24k ?? 0) * 10).toString())
              setSilverStr(((dbPrices.adminPriceSilver ?? 0) * 10).toString())
            }
          }} title={t.reset}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end border-b border-border pb-6">
          <div className="space-y-1">
            <h4 className="text-2xl font-[900] text-primary tracking-tight">{t.gold24k}</h4>
            <p className="text-xs text-muted-foreground">{t.perGram}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold tracking-wider text-secondary flex items-center gap-1 animate-gold-text-shine">
              Rs {t.perGramFixed}
            </Label>
            <Input 
              type="text" 
              inputMode="decimal" 
              value={formatIndianNumber(gold24kStr)} 
              onChange={(e) => setGold24kStr(e.target.value.replace(/,/g, ''))} 
              className="font-mono text-lg font-bold border-secondary/30 focus:border-secondary h-12 animate-gold-shine" 
              placeholder="0.00" 
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-1">
            <h4 className="text-2xl font-[900] text-zinc-600 tracking-tight">{t.silver}</h4>
            <p className="text-xs text-muted-foreground">{t.perGram}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold tracking-wider text-secondary flex items-center gap-1 animate-gold-text-shine">
              Rs {t.perGramFixed}
            </Label>
            <Input 
              type="text" 
              inputMode="decimal" 
              value={formatIndianNumber(silverStr)} 
              onChange={(e) => setSilverStr(e.target.value.replace(/,/g, ''))} 
              className="font-mono text-lg font-bold border-secondary/30 focus:border-secondary h-12 animate-gold-shine" 
              placeholder="0.00" 
            />
          </div>
        </div>
        <Button className="w-full py-7 text-lg font-black gap-2 shadow-xl shadow-primary/20" onClick={handleSaveAll} disabled={isUpdating}>
          {isUpdating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {t.updateRates}
        </Button>
      </CardContent>
    </Card>
  )
}