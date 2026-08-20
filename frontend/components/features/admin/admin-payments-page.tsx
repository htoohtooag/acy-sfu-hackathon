"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, CreditCard, ImageOff, LoaderCircle, ReceiptText, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ApiRequestError } from "@/lib/api-client";
import { useAdminPayment, useAdminPayments, useDecideAdminPayment } from "@/features/admin/admin-api";
import type { AdminPaymentDetail, AdminPaymentSummary } from "shared/schemas";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
}

function money(value: string): string {
  return `${Number(value).toLocaleString("en-US")} MMK`;
}

function date(value: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function participantName(value: { full_name: string | null }): string {
  return value.full_name?.trim() || "Unnamed account";
}

export function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"VERIFY" | "REJECT" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const paymentsQuery = useAdminPayments(page);
  const detailQuery = useAdminPayment(selectedPaymentId);
  const decisionMutation = useDecideAdminPayment();
  const totalPages = paymentsQuery.data?.total_pages ?? 0;

  function openPayment(payment: AdminPaymentSummary): void {
    setSelectedPaymentId(payment.id);
    setRejectionReason("");
  }

  function closeReview(force = false): void {
    if (decisionMutation.isPending && !force) return;
    setSelectedPaymentId(null);
    setConfirmAction(null);
    setRejectionReason("");
  }

  async function confirmDecision(): Promise<void> {
    if (!selectedPaymentId || !confirmAction || (confirmAction === "REJECT" && rejectionReason.trim().length === 0)) return;
    try {
      await decisionMutation.mutateAsync(confirmAction === "REJECT" ? { paymentId: selectedPaymentId, action: "REJECT", reason: rejectionReason.trim() } : { paymentId: selectedPaymentId, action: "VERIFY" });
      toast.success(confirmAction === "VERIFY" ? "Payment approved" : "Payment rejected", { description: "The pending payment queue has been refreshed." });
      closeReview(true);
    } catch (error: unknown) {
      if (error instanceof ApiRequestError && error.code === "PAYMENT_ALREADY_DECIDED") {
        toast.info("This payment is no longer pending.");
        closeReview(true);
        void paymentsQuery.refetch();
        return;
      }
      toast.error("Payment decision failed", { description: getErrorMessage(error, "Try again in a moment.") });
      setConfirmAction(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-5 sm:p-8 lg:p-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><ShieldCheck aria-hidden="true" />Operations desk</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Payment review</h1>
          <p className="max-w-[58ch] text-base leading-7 text-muted-foreground">Review manual payment proofs and unlock the work only when the transfer is clear.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground"><Clock3 className="size-4 text-primary" aria-hidden="true" /><span aria-live="polite">{paymentsQuery.data?.total_items ?? 0} pending</span></div>
      </header>

      <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-3 shadow-sm sm:p-5" aria-labelledby="pending-payments-heading">
        <div className="flex items-center justify-between gap-4 border-b border-border px-2 pb-4"><div><h2 id="pending-payments-heading" className="font-heading text-xl font-semibold">Pending payments</h2><p className="mt-1 text-sm text-muted-foreground">Oldest submissions appear first.</p></div><Badge className="border-primary/20 bg-primary/10 px-3 py-1 text-primary"><ReceiptText className="mr-1 size-3.5" aria-hidden="true" />Manual review</Badge></div>
        {paymentsQuery.isPending ? <PaymentListSkeleton /> : paymentsQuery.isError ? <Alert variant="destructive" className="m-2"><AlertCircle aria-hidden="true" /><AlertTitle>Pending payments could not be loaded.</AlertTitle><AlertDescription className="flex flex-wrap items-center gap-3">{getErrorMessage(paymentsQuery.error, "Refresh and try again.")}<Button type="button" variant="outline" size="sm" onClick={() => { void paymentsQuery.refetch(); }}><RefreshCw data-icon="inline-start" />Retry</Button></AlertDescription></Alert> : paymentsQuery.data.items.length === 0 ? <Empty className="min-h-72 rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-10"><EmptyHeader><EmptyMedia variant="icon"><CheckCircle2 aria-hidden="true" /></EmptyMedia><EmptyTitle>All payments are reviewed</EmptyTitle><EmptyDescription>New payment proofs will appear here when clients submit them.</EmptyDescription></EmptyHeader></Empty> : <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full text-sm"><thead className="border-b border-border"><tr><th scope="col" className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Payment</th><th scope="col" className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">People</th><th scope="col" className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Order</th><th scope="col" className="h-11 px-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Submitted</th><th scope="col" className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span className="sr-only">Review</span></th></tr></thead><tbody>{paymentsQuery.data.items.map((payment) => <PaymentTableRow key={payment.id} payment={payment} onOpen={openPayment} />)}</tbody></table></div>
          <ul className="flex flex-col gap-3 md:hidden" aria-label="Pending payments">{paymentsQuery.data.items.map((payment) => <PaymentCard key={payment.id} payment={payment} onOpen={openPayment} />)}</ul>
          <div className="flex flex-col gap-3 border-t border-border px-2 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Page {page} of {Math.max(totalPages, 1)}</p><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page <= 1 || paymentsQuery.isFetching} onClick={() => setPage((current) => current - 1)}><ArrowLeft data-icon="inline-start" />Previous</Button><Button type="button" variant="outline" size="sm" disabled={page >= totalPages || paymentsQuery.isFetching} onClick={() => setPage((current) => current + 1)}>Next<ArrowRight data-icon="inline-end" /></Button></div></div>
        </>}
      </section>

      <PaymentReviewDialog detail={detailQuery.data} query={detailQuery} open={selectedPaymentId !== null} onClose={closeReview} reason={rejectionReason} onReasonChange={setRejectionReason} onApprove={() => setConfirmAction("VERIFY")} onReject={() => setConfirmAction("REJECT")} actionPending={decisionMutation.isPending} />
      <AlertDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open && !decisionMutation.isPending) setConfirmAction(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmAction === "VERIFY" ? "Approve this payment?" : "Reject this payment?"}</AlertDialogTitle><AlertDialogDescription>{confirmAction === "VERIFY" ? "The order will become active and the workroom will unlock." : "The payment will stay rejected and the client can submit a new proof later."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={decisionMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction disabled={decisionMutation.isPending || (confirmAction === "REJECT" && rejectionReason.trim().length === 0)} onClick={() => { void confirmDecision(); }}>{decisionMutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : confirmAction === "VERIFY" ? "Approve payment" : "Reject payment"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PaymentTableRow({ payment, onOpen }: { payment: AdminPaymentSummary; onOpen: (payment: AdminPaymentSummary) => void }) {
  return <tr className="border-b border-border transition-colors hover:bg-muted/40"><td className="p-4"><button type="button" className="min-h-11 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => onOpen(payment)}><span className="block font-semibold text-foreground">{money(payment.amount_mmk)}</span><span className="mt-1 block text-xs text-muted-foreground">{payment.payment_method.display_name ?? payment.payment_method.name ?? "Manual transfer"}{payment.transaction_ref ? ` · ${payment.transaction_ref}` : ""}</span></button></td><td className="p-4"><span className="block text-sm">{participantName(payment.client)}</span><span className="mt-1 block text-xs text-muted-foreground">to {participantName(payment.freelancer)}</span></td><td className="max-w-56 p-4"><span className="block truncate text-sm">{payment.order.title}</span><span className="mt-1 block text-xs text-muted-foreground">{payment.order.id.slice(0, 8)}</span></td><td className="whitespace-nowrap p-4 text-xs text-muted-foreground"><time dateTime={payment.created_at}>{date(payment.created_at)}</time></td><td className="p-4 text-right"><Button type="button" variant="outline" size="sm" onClick={() => onOpen(payment)}>Review<ArrowRight data-icon="inline-end" /></Button></td></tr>;
}

function PaymentCard({ payment, onOpen }: { payment: AdminPaymentSummary; onOpen: (payment: AdminPaymentSummary) => void }) {
  return <li className="rounded-2xl border border-border bg-background p-4"><button type="button" className="flex min-h-11 w-full flex-col gap-3 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" onClick={() => onOpen(payment)}><span className="flex items-start justify-between gap-3"><span><span className="block text-lg font-semibold">{money(payment.amount_mmk)}</span><span className="mt-1 block text-xs text-muted-foreground">{payment.payment_method.display_name ?? payment.payment_method.name ?? "Manual transfer"}</span></span><Badge className="border-warning/30 bg-warning/20 text-warning-foreground">Pending</Badge></span><span className="grid gap-2 text-sm"><span><span className="text-muted-foreground">Client </span>{participantName(payment.client)}</span><span><span className="text-muted-foreground">Freelancer </span>{participantName(payment.freelancer)}</span><span className="truncate"><span className="text-muted-foreground">Order </span>{payment.order.title}</span></span><span className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"><time dateTime={payment.created_at}>{date(payment.created_at)}</time><span className="font-semibold text-primary">Review <ArrowRight className="ml-1 inline size-3.5" aria-hidden="true" /></span></span></button></li>;
}

function PaymentReviewDialog({ detail, query, open, onClose, reason, onReasonChange, onApprove, onReject, actionPending }: { detail: AdminPaymentDetail | undefined; query: ReturnType<typeof useAdminPayment>; open: boolean; onClose: () => void; reason: string; onReasonChange: (value: string) => void; onApprove: () => void; onReject: () => void; actionPending: boolean }) {
  const [failedImageId, setFailedImageId] = useState<string | null>(null);
  const imageFailed = detail !== undefined && failedImageId === detail.id;
  const canDecide = detail !== undefined && !imageFailed && !query.isError && !actionPending;
  return <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Review payment proof</DialogTitle><DialogDescription>Compare the receipt with the order details before making a final decision.</DialogDescription></DialogHeader>{query.isPending ? <div className="grid gap-4" role="status" aria-label="Loading payment review"><Skeleton className="aspect-video w-full rounded-2xl" /><Skeleton className="h-20 w-full rounded-2xl" /></div> : query.isError ? <Alert variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>Payment review could not be loaded.</AlertTitle><AlertDescription className="flex flex-wrap items-center gap-3">{query.error instanceof ApiRequestError && query.error.code === "PAYMENT_ALREADY_DECIDED" ? "This payment is no longer pending." : getErrorMessage(query.error, "Try again to open the proof.")}<Button type="button" variant="outline" size="sm" onClick={() => { void query.refetch(); }}><RefreshCw data-icon="inline-start" />Retry</Button></AlertDescription></Alert> : detail ? <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]"><div className="overflow-hidden rounded-2xl border border-border bg-muted/20"><div className="flex items-center justify-between border-b border-border px-4 py-3"><span className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="size-4 text-primary" aria-hidden="true" />Receipt image</span><span className="text-xs text-muted-foreground">Private link, expires in 5 minutes</span></div>{imageFailed ? <div className="grid min-h-72 place-items-center gap-3 p-8 text-center"><ImageOff className="size-8 text-muted-foreground" aria-hidden="true" /><p className="text-sm text-muted-foreground">The receipt could not be displayed.</p><Button type="button" variant="outline" size="sm" onClick={() => { setFailedImageId(null); void query.refetch(); }}><RefreshCw data-icon="inline-start" />Retry image</Button></div> : <div className="relative min-h-72"><Image src={detail.screenshot_url} alt={`Payment receipt for ${detail.order.title}`} fill sizes="(max-width: 1024px) 100vw, 56vw" unoptimized className="object-contain" onError={() => setFailedImageId(detail.id)} /></div>}</div><div className="flex flex-col gap-5"><div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4"><Detail label="Amount paid" value={money(detail.amount_mmk)} emphasis /><Detail label="Order amount" value={money(detail.agreed_price_mmk)} /><Detail label="Payment method" value={detail.payment_method.display_name ?? detail.payment_method.name ?? "Manual transfer"} /><Detail label="Account name" value={detail.payment_method.account_name ?? "Not provided"} /><Detail label="Transaction reference" value={detail.transaction_ref ?? "Not provided"} /><Detail label="Submitted" value={date(detail.created_at)} /></div><div className="grid gap-3 rounded-2xl border border-border p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Order participants</p><Detail label="Client" value={participantName(detail.client)} /><Detail label="Freelancer" value={participantName(detail.freelancer)} /><Detail label="Order" value={detail.order.title} /></div><Field><FieldLabel htmlFor="rejection-reason">Rejection reason</FieldLabel><Textarea id="rejection-reason" value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Explain what the client should correct." maxLength={1000} disabled={actionPending} aria-describedby="rejection-help rejection-error" /><FieldDescription id="rejection-help">Required only when rejecting, up to 1,000 characters.</FieldDescription>{reason.length > 0 && reason.trim().length === 0 ? <FieldError id="rejection-error">Enter a reason before rejecting.</FieldError> : null}</Field></div></div> : null}<DialogFooter><Button type="button" variant="destructive" disabled={!canDecide || reason.trim().length === 0} onClick={onReject}><XCircle data-icon="inline-start" />Reject</Button><Button type="button" disabled={!canDecide} onClick={onApprove}><CheckCircle2 data-icon="inline-start" />Approve payment</Button></DialogFooter></DialogContent></Dialog>;
}

function Detail({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) { return <div className="flex items-start justify-between gap-4 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className={emphasis ? "text-right text-lg font-semibold text-primary" : "max-w-[14rem] text-right font-medium text-foreground"}>{value}</dd></div>; }

function PaymentListSkeleton() { return <div className="flex flex-col gap-3" role="status" aria-label="Loading pending payments">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-20 w-full rounded-2xl" />)}</div>; }
