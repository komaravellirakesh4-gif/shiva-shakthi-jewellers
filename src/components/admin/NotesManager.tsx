
"use client"

import React, { useState, useMemo } from 'react'
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
  PlusCircle
} from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { format } from 'date-fns'
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
  customerName: string;
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



export const NotesManager = ({ isAdmin }: { isAdmin: boolean }) => {
  const { language } = useGoldStore()
  const t = translations[language]
  const db = useFirestore()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null)

  const [customerName, setCustomerName] = useState('')
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
    return [...notes].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).filter(n => 
      !searchQuery || n.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.mobileNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notes, searchQuery]);

  const handleOpenAddDialog = () => { setCustomerName(''); setMobileNo(''); setAmountDue(''); setItemName(''); setEditingNote(null); setIsDialogOpen(true) }

  const handleEdit = (note: CustomerNote) => {
    setEditingNote(note); setCustomerName(note.customerName); setMobileNo(note.mobileNo); setAmountDue(note.amountDue.toString()); setItemName(note.itemName); setIsDialogOpen(true)
  }

  const handleSaveNote = () => {
    const noteId = editingNote?.id || Math.random().toString(36).substring(7);
    const noteRef = doc(db, 'users', SHARED_ADMIN_ID, 'notes', noteId);
    const noteData: CustomerNote = {
      id: noteId, customerName: customerName.toUpperCase(), mobileNo: mobileNo.toUpperCase(), amountDue: parseFloat(amountDue) || 0, itemName: itemName.toUpperCase(), timestamp: editingNote?.timestamp || new Date().toISOString()
    };
    setDocumentNonBlocking(noteRef, noteData, { merge: true });
    setIsDialogOpen(false);
  }

  const handleExportNotesCSV = () => {
    if (filteredNotes.length === 0) return;
    const rows = [[`"PENDING NOTES"`, `""`, `""`, `""`, `""`]];
    const headers = ["DATE", "CUSTOMER", "PHONE", "ITEM", "DUE"];
    rows.push(headers.map(h => `"${h}"`));
    filteredNotes.forEach(n => rows.push([`"${format(new Date(n.timestamp), 'dd/MM/yy')}"`, `"${n.customerName}"`, `"${n.mobileNo}"`, `"${n.itemName}"`, `"${n.amountDue}"`]));
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
          <div className="flex items-center gap-3">
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} className="w-64" />
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
                    <TableHead className={cn(colWidth, "border-r border-primary/10")}>{t.dateTime}</TableHead>
                    <TableHead className={cn(colWidth, "border-r border-primary/10")}>{t.customerName}</TableHead>
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
                      <TableCell className="text-xs font-medium border-r border-primary/10">{format(new Date(note.timestamp), 'dd MMM yyyy, hh:mm a')}</TableCell>
                      <TableCell className="font-black uppercase border-r border-primary/10">{highlightMatch(note.customerName, searchQuery)}</TableCell>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingNote ? t.editNote : t.addNewNote}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value.toUpperCase())} placeholder={t.customerName} className="font-bold uppercase" />
            <div className="grid grid-cols-2 gap-4">
              <Input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} placeholder={t.mobileNo} />
              <Input type="text" inputMode="decimal" value={formatIndianNumber(amountDue)} onChange={(e) => setAmountDue(e.target.value.replace(/,/g, ''))} placeholder="Amount Due" className="font-bold text-primary" />
            </div>
            <Input value={itemName} onChange={(e) => setItemName(e.target.value.toUpperCase())} placeholder={t.itemName} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t.cancel}</Button><Button onClick={handleSaveNote}>{t.saveChanges}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
