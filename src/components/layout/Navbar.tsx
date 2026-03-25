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
    <div className={cn("flex items-center gap-2", mobile && "flex-col items-stretch w-full gap-3")}>
      <Link
        href="/"
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all duration-300",
          pathname === '/'
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
          mobile && "text-sm py-3 px-6 justify-start"
        )}
      >
        <TrendingUp className="w-4 h-4" /> {t.todaysRates}
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setIsMobileMenuOpen(false)}
          className={cn(
            "flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all duration-300",
            pathname === '/admin'
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
            mobile && "text-sm py-3 px-6 justify-start"
          )}
        >
          <LayoutDashboard className="w-4 h-4" /> {t.adminPanel}
        </Link>
      )}
    </div>
  )

  return (
    <nav className="bg-secondary border-b border-primary/10 sticky top-0 z-50 no-print shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-secondary-foreground hover:bg-primary/10 hover:text-primary md:hidden">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[380px] overflow-y-auto bg-secondary border-r-primary/10">
                <SheetHeader className="mb-8 border-b border-primary/10 pb-6">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="p-1.5 rounded-xl shadow-lg">
                      <Image src="/shiva-logo.png" alt="Shiva Shakthi" width={28} height={28} className="rounded-lg" />
                    </div>
                    <span className="font-headline font-black text-primary uppercase tracking-wide">SHIVA SHAKTHI</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6">
                  <NavLinks mobile />

                  <div className="border-t border-primary/10 pt-6 space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                        <Sparkles className="w-4 h-4" /> {t.sparkleEffect}
                      </Label>
                      <Switch checked={showCursorEffect} onCheckedChange={setCursorEffect} />
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-bold text-secondary-foreground/50 uppercase tracking-widest px-2 flex items-center gap-2">
                        <Languages className="w-3 h-3" /> {t.languageName}
                      </div>
                      <div className="grid grid-cols-1 gap-2 px-2">
                        <Button variant={language === 'en' ? 'default' : 'outline'} onClick={() => setLanguage('en')} className="justify-start font-bold h-10">English</Button>
                        <Button variant={language === 'hi' ? 'default' : 'outline'} onClick={() => setLanguage('hi')} className="justify-start font-bold h-10">हिंदी</Button>
                        <Button variant={language === 'te' ? 'default' : 'outline'} onClick={() => setLanguage('te')} className="justify-start font-bold h-10">తెలుగు</Button>
                      </div>
                    </div>
                  </div>

                  {user && (
                    <div className="border-t border-primary/10 pt-6 mt-auto">
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
              <div className="p-1 rounded-xl group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-primary/30 group-hover:shadow-primary/50 group-hover:scale-110">
                <Image src="/shiva-logo.png" alt="Shiva Shakthi" width={36} height={36} className="rounded-lg" priority />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-headline font-black tracking-tight leading-none text-primary uppercase">SHIVA SHAKTHI</span>
                <span className="text-[9px] font-bold text-secondary-foreground/40 tracking-[0.3em] leading-none mt-1 hidden sm:block uppercase">JEWELLERS • EST.</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <NavLinks />
          </div>

          {/* Clock + User Section */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden lg:flex flex-col items-center justify-center px-6 border-x border-primary/10 h-14">
              {currentTime ? (
                <>
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-secondary-foreground/40 leading-none mb-1">
                    {format(currentTime, 'dd MMMM yyyy')}
                  </div>
                  <div className="text-xl font-black text-primary tabular-nums tracking-wider leading-none">
                    {format(currentTime, 'hh:mm:ss a')}
                  </div>
                </>
              ) : (
                <div className="w-40 h-10 bg-secondary-foreground/5 animate-pulse rounded" />
              )}
            </div>

            {isUserLoading ? (
              <div className="w-10 h-10 rounded-full bg-secondary-foreground/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-lg shadow-primary/10">
                  <AvatarImage src={adminRole?.profilePicUrl} />
                  <AvatarFallback className="gold-gradient text-white font-bold">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-2 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs uppercase tracking-widest h-10 px-5 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/20"
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
