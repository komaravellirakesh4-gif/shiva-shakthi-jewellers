"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { PriceManager } from '@/components/admin/PriceManager'
import Image from 'next/image'
import { GoldCalculator } from '@/components/calculator/GoldCalculator'
import { BillReceipt } from '@/components/calculator/BillReceipt'
import { NotesManager } from '@/components/admin/NotesManager'
import { InterestCalculator } from '@/components/admin/InterestCalculator'
import { useGoldStore, CalculationResult } from '@/lib/store'
import { translations } from '@/lib/translations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Calculator,
  ShieldAlert,
  LayoutDashboard,
  TrendingUp,
  Store,
  LogOut,
  User,
  History,
  Search,
  Trash2,
  Eye,
  Notebook,
  Edit2,
  Languages,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  Lock,
  Sparkles,
  IndianRupee,
  ShoppingBag,
  Users,
  BarChart3,
  Percent
} from 'lucide-react'
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns'
import { useFirestore, useDoc, useMemoFirebase, useUser, useAuth, useCollection, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { AUTHORIZED_ADMIN_EMAILS, SHARED_ADMIN_ID } from '@/lib/constants'
import { formatIndianNumber } from '@/lib/format'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRange } from "react-day-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminPage() {
  const { language, setLanguage, showCursorEffect, setCursorEffect } = useGoldStore()
  const t = translations[language]
  const db = useFirestore()
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { user, isUserLoading: isAuthLoading } = useUser()

  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'calculator' | 'rates' | 'history' | 'notes' | 'interest'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationResult | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: undefined, to: undefined })
  const [editingCalc, setEditingCalc] = useState<CalculationResult | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    billNumber: '', customerName: '', customerPhone: '', customerAddress: '',
    itemName: '', remarks: '', weight: '', rate: '', makingCharges: '',
    stonePrice: '', discount: '', amountPaid: ''
  })

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const adminDocRef = useMemoFirebase(() => user ? doc(db, 'roles_admin', user.uid) : null, [db, user])
  const { data: adminRole, isLoading: isRoleLoading } = useDoc(adminDocRef)

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (AUTHORIZED_ADMIN_EMAILS.includes(user.email || '')) return true;
    return !!adminRole;
  }, [user, adminRole]);

  useEffect(() => {
    if (!isAuthLoading && !isRoleLoading && !isAdmin && user) {
      toast({ variant: "destructive", title: "Unauthorized", description: "Your account does not have admin privileges." })
      signOut(auth).then(() => router.push('/login'))
    }
  }, [isAdmin, isAuthLoading, isRoleLoading, user, auth, router, toast])

  const calcsRef = useMemoFirebase(() => {
    if (!user || !isAdmin) return null;
    return collection(db, 'users', SHARED_ADMIN_ID, 'calculations');
  }, [db, user, isAdmin])

  const { data: calculations, isLoading: isCalcsLoading } = useCollection<CalculationResult>(calcsRef)

  const notesRef = useMemoFirebase(() => {
    if (!user || !isAdmin) return null;
    return collection(db, 'users', SHARED_ADMIN_ID, 'notes');
  }, [db, user, isAdmin])
  const { data: notesData } = useCollection(notesRef)

  // Dashboard stats
  const dashboardStats = useMemo(() => {
    if (!calculations) return { totalOrders: 0, totalRevenue: 0, todayOrders: 0, todayRevenue: 0, uniqueCustomers: 0, pendingNotes: 0, chartData: [] }

    const today = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const todayCalcs = calculations.filter(c => isWithinInterval(new Date(c.timestamp), { start: today, end: todayEnd }))

    const uniqueCustomers = new Set(calculations.filter(c => c.customerName && c.customerName !== 'WALK-IN').map(c => c.customerPhone || c.customerName)).size

    // Generate chart data for last 7 days
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(new Date(), 6 - i)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const dayCalcs = calculations.filter(c => isWithinInterval(new Date(c.timestamp), { start: dayStart, end: dayEnd }))
      return {
        date: format(day, 'dd MMM'),
        sales: dayCalcs.reduce((sum, c) => sum + Math.round(c.finalTotal || 0), 0),
        orders: dayCalcs.length
      }
    })

    return {
      totalOrders: calculations.length,
      totalRevenue: calculations.reduce((sum, c) => sum + Math.round(c.finalTotal || 0), 0),
      todayOrders: todayCalcs.length,
      todayRevenue: todayCalcs.reduce((sum, c) => sum + Math.round(c.finalTotal || 0), 0),
      uniqueCustomers,
      pendingNotes: notesData?.length || 0,
      chartData
    }
  }, [calculations, notesData])

  const filteredHistory = useMemo(() => {
    if (!calculations) return [];
    let sortedAll = [...calculations].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (dateRange?.from) {
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      sortedAll = sortedAll.filter(c => isWithinInterval(new Date(c.timestamp), { start: from, end: to }));
    }

    if (!searchQuery) return sortedAll;
    const query = searchQuery.toLowerCase();
    return sortedAll.filter(c =>
      c.customerName?.toLowerCase().includes(query) ||
      c.customerPhone?.toLowerCase().includes(query) ||
      c.billNumber?.toLowerCase().includes(query) ||
      c.itemName?.toLowerCase().includes(query)
    );
  }, [calculations, searchQuery, dateRange]);

  const highlightMatch = (text: string | undefined | null, query: string) => {
    if (!text) return "";
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase()
            ? <mark key={i} className="bg-primary text-primary-foreground px-1 rounded-sm font-black ring-2 ring-primary">{part}</mark>
            : part
        )}
      </>
    );
  };

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/')
  }

  const handleDelete = (calcId: string) => {
    const docRef = doc(db, 'users', SHARED_ADMIN_ID, 'calculations', calcId);
    deleteDocumentNonBlocking(docRef);
  }

  const handleEditClick = (calc: CalculationResult) => {
    setEditingCalc(calc)
    setEditForm({
      billNumber: calc.billNumber || '', customerName: calc.customerName || '',
      customerPhone: calc.customerPhone || '', customerAddress: calc.customerAddress || '',
      itemName: calc.itemName || '', remarks: calc.remarks || '',
      weight: (calc.weight || 0).toString(), rate: (calc.rate || 0).toString(),
      makingCharges: (calc.makingCharges || 0).toString(), stonePrice: (calc.stonePrice || 0).toString(),
      discount: (calc.discount || 0).toString(), amountPaid: (calc.amountPaid || 0).toString()
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateCalculation = () => {
    if (!editingCalc) return;
    const docRef = doc(db, 'users', SHARED_ADMIN_ID, 'calculations', editingCalc.id);
    const weight = parseFloat(editForm.weight) || 0
    const rate = parseFloat(editForm.rate) || 0
    const making = parseFloat(editForm.makingCharges) || 0
    const stones = parseFloat(editForm.stonePrice) || 0
    const discount = parseFloat(editForm.discount) || 0
    const paid = parseFloat(editForm.amountPaid) || 0
    const oldItemValue = editingCalc.oldItemValue || 0
    const ornamentValue = weight * rate
    const finalTotal = (ornamentValue - oldItemValue) + making + stones - discount
    const balance = finalTotal - paid

    updateDocumentNonBlocking(docRef, {
      billNumber: editForm.billNumber.toUpperCase(),
      customerName: editForm.customerName.toUpperCase(),
      customerPhone: editForm.customerPhone.toUpperCase(),
      customerAddress: editForm.customerAddress.toUpperCase(),
      itemName: editForm.itemName.toUpperCase(),
      remarks: editForm.remarks.toUpperCase(),
      weight, rate, makingCharges: making, stonePrice: stones, discount, amountPaid: paid, finalTotal, balance
    });
    setIsEditDialogOpen(false);
  }

  const handleExportToCSV = () => {
    if (filteredHistory.length === 0) return;
    const rows = [["SHIVA SHAKTHI SALES REPORT"], []];
    const headers = ["BILL NUMBER", "DATE", "TIME", "CUSTOMER NAME", "PHONE", "ITEM NAME", "WEIGHT (G)", "RATE", "TOTAL", "PAID", "BALANCE"];
    rows.push(headers);
    filteredHistory.forEach(c => rows.push([
      c.billNumber, format(new Date(c.timestamp), 'dd MMM yyyy'), format(new Date(c.timestamp), 'hh:mm a'),
      c.customerName || 'WALK-IN', c.customerPhone || 'N/A', c.itemName || 'ORNAMENT',
      c.weight || 0, c.rate || 0, Math.round(c.finalTotal || 0), Math.round(c.amountPaid || 0), Math.round(c.balance || 0)
    ]));
    const csvContent = "\uFEFF" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 animate-glow-pulse overflow-hidden">
          <Image src="/shiva-logo.png" alt="Shiva Shakthi" width={80} height={80} priority />
        </div>
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-6 w-48" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary animate-pulse">Verifying Credentials...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full border-destructive shadow-2xl animate-slide-up">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="bg-destructive/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-headline font-black uppercase tracking-tight">{t.accessDenied}</h1>
            <p className="text-sm text-muted-foreground">This terminal is restricted. Authorization failed.</p>
            <Button onClick={() => router.push('/login')} className="font-bold gap-2 gold-gradient text-white">
              <Lock className="w-4 h-4" /> Secure Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sidebarMenuItems = [
    { id: 'overview' as const, icon: LayoutDashboard, label: t.overview },
    { id: 'calculator' as const, icon: Calculator, label: t.newOrder },
    { id: 'history' as const, icon: History, label: t.ordersHistory },
    { id: 'notes' as const, icon: Notebook, label: t.notes },
    { id: 'interest' as const, icon: Percent, label: t.interestCalculator },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background relative z-10">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border h-20 flex justify-center px-4">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-xl shadow-lg shadow-primary/30">
                <Image src="/shiva-logo.png" alt="Shiva Shakthi" width={32} height={32} className="rounded-lg" />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <div className="text-sm font-black font-headline text-primary uppercase leading-none">SHIVA SHAKTHI</div>
                <div className="text-[9px] font-bold text-sidebar-foreground/30 tracking-[0.2em] uppercase mt-0.5">JEWELLERS</div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.2em] text-sidebar-foreground/30 uppercase">{t.actions}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarMenuItems.map(item => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.id)}
                        isActive={activeTab === item.id}
                        tooltip={item.label}
                        className={cn(
                          "transition-all duration-200",
                          activeTab === item.id && "bg-primary/15 text-primary font-bold"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.2em] text-sidebar-foreground/30 uppercase">{t.priceManagement}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setActiveTab('rates')}
                      isActive={activeTab === 'rates'}
                      tooltip={t.priceManagement}
                      className={cn(activeTab === 'rates' && "bg-primary/15 text-primary font-bold")}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>{t.priceManagement}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.2em] text-sidebar-foreground/30 uppercase">Settings</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-4 space-y-4">
                  <div className="flex items-center justify-between group-data-[collapsible=icon]:hidden">
                    <Label className="flex items-center gap-2 text-xs font-bold text-sidebar-foreground/60">
                      <Sparkles className="w-3 h-3 text-primary" /> {t.sparkleEffect}
                    </Label>
                    <Switch checked={showCursorEffect} onCheckedChange={setCursorEffect} />
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => router.push('/')} className="text-sidebar-foreground/60 hover:text-primary">
                  <Store className="w-4 h-4" /><span>{t.viewPublicStore}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" /><span>{t.logout}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-5 w-px bg-border" />
              <h2 className="text-sm md:text-base font-bold text-foreground uppercase tracking-wide truncate max-w-[150px] md:max-w-none">
                {activeTab === 'history' ? t.ordersHistory : activeTab === 'notes' ? t.notes : activeTab === 'overview' ? t.overview : activeTab === 'calculator' ? t.newOrder : activeTab === 'interest' ? t.interestCalculator : t.priceManagement}
              </h2>
            </div>

            <div className="hidden lg:flex flex-col items-center justify-center px-6 border-x border-border/50 h-10">
              {currentTime && (
                <>
                  <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground leading-none mb-0.5">{format(currentTime, 'dd MMMM yyyy')}</div>
                  <div className="text-lg font-black text-primary tabular-nums tracking-wider leading-none">{format(currentTime, 'hh:mm:ss a')}</div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 font-bold text-[10px] uppercase h-9 px-3 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground">
                    <Languages className="w-4 h-4" />
                    <span className="hidden sm:inline">{translations[language].languageName || language.toUpperCase()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => setLanguage('en')} className={cn(language === 'en' && "bg-primary/10 text-primary font-bold")}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('hi')} className={cn(language === 'hi' && "bg-primary/10 text-primary font-bold")}>हिंदी</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('te')} className={cn(language === 'te' && "bg-primary/10 text-primary font-bold")}>తెలుగు</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-sm">
                <AvatarImage src={adminRole?.profilePicUrl} />
                <AvatarFallback className="gold-gradient text-white text-xs font-bold"><User className="w-4 h-4" /></AvatarFallback>
              </Avatar>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-10">
            {/* DASHBOARD OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Today's Revenue", value: dashboardStats.todayRevenue.toLocaleString('en-IN'), icon: IndianRupee, color: "text-green-600", bg: "bg-green-50", borderColor: "border-green-200", isRupee: true },
                    { label: "Today's Orders", value: dashboardStats.todayOrders.toString(), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50", borderColor: "border-blue-200", isRupee: false },
                    { label: "Total Revenue", value: dashboardStats.totalRevenue.toLocaleString('en-IN'), icon: TrendingUp, color: "text-primary", bg: "bg-primary/5", borderColor: "border-primary/20", isRupee: true },
                    { label: "Pending Notes", value: dashboardStats.pendingNotes.toString(), icon: Notebook, color: "text-orange-600", bg: "bg-orange-50", borderColor: "border-orange-200", isRupee: false },
                  ].map((stat, idx) => (
                    <Card key={stat.label} className={cn("border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up overflow-hidden", stat.borderColor)} style={{ animationDelay: `${idx * 80}ms` }}>
                      <div className="h-0.5 gold-gradient" />
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{stat.label}</p>
                            <p className={cn("text-xl md:text-2xl font-black tracking-tight", stat.color)} style={{ fontFamily: 'Arial, sans-serif' }}>{stat.isRupee ? '₹' : ''}{stat.value}</p>
                          </div>
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                            <stat.icon className={cn("w-5 h-5", stat.color)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Sales Chart */}
                <Card className="border-primary/10 shadow-sm overflow-hidden">
                  <div className="h-0.5 gold-gradient" />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="gold-gradient w-9 h-9 rounded-xl flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-bold">Sales Trend</CardTitle>
                          <p className="text-xs text-muted-foreground">Last 7 days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
                        <p className="text-lg font-black text-primary">{dashboardStats.totalOrders}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-[250px] mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardStats.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(42, 78%, 50%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(42, 78%, 50%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 90%)" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(30, 10%, 45%)' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'hsl(30, 10%, 45%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid hsl(40, 20%, 88%)',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                          />
                          <Area type="monotone" dataKey="sales" stroke="hsl(42, 78%, 50%)" strokeWidth={2.5} fill="url(#salesGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-primary/10 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary/10 w-9 h-9 rounded-xl flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Unique Customers</p>
                          <p className="text-xs text-muted-foreground">All time</p>
                        </div>
                        <p className="ml-auto text-2xl font-black text-primary">{dashboardStats.uniqueCustomers}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Orders */}
                  <Card className="border-primary/10 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary/10 w-9 h-9 rounded-xl flex items-center justify-center">
                          <History className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Recent Activity</p>
                          <p className="text-xs text-muted-foreground">Latest orders</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(calculations || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 3).map(calc => (
                          <div key={calc.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-xs">
                            <div>
                              <p className="font-bold text-foreground uppercase">{calc.customerName || 'WALK-IN'}</p>
                              <p className="text-muted-foreground">{calc.billNumber}</p>
                            </div>
                            <p className="font-bold text-primary">₹{Math.round(calc.finalTotal).toLocaleString('en-IN')}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Price Manager */}
                <PriceManager />
              </div>
            )}

            {activeTab === 'calculator' && <GoldCalculator />}
            {activeTab === 'rates' && <div className="max-w-4xl mx-auto"><PriceManager /></div>}
            {activeTab === 'notes' && <NotesManager isAdmin={isAdmin} />}
            {activeTab === 'interest' && <InterestCalculator />}

            {/* ORDER HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} className="pl-10 h-10 w-full border-primary/10 focus:border-primary" />
                    </div>
                    <div className="flex gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn("h-10 flex-1 sm:flex-none gap-2 font-bold text-xs uppercase border-primary/15", dateRange?.from && "bg-primary text-primary-foreground")}>
                            <CalendarIcon className="w-4 h-4" />
                            {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd")}` : format(dateRange.from, "LLL dd")) : t.selectDate}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus numberOfMonths={2} /></PopoverContent>
                      </Popover>
                      <Button onClick={handleExportToCSV} disabled={filteredHistory.length === 0} variant="outline" size="sm" className="h-10 flex-1 sm:flex-none gap-2 font-bold text-[10px] uppercase tracking-widest text-green-700 border-green-200 hover:bg-green-50">
                        <FileSpreadsheet className="w-4 h-4" /> <span className="hidden sm:inline">{t.exportToSheets}</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {isCalcsLoading ? (
                  <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
                ) : (
                  <Card className="border-primary/10 shadow-md overflow-hidden bg-card">
                    <div className="h-0.5 gold-gradient" />
                    <CardContent className="p-0">
                      <ScrollArea className="w-full">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30 border-b border-primary/10 hover:bg-muted/30">
                              <TableHead className="w-[60px] text-center text-[10px] font-bold uppercase tracking-wider">{t.sNo}</TableHead>
                              <TableHead className="min-w-[110px] text-[10px] font-bold uppercase tracking-wider">{t.invoiceNo}</TableHead>
                              <TableHead className="min-w-[140px] text-[10px] font-bold uppercase tracking-wider">{t.customerName}</TableHead>
                              <TableHead className="min-w-[130px] text-[10px] font-bold uppercase tracking-wider">{t.customerPhone}</TableHead>
                              <TableHead className="min-w-[130px] text-[10px] font-bold uppercase tracking-wider">{t.itemName}</TableHead>
                              <TableHead className="min-w-[110px] text-right text-[10px] font-bold uppercase tracking-wider">{t.finalAmt}</TableHead>
                              <TableHead className="text-center min-w-[130px] text-[10px] font-bold uppercase tracking-wider">{t.actions}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredHistory.map((calc, index) => (
                              <TableRow key={calc.id} className="hover:bg-primary/[0.03] transition-colors border-b border-border/50 group">
                                <TableCell className="text-center text-xs font-medium text-muted-foreground">{index + 1}</TableCell>
                                <TableCell className="font-bold text-xs text-primary/70">{highlightMatch(calc.billNumber, searchQuery)}</TableCell>
                                <TableCell className="font-bold text-xs uppercase">{highlightMatch(calc.customerName || "WALK-IN", searchQuery)}</TableCell>
                                <TableCell className="text-xs">{highlightMatch(calc.customerPhone || "N/A", searchQuery)}</TableCell>
                                <TableCell className="text-xs uppercase">{highlightMatch(calc.itemName, searchQuery)}</TableCell>
                                <TableCell className="text-right font-bold text-xs text-primary">₹{Math.round(calc.finalTotal).toLocaleString('en-IN')}</TableCell>
                                <TableCell>
                                  <div className="flex justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedCalculation(calc)}><Eye className="w-3.5 h-3.5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(calc)}><Edit2 className="w-3.5 h-3.5" /></Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>{t.delete}?</AlertDialogTitle><AlertDialogDescription>Delete bill {calc.billNumber}?</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>{t.cancel}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(calc.id)} className="bg-destructive text-destructive-foreground">{t.delete}</AlertDialogAction></AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-bold">{t.editOrderDetails}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[80vh] px-2">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.invoiceNo}</Label><Input value={editForm.billNumber} onChange={(e) => setEditForm({...editForm, billNumber: e.target.value})} className="h-10" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.customerName}</Label><Input value={editForm.customerName} onChange={(e) => setEditForm({...editForm, customerName: e.target.value})} className="h-10" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.customerPhone}</Label><Input value={editForm.customerPhone} onChange={(e) => setEditForm({...editForm, customerPhone: e.target.value})} className="h-10" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.weight}</Label><Input value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} className="h-10" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.rate}</Label><Input value={formatIndianNumber(editForm.rate)} onChange={(e) => setEditForm({...editForm, rate: e.target.value.replace(/,/g, '')})} className="h-10" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.amountPaid}</Label><Input value={formatIndianNumber(editForm.amountPaid)} onChange={(e) => setEditForm({...editForm, amountPaid: e.target.value.replace(/,/g, '')})} className="h-10" /></div>
              </div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.remarks}</Label><Input value={editForm.remarks} onChange={(e) => setEditForm({...editForm, remarks: e.target.value})} className="h-10" /></div>
            </div>
          </ScrollArea>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleUpdateCalculation} className="gold-gradient text-white">{t.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {selectedCalculation && <BillReceipt calculation={selectedCalculation} onClose={() => setSelectedCalculation(null)} />}
    </SidebarProvider>
  )
}
