"use client"

import { useGoldStore, Purity } from '@/lib/store'
import { translations } from '@/lib/translations'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, TrendingUp, Info, Loader2, Sparkles, ShieldCheck, Store, MapPin, Phone, Gem, Award } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { hi, te, enUS } from 'date-fns/locale'
import { useState, useEffect } from 'react'
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'
import { Skeleton } from '@/components/ui/skeleton'
import { JewelryBackgroundEffect } from '@/components/ui/JewelryBackgroundEffect'

export default function Home() {
  const db = useFirestore()
  const [mounted, setMounted] = useState(false)
  const { language } = useGoldStore()
  const t = translations[language]

  const dateLocale = language === 'hi' ? hi : language === 'te' ? te : enUS

  useEffect(() => {
    setMounted(true)
  }, [])

  const priceDocRef = useMemoFirebase(() => doc(db, 'gold_prices', 'current'), [db])
  const { data: dbPrices, isLoading: isPricesLoading } = useDoc(priceDocRef)

  const displayPrices = {
    '24K': dbPrices?.adminPrice24k ? dbPrices.adminPrice24k * 10 : null,
    'Silver': dbPrices?.adminPriceSilver ? dbPrices.adminPriceSilver * 10 : null,
    lastUpdated: dbPrices?.lastUpdated ?? null
  }

  return (
    <div className="flex flex-col min-h-screen relative bg-background luxury-bg">
      <JewelryBackgroundEffect />
      
      {/* Global SVG Gradients for Premium flanking jewelry */}
      <svg className="absolute w-0 h-0 pointer-events-none select-none">
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe699"/>
            <stop offset="50%" stopColor="#d4af37"/>
            <stop offset="100%" stopColor="#8a6d1c"/>
          </linearGradient>
          <linearGradient id="goldLightGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff2cc"/>
            <stop offset="50%" stopColor="#ffd966"/>
            <stop offset="100%" stopColor="#bf9000"/>
          </linearGradient>
          <linearGradient id="goldDarkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4af37"/>
            <stop offset="70%" stopColor="#8a6d1c"/>
            <stop offset="100%" stopColor="#5c4308"/>
          </linearGradient>
          <linearGradient id="diamondGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="30%" stopColor="#e0f2fe"/>
            <stop offset="70%" stopColor="#bae6fd"/>
            <stop offset="100%" stopColor="#38bdf8"/>
          </linearGradient>
          <radialGradient id="gemGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="40%" stopColor="#ff3366"/>
            <stop offset="100%" stopColor="#990033"/>
          </radialGradient>
        </defs>
      </svg>
      <Navbar />

      <main className="flex-1 relative z-10">
        {/* Hero Price Banner */}
        <section 
          className="relative overflow-hidden py-24 md:py-32 no-print bg-cover bg-center"
          style={{ backgroundImage: "url('/luxury_hero_banner.png')" }}
        >
          {/* Subtle overlay to enhance contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/70 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-500" />

          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
              
              {/* Left Side: Legacy of Trust & Purity Text Block */}
              <div className="space-y-6 flex-1 animate-slide-up text-left max-w-xl">
                <div className="inline-flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-[0.25em]">
                  ✦ Trusted Since 2005
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-headline font-black text-gray-950 leading-[0.95]">
                  A Legacy of <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-amber-700 to-yellow-800">
                    Trust & Purity
                  </span>
                </h1>
                <p className="text-gray-700 text-sm md:text-base font-medium max-w-sm">
                  Pure 24K. Honest Rates. Timeless Beauty.
                </p>
                <div className="pt-4">
                  <button className="bg-black text-white hover:bg-yellow-500 hover:text-black transition-all duration-400 font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-full flex items-center gap-3 shadow-lg shadow-black/20 group">
                    Explore Collection
                    <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
                  </button>
                </div>
              </div>

              {/* Right Side: Clean Premium White Glass Rate Cards */}
              <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto shrink-0">
                {(['24K', 'Silver'] as Purity[]).map((purity, idx) => (
                  <Card
                    key={purity}
                    className="bg-white/85 backdrop-blur-md border border-yellow-500/10 flex-1 lg:min-w-[280px] shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden rounded-2xl animate-slide-up"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2.5">
                          {purity === '24K' ? (
                            <>
                              <div className="w-6 h-6 rounded-full overflow-hidden border border-yellow-500/20">
                                <Image src="/shiva-logo.png" alt="" width={24} height={24} />
                              </div>
                              <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                                {t.gold24k}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                                <Gem className="w-3.5 h-3.5 text-gray-700" />
                              </div>
                              <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                                {t.silver}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </div>
                      </div>
                      
                      {!mounted || isPricesLoading || displayPrices[purity] === null ? (
                        <Skeleton className="h-12 w-full mt-2 bg-gray-200/50" />
                      ) : (
                        <div className="text-4xl font-black text-gray-900 tracking-tighter leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>
                          <span style={{ fontFamily: 'Arial, sans-serif' }}>₹</span>
                          {displayPrices[purity]?.toLocaleString('en-IN')}
                        </div>
                      )}

                      {/* Dynamic Trend Badges matching mockup precisely */}
                      <div className="mt-3 flex items-start">
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-100/50 flex items-center">
                          {purity === '24K' ? "+120 (0.78%)" : "+10 (0.50%)"}
                        </span>
                      </div>

                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider border-t border-gray-100 mt-5 pt-4 flex justify-between">
                        <span>{t.perGram} / Sale Price</span>
                        <span>Per 10 Grams</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28 bg-secondary/5 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16 animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-primary/20 mb-6">
                <Award className="w-3 h-3" />
                Why Choose Us
              </div>
              <h2 className="text-3xl md:text-4xl font-headline font-black text-foreground">
                A Legacy of <span className="gold-gradient-text">Trust & Purity</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: TrendingUp,
                  title: "Market Transparency",
                  desc: "Real-time pricing updates ensure you always get the most accurate value for your precious investment.",
                  delay: "0ms"
                },
                {
                  icon: ShieldCheck,
                  title: "Guaranteed Purity",
                  desc: "All collections are BIS Hallmarked, ensuring the highest standards of purity and trust for generations.",
                  delay: "150ms"
                },
                {
                  icon: Store,
                  title: "Heritage Craft",
                  desc: "Exquisite craftsmanship blending traditional artistry with contemporary luxury across every piece.",
                  delay: "300ms"
                }
              ].map(({ icon: Icon, title, desc, delay }) => (
                <Card
                  key={title}
                  className="group glass-card border-primary/10 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 overflow-hidden animate-slide-up"
                  style={{ animationDelay: delay }}
                >
                  <div className="h-0.5 gold-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 gold-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-headline text-xl font-black mb-3 text-foreground">{title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="bg-secondary text-secondary-foreground py-16 md:py-20 no-print border-t border-primary/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 border-b border-secondary-foreground/10 pb-12 md:pb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-xl shadow-lg">
                  <Image src="/shiva-logo.png" alt="Shiva Shakthi" width={32} height={32} className="rounded-lg" />
                </div>
                <div>
                  <h2 className="font-headline text-2xl font-black text-primary leading-none">SHIVA SHAKTHI</h2>
                  <span className="text-[10px] font-bold text-secondary-foreground/30 tracking-[0.25em] uppercase">JEWELLERS</span>
                </div>
              </div>
              <p className="text-sm text-secondary-foreground/50 leading-relaxed max-w-xs">
                Crafting timeless elegance since generations. Your trusted destination for premium gold and silver jewelry.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-6 uppercase tracking-[0.2em] text-primary">{t.quickLinks}</h3>
              <ul className="space-y-3 text-sm text-secondary-foreground/50">
                <li className="hover:text-primary cursor-pointer transition-colors duration-300 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" /> Live Gold Charts
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors duration-300 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" /> Our Collections
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors duration-300 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" /> Verify Purity
                </li>
                <li className="hover:text-primary cursor-pointer transition-colors duration-300 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary/40" /> Terms & Conditions
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-sm mb-6 uppercase tracking-[0.2em] text-primary">Contact</h3>
              <div className="text-sm text-secondary-foreground/50 space-y-4">
                <p className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>OLD BAZAAR, Achampet,<br />Telangana 509375</span>
                </p>
                <p className="flex items-center gap-3 font-bold text-primary text-base">
                  <Phone className="w-4 h-4" />
                  +91 9985881156
                </p>
                <p className="flex items-center gap-3 font-bold text-primary/70">
                  <Phone className="w-4 h-4" />
                  +91 9985888106
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-secondary-foreground/30 font-medium">
              © {new Date().getFullYear()} SHIVA SHAKTHI Jewellers. All rights reserved.
            </p>
            <p className="text-[10px] text-secondary-foreground/20 font-bold uppercase tracking-[0.2em]">
              Premium Jewelry Experience
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
