"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  LayoutDashboard,
  TrendingUp,
  UserCircle,
  LogOut,
  Languages,
  User,
  Menu,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useGoldStore } from '@/lib/store'
import { translations } from '@/lib/translations'
import { AUTHORIZED_ADMIN_EMAILS } from '@/lib/constants'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'

export const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { language, setLanguage, showCursorEffect, setCursorEffect } = useGoldStore()
  const t = translations[language]

  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const adminDocRef = useMemoFirebase(() => user ? doc(db, 'roles_admin', user.uid) : null, [db, user])
  const { data: adminRole } = useDoc(adminDocRef)

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (AUTHORIZED_ADMIN_EMAILS.includes(user.email || '')) return true;
    return !!adminRole;
  }, [user, adminRole]);

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const NavLinks = ({ mobile = false }) => (
    <div className={cn("flex items-center gap-4", mobile && "flex-col items-stretch w-full gap-3")}>
      <Link
        href="/"
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-2 text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-full transition-all duration-300",
          pathname === '/'
            ? "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600 text-black shadow-lg shadow-yellow-500/20"
            : "text-gray-300 hover:bg-white/10 hover:text-white",
          mobile && "py-3 px-6 justify-start rounded-xl"
        )}
      >
        <TrendingUp className="w-3.5 h-3.5" /> {t.todaysRates}
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            "flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all duration-300",
            pathname === '/admin'
              ? "bg-white/15 text-white border border-white/20"
              : "text-gray-300 hover:bg-white/5 hover:text-white",
            mobile && "py-3 px-6 justify-start rounded-xl"
          )}
        >
          <LayoutDashboard className="w-3.5 h-3.5" /> {t.adminPanel}
        </Link>
      )}
    </div>
  )

  return (
    <nav className="bg-black/90 backdrop-blur-xl border-b border-yellow-500/20 sticky top-0 z-50 no-print shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-300 hover:bg-white/10 hover:text-white">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[380px] overflow-y-auto bg-black text-white border-r-yellow-500/20">
                <SheetHeader className="mb-8 border-b border-yellow-500/10 pb-6">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl shadow-lg bg-yellow-500/10">
                      <Image src="/shiva-logo.png" alt="Shiva Shakthi" width={28} height={28} className="rounded-lg" />
                    </div>
                    <span className="font-headline font-black text-yellow-400 uppercase tracking-wide">SHIVA SHAKTHI</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6">
                  <NavLinks mobile />

                  <div className="border-t border-yellow-500/10 pt-6 space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-400">
                        <Sparkles className="w-4 h-4" /> {t.sparkleEffect}
                      </Label>
                      <Switch checked={showCursorEffect} onCheckedChange={setCursorEffect} className="data-[state=checked]:bg-yellow-500" />
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                        <Languages className="w-3 h-3" /> {t.languageName}
                      </div>
                      <div className="grid grid-cols-1 gap-2 px-2">
                        <Button variant={language === 'en' ? 'default' : 'outline'} onClick={() => setLanguage('en')} className="justify-start font-bold h-10 border-yellow-500/20 text-white">English</Button>
                        <Button variant={language === 'hi' ? 'default' : 'outline'} onClick={() => setLanguage('hi')} className="justify-start font-bold h-10 border-yellow-500/20 text-white">हिंदी</Button>
                        <Button variant={language === 'te' ? 'default' : 'outline'} onClick={() => setLanguage('te')} className="justify-start font-bold h-10 border-yellow-500/20 text-white">తెలుగు</Button>
                      </div>
                    </div>
                  </div>

                  {!user && (
                    <div className="border-t border-yellow-500/10 pt-6">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-2 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500 hover:text-black font-bold">
                          <UserCircle className="w-4 h-4" /> {t.adminLogin}
                        </Button>
                      </Link>
                    </div>
                  )}

                  {user && (
                    <div className="border-t border-yellow-500/10 pt-6">
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start gap-2 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500 hover:text-black font-bold mb-3">
                            <LayoutDashboard className="w-4 h-4" /> {t.adminPanel}
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-bold gap-2"
                      >
                        <LogOut className="w-4 h-4" /> {t.logout}
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="p-1 rounded-full group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-yellow-500/20 group-hover:shadow-yellow-500/50 group-hover:scale-105 border border-yellow-500/30 bg-black/40">
                <Image src="/shiva-logo.png" alt="Shiva Shakthi" width={38} height={38} className="rounded-full" priority />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-headline font-black tracking-tight leading-none text-yellow-400 uppercase">SHIVA SHAKTHI</span>
                <span className="text-[8px] font-bold text-gray-400 tracking-[0.25em] leading-none mt-1.5 uppercase">JEWELLERS • EST. 2005</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <NavLinks />
          </div>

          {/* Clock + User Section */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden lg:flex flex-col items-end justify-center px-6 border-x border-yellow-500/20 h-14">
              {currentTime ? (
                <>
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 leading-none mb-1.5">
                    {format(currentTime, 'dd MMMM yyyy')}
                  </div>
                  <div className="text-lg font-black text-yellow-400 tabular-nums tracking-wider leading-none">
                    {format(currentTime, 'hh:mm:ss a')}
                  </div>
                </>
              ) : (
                <div className="w-40 h-10 bg-white/5 animate-pulse rounded" />
              )}
            </div>

            {isUserLoading ? (
              <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-yellow-500/40 shadow-lg shadow-yellow-500/10">
                  <AvatarImage src={adminRole?.profilePicUrl} />
                  <AvatarFallback className="bg-gradient-to-r from-yellow-400 to-amber-600 text-black font-bold">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500 hover:text-black font-bold text-xs uppercase tracking-widest h-10 px-5 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-yellow-500/20 bg-transparent rounded-full"
              >
                <Link href="/login">
                  <UserCircle className="w-4 h-4" /> {t.adminLogin}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
