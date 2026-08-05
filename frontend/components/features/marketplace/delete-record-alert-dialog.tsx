"use client";

import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function DeleteRecordAlertDialog({ open, label, pending, onOpenChange, onConfirm }: { open: boolean; label: string; pending: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void }): React.ReactNode {
  return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {label}?</AlertDialogTitle><AlertDialogDescription>This will remove it from your workspace. The record is soft deleted and cannot be restored from this screen.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel render={<Button variant="outline">Keep it</Button>} /><AlertDialogAction onClick={onConfirm} render={<Button variant="destructive" disabled={pending}>{pending ? "Deleting…" : "Delete"}</Button>} /></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

