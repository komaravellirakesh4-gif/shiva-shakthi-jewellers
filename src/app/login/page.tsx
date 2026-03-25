"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  ShieldCheck,
  Mail,
  Lock,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react'
import { useAuth, useUser, initiateEmailSignIn, initiatePasswordReset, useFirestore } from '@/firebase'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useGoldStore } from '@/lib/store'
import { translations } from '@/lib/translations'
import { AUTHORIZED_ADMIN_EMAILS } from '@/lib/constants'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const { language } = useGoldStore()
  const t = translations[language]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (user && !isUserLoading) {
      if (AUTHORIZED_ADMIN_EMAILS.includes(user.email || '')) {
        router.push('/admin')
      }
    }
  }, [user, isUserLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email || !password) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please enter both email and password." })
      return
    }

    setIsSubmitting(true)
    try {
      const userCredential = await initiateEmailSignIn(auth, email, password)
      const loggedUser = userCredential.user

      const roleDoc = await getDoc(doc(db, 'roles_admin', loggedUser.uid))
      const isMasterAdmin = AUTHORIZED_ADMIN_EMAILS.includes(loggedUser.email || '');
      const hasAdminRole = roleDoc.exists()

      if (!isMasterAdmin && !hasAdminRole) {
        await signOut(auth);
        setErrorMessage("Access Denied: Your account does not have administrator privileges.");
        return;
      }

      toast({ title: "Welcome back, Admin", description: "Authentication verified." })
      router.push('/admin')
    } catch (error: any) {
      console.error("Login Error:", error);
      let message = "Invalid email or password. Please verify your credentials."
      if (error.code === 'auth/user-not-found') message = "Account not found."
      if (error.code === 'auth/wrong-password') message = "Incorrect password."
      setErrorMessage(message)
      toast({ variant: "destructive", title: "Access Restricted", description: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotPassword = async () => {
    setErrorMessage(null)
    if (!email) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email." })
      return
    }
    setIsResetting(true)
    try {
      await initiatePasswordReset(auth, email)
      setResetSent(true)
      toast({ title: "Recovery Sent", description: "Check your inbox." })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Recovery Failed", description: "Could not send reset email." })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <Card className="max-w-md w-full shadow-2xl border-primary/15 bg-card overflow-hidden relative animate-slide-up">
          {/* Gold accent line */}
          <div className="h-1 gold-gradient" />

          <CardHeader className="text-center space-y-5 pt-10 pb-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary/25 animate-glow-pulse overflow-hidden">
              <Image src="/shiva-logo.png" alt="Shiva Shakthi" width={80} height={80} priority />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-headline font-black uppercase tracking-tight">{t.adminLogin}</CardTitle>
              <CardDescription className="text-muted-foreground/70">SHIVA SHAKTHI Jewellers Admin Portal</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-10">
            {errorMessage && (
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle className="text-sm font-bold">Security Warning</AlertTitle>
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

            {resetSent && (
              <Alert className="bg-green-500/5 border-green-500/20 text-green-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-sm font-bold">Instructions Sent</AlertTitle>
                <AlertDescription className="text-xs">Recovery link sent to your email.</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.15em] text-primary">
                    <Mail className="w-3 h-3" /> {t.adminEmail}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-primary/15 focus:border-primary bg-muted/30 transition-all duration-300"
                    placeholder="admin@shivashakthi.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.15em] text-primary">
                      <Lock className="w-3 h-3" /> {t.password}
                    </Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] font-bold uppercase text-primary/60 hover:text-primary transition-colors"
                    >
                      {t.forgotPassword}
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-primary/15 focus:border-primary bg-muted/30 transition-all duration-300"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 font-bold gap-2 gold-gradient text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                {t.accessDashboard}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
