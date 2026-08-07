"use client";

import Image from "next/image";
import { CheckCircle2, Download, FileUp, ShieldAlert } from "lucide-react";
import { useRef, useState } from "react";
import type { OrderDetail, OrderListItem } from "shared/schemas";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useDecideDeliverable, useSubmitDeliverable } from "@/features/workroom/workroom-deliverable-api";
import { ApiRequestError } from "@/lib/api-client";
import { getWorkroomStatusPresentation, type WorkroomRole } from "@/features/workroom/workroom-types";
import { WorkroomReviewDialog } from "./workroom-review-dialog";

interface WorkroomDeliverablePanelProps {
  order: OrderListItem;
  detail: OrderDetail | null;
  role: WorkroomRole;
  watermarkedUrl: string | null;
  cleanUrl: string | null;
  reviewSubmitted: boolean;
  onWatermarkedUrl: (deliverableId: string, url: string) => void;
  onCleanUrl: (deliverableId: string, url: string) => void;
  onReviewSubmitted: () => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return "The workroom action could not be completed. Please try again.";
}

function signedImageLoader({ src }: { src: string }): string {
  return src;
}

function formatFileSize(value: string | null): string {
  if (!value) return "File size unavailable";
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "File size unavailable";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function WorkroomDeliverablePanel({ order, detail, role, watermarkedUrl, cleanUrl, reviewSubmitted, onWatermarkedUrl, onCleanUrl, onReviewSubmitted }: WorkroomDeliverablePanelProps): React.ReactNode {
  const status = getWorkroomStatusPresentation(order.status, role);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const submitMutation = useSubmitDeliverable();
  const decisionMutation = useDecideDeliverable();
  const deliverable = detail?.deliverables.find((item) => item.status === "UNDER_REVIEW") ?? detail?.deliverables.at(-1) ?? null;
  const deliverableId = deliverable?.id ?? null;

  function selectFile(file: File | null): void {
    setFileError(null);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFileError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setFileError("The final work image must be 50 MB or smaller.");
      return;
    }
    submitMutation.mutate({ orderId: order.id, file }, {
      onSuccess: (response) => onWatermarkedUrl(response.deliverable_id, response.watermarked_url),
      onError: (error) => setFileError(errorMessage(error)),
    });
  }

  function decide(action: "APPROVE" | "REJECT"): void {
    if (!deliverableId) {
      setDecisionError("The deliverable details are still loading. Refresh and try again.");
      return;
    }
    setDecisionError(null);
    decisionMutation.mutate({ orderId: order.id, deliverableId, action }, {
      onSuccess: (response) => {
        if (response.deliverable_status === "APPROVED") onCleanUrl(response.deliverable_id, response.clean_url);
      },
      onError: (error) => setDecisionError(errorMessage(error)),
    });
  }

  if (status.showSubmitFinalWork) {
    return (
      <section className="shrink-0 border-t border-border bg-background px-5 py-4 sm:px-7" aria-labelledby="submit-final-work-title">
        <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 id="submit-final-work-title" className="font-medium text-foreground">Ready to submit the final work?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Upload one image to send a watermarked preview to the client.</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
          <Button type="button" size="lg" disabled={submitMutation.isPending} onClick={() => fileInputRef.current?.click()}>
            {submitMutation.isPending ? <><Spinner data-icon="inline-start" /> Uploading…</> : <><FileUp data-icon="inline-start" /> Submit Final Work</>}
          </Button>
        </div>
        {fileError ? <p className="mt-2 text-sm text-destructive" role="alert">{fileError}</p> : null}
      </section>
    );
  }

  if (status.showReviewPanel && role === "CLIENT") {
    return (
      <Card className="mx-5 mb-4 shrink-0 border-primary/30 sm:mx-7" aria-labelledby="deliverable-review-title">
        <CardHeader>
          <CardTitle id="deliverable-review-title">Review the submitted work</CardTitle>
          <CardDescription>Approve the final work to release payment, or request a revision to reopen the workroom.</CardDescription>
        </CardHeader>
        <CardContent>
          {watermarkedUrl ? (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
              <Image loader={signedImageLoader} src={watermarkedUrl} alt="Watermarked final work preview" fill sizes="(max-width: 768px) 100vw, 44rem" unoptimized className="object-contain" />
            </div>
          ) : (
            <Alert>
              <ShieldAlert aria-hidden="true" />
              <AlertTitle>Secure preview unavailable</AlertTitle>
              <AlertDescription>The watermarked preview is available only while its temporary access link is active. The file remains under review.</AlertDescription>
            </Alert>
          )}
          {deliverable ? <p className="mt-3 text-sm text-muted-foreground">{deliverable.file_name} · {formatFileSize(deliverable.file_size_bytes)}</p> : null}
          {decisionError ? <p className="mt-3 text-sm text-destructive" role="alert">{decisionError}</p> : null}
        </CardContent>
        <CardFooter className="flex-col gap-3 border-t border-border sm:flex-row sm:justify-end">
          <Button type="button" size="lg" variant="outline" disabled={decisionMutation.isPending || !deliverableId} onClick={() => decide("REJECT")}>Request Revision</Button>
          <Button type="button" size="lg" disabled={decisionMutation.isPending || !deliverableId} onClick={() => decide("APPROVE")}>
            {decisionMutation.isPending ? <><Spinner data-icon="inline-start" /> Updating…</> : <><CheckCircle2 data-icon="inline-start" /> Approve &amp; Release Payment</>}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (order.status === "COMPLETED" && role === "CLIENT") {
    return (
      <section className="shrink-0 border-t border-border bg-background px-5 py-4 sm:px-7" aria-labelledby="completed-work-title">
        <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 id="completed-work-title" className="font-medium text-foreground">Project completed</h3>
            <p className="mt-1 text-sm text-muted-foreground">{cleanUrl ? "Your clean file is ready to download." : "The clean file link is not available in this session."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {cleanUrl ? <Button nativeButton={false} render={<a href={cleanUrl} download />}><Download data-icon="inline-start" /> Download Clean File</Button> : null}
            {!reviewSubmitted ? <Button type="button" variant="outline" onClick={() => setReviewOpen(true)}>Leave a review</Button> : null}
          </div>
        </div>
        <WorkroomReviewDialog orderId={order.id} open={reviewOpen} onOpenChange={setReviewOpen} onSubmitted={onReviewSubmitted} />
      </section>
    );
  }

  return null;
}
