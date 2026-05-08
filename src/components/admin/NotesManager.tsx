
"use client"

import React, { useState, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Loader2, 
  Save, 
  X,
  CalendarDays,
  User,
  Phone,
  IndianRupee,
  ShoppingBag,
  ListOrdered,
  FileSpreadsheet,
  PlusCircle,
  BookOpen,
  Users,
  MapPin
} from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useGoldStore } from '@/lib/store'
import { translations } from '@/lib/translations'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { SHARED_ADMIN_ID } from '@/lib/constants'
import { formatIndianNumber } from '@/lib/format'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from '@/components/ui/dialog'
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'



interface CustomerNote {
  id: string;
  pageNo: string;
  customerName: string;
  relationPrefix: string;
  relationName: string;
  address: string;
  mobileNo: string;
  amountDue: number;
  itemName: string;
  timestamp: string;
}

const ITEM_SUGGESTIONS = [
  "RING",
  "NECK CHAIN",
  "BRACELET",
  "SHORT NECLACE",
  "LONG NECLACE",
  "PUSTHATADU"
]

const RELATION_PREFIXES = [
  { value: "S/O", label: "S/O (Son of)" },
  { value: "F/O", label: "F/O (Father of)" },
  { value: "M/O", label: "M/O (Mother of)" },
  { value: "D/O", label: "D/O (Daughter of)" },
  { value: "W/O", label: "W/O (Wife of)" },
  { value: "H/O", label: "H/O (Husband of)" },
  { value: "R/O", label: "R/O (Resident of)" },
  { value: "C/O", label: "C/O (Care of)" },
]



export const NotesManager = ({ isAdmin }: { isAdmin: boolean }) => {
  const { language } = useGoldStore()
  const t = translations[language]
  const db = useFirestore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: undefined, to: undefined })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null)

  const [pageNo, setPageNo] = useState('')
  const [noteDate, setNoteDate] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [relationPrefix, setRelationPrefix] = useState('')
  const [relationName, setRelationName] = useState('')
  const [address, setAddress] = useState('')
  const [mobileNo, setMobileNo] = useState('')
  const [amountDue, setAmountDue] = useState('')
  const [itemName, setItemName] = useState('')

  const notesRef = useMemoFirebase(() => {
    if (!isAdmin) return null;
    return collection(db, 'users', SHARED_ADMIN_ID, 'notes');
  }, [db, isAdmin])
  
  const { data: notes, isLoading } = useCollection<CustomerNote>(notesRef)

  const highlightMatch = (text: string | undefined | null, query: string) => {
    if (!text) return "";
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
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

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    let sorted = [...notes].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (dateRange?.from) {
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      sorted = sorted.filter(n => isWithinInterval(new Date(n.timestamp), { start: from, end: to }));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sorted = sorted.filter(n =>
        n.customerName.toLowerCase().includes(query) ||
        n.mobileNo.toLowerCase().includes(query) ||
        n.itemName.toLowerCase().includes(query) ||
        (n.address || '').toLowerCase().includes(query)
      );
    }

    return sorted;
  }, [notes, searchQuery, dateRange]);

  const handleOpenAddDialog = () => { setPageNo(''); setNoteDate(format(new Date(), 'yyyy-MM-dd')); setCustomerName(''); setRelationPrefix(''); setRelationName(''); setAddress(''); setMobileNo(''); setAmountDue(''); setItemName(''); setEditingNote(null); setIsDialogOpen(true) }

  const handleEdit = (note: CustomerNote) => {
    setEditingNote(note); setPageNo(note.pageNo || ''); setNoteDate(format(new Date(note.timestamp), 'yyyy-MM-dd')); setCustomerName(note.customerName); setRelationPrefix(note.relationPrefix || ''); setRelationName(note.relationName || ''); setAddress(note.address || ''); setMobileNo(note.mobileNo); setAmountDue(note.amountDue.toString()); setItemName(note.itemName); setIsDialogOpen(true)
  }

  const handleSaveNote = () => {
    const noteId = editingNote?.id || Math.random().toString(36).substring(7);
    const noteRef = doc(db, 'users', SHARED_ADMIN_ID, 'notes', noteId);
    const [year, month, day] = noteDate ? noteDate.split('-').map(Number) : [];
    const selectedDate = noteDate ? new Date(year, month - 1, day, 12, 0, 0) : new Date();
    const noteData: CustomerNote = {
      id: noteId, pageNo, customerName: customerName.toUpperCase(), relationPrefix, relationName: relationName.toUpperCase(), address: address.toUpperCase(), mobileNo: mobileNo.toUpperCase(), amountDue: parseFloat(amountDue) || 0, itemName: itemName.toUpperCase(), timestamp: selectedDate.toISOString()
    };
    setDocumentNonBlocking(noteRef, noteData, { merge: true });
    setIsDialogOpen(false);
  }

  const handleExportNotesCSV = () => {
    if (filteredNotes.length === 0) return;
    const rows = [[`"PENDING NOTES"`, `""`, `""`, `""`, `""`, `""`, `""`, `""`]];
    const headers = ["PAGE NO", "DATE", "CUSTOMER", "RELATION", "ADDRESS", "PHONE", "ITEM", "DUE"];
    rows.push(headers.map(h => `"${h}"`));
    filteredNotes.forEach(n => {
      const relation = n.relationPrefix ? `${n.relationPrefix} ${n.relationName || ''}`.trim() : '';
      rows.push([`"${n.pageNo || ''}"`, `"${format(new Date(n.timestamp), 'dd/MM/yy')}"`, `"${n.customerName}"`, `"${relation}"`, `"${n.address || ''}"`, `"${n.mobileNo}"`, `"${n.itemName}"`, `"${n.amountDue}"`]);
    });
    const csvContent = "\uFEFF" + rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Pending_Notes.csv`;
    link.click();
  }

  const colWidth = "min-w-[150px]";

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/5 flex justify-between items-center py-6">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black">{t.pendingNotes}</CardTitle>
            <CardDescription>{t.trackingDues}</CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} className="w-64" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-2 font-bold text-xs uppercase border-primary/15", dateRange?.from && "bg-primary text-primary-foreground")}>
                  <CalendarDays className="w-4 h-4" />
                  {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd")}` : format(dateRange.from, "LLL dd")) : t.selectDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="range" selected={dateRange} onSelect={setDateRange} initialFocus numberOfMonths={2} /></PopoverContent>
            </Popover>
            <Button variant="outline" onClick={handleExportNotesCSV} disabled={filteredNotes.length === 0}><FileSpreadsheet className="w-4 h-4 mr-2" />{t.exportToSheets}</Button>
            <Button onClick={handleOpenAddDialog} className="font-bold"><Plus className="w-4 h-4 mr-2" /> {t.newNote}</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader className="bg-muted/50 border-b-2 border-primary/20">
                  <TableRow>
                    <TableHead className="w-[80px] text-center border-r border-primary/10">{t.sNo}</TableHead>
                    <TableHead className="w-[80px] text-center border-r border-primary/10">{t.pageNo}</TableHead>
                    <TableHead className={cn(colWidth, "border-r border-primary/10")}>{t.dateTime}</TableHead>
                    <TableHead className={cn(colWidth, "border-r border-primary/10")}>{t.customerName}</TableHead>
                    <TableHead className={cn(colWidth, "border-r border-primary/10")}>{t.relation}</TableHead>
                    <TableHead className={cn(colWidth, "border-r border-primary/10")}>{t.customerAddress}</TableHead>
                    <TableHead className={cn(colWidth, "border-r border-primary/10")}>{t.customerPhone}</TableHead>
                    <TableHead className={cn(colWidth, "border-r border-primary/10")}>{t.itemName}</TableHead>
                    <TableHead className={cn(colWidth, "text-right border-r border-primary/10")}>{t.amountDue}</TableHead>
                    <TableHead className="text-center">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.map((note, index) => (
                    <TableRow 
                      key={note.id} 
                      className={cn(
                        "hover:bg-primary/5 transition-colors border-b",
                        searchQuery.trim() && "bg-primary/25 font-medium animate-in fade-in duration-300"
                      )}
                    >
                      <TableCell className="text-center font-bold text-muted-foreground border-r border-primary/10">{index + 1}</TableCell>
                      <TableCell className="text-center font-bold border-r border-primary/10">{note.pageNo || '-'}</TableCell>
                      <TableCell className="text-xs font-medium border-r border-primary/10">{format(new Date(note.timestamp), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="font-black uppercase border-r border-primary/10">{highlightMatch(note.customerName, searchQuery)}</TableCell>
                      <TableCell className="font-medium uppercase border-r border-primary/10">
                        {note.relationPrefix ? (
                          <span><span className="text-xs font-bold text-primary">{note.relationPrefix}</span>{' '}{highlightMatch(note.relationName, searchQuery)}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="font-medium uppercase border-r border-primary/10">{highlightMatch(note.address, searchQuery) || '-'}</TableCell>
                      <TableCell className="font-medium border-r border-primary/10">{highlightMatch(note.mobileNo, searchQuery)}</TableCell>
                      <TableCell className="uppercase border-r border-primary/10">{highlightMatch(note.itemName, searchQuery)}</TableCell>
                      <TableCell className="text-right font-black text-primary border-r border-primary/10">Rs {note.amountDue.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(note)}><Edit2 className="w-4 h-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>{t.deleteNote}</AlertDialogTitle><AlertDialogDescription>Delete note for {note.customerName}?</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>{t.cancel}</AlertDialogCancel><AlertDialogAction onClick={() => deleteDocumentNonBlocking(doc(db, 'users', SHARED_ADMIN_ID, 'notes', note.id))} className="bg-destructive text-destructive-foreground">{t.delete}</AlertDialogAction></AlertDialogFooter>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingNote ? t.editNote : t.addNewNote}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><BookOpen className="w-3 h-3" />{t.pageNo}</Label>
                <Input value={pageNo} onChange={(e) => setPageNo(e.target.value)} placeholder={t.pageNo} className="font-bold" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><CalendarDays className="w-3 h-3" />{t.date}</Label>
                <Input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} className="font-bold" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><User className="w-3 h-3" />{t.customerName}</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value.toUpperCase())} placeholder={t.customerName} className="font-bold uppercase" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" />{t.relation}</Label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <Select value={relationPrefix} onValueChange={setRelationPrefix}>
                    <SelectTrigger className="font-bold">
                      <SelectValue placeholder={t.selectRelation} />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATION_PREFIXES.map(rp => (
                        <SelectItem key={rp.value} value={rp.value} className="font-medium">{rp.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input value={relationName} onChange={(e) => setRelationName(e.target.value.toUpperCase())} placeholder={t.enterRelationName} className="font-bold uppercase" />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{t.customerAddress}</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value.toUpperCase())} placeholder={t.enterCustomerAddress} className="font-bold uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3" />{t.mobileNo}</Label>
                <Input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder={t.mobileNo} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><IndianRupee className="w-3 h-3" />{t.amountDue}</Label>
                <Input type="text" inputMode="decimal" value={formatIndianNumber(amountDue)} onChange={(e) => setAmountDue(e.target.value.replace(/,/g, ''))} placeholder={t.amountDue} className="font-bold text-primary" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><ShoppingBag className="w-3 h-3" />{t.itemName}</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value.toUpperCase())} placeholder={t.itemName} />
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button><Button onClick={handleSaveNote}>{t.saveChanges}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
