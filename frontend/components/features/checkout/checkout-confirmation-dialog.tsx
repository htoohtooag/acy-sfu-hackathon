"use client";

import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CheckoutConfirmationDialogProps {
  open: boolean;
  pending: boolean;
  amount: string;
  paymentMethod: string;
  fileName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function CheckoutConfirmationDialog({ open, pending, amount, paymentMethod, fileName, onOpenChange, onConfirm }: CheckoutConfirmationDialogProps) {
  return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm payment proof</AlertDialogTitle><AlertDialogDescription>Confirm that you transferred {amount} using {paymentMethod} and that {fileName} is the correct receipt.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel render={<Button type="button" variant="outline" disabled={pending}>Review details</Button>} /><AlertDialogAction onClick={onConfirm} render={<Button type="button" disabled={pending}>{pending ? "Submitting…" : "Submit proof"}</Button>} /></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
