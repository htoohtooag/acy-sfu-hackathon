"use client";

import Image from "next/image";
import { FileCheck2, FileUp } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { MAX_RECEIPT_BYTES, validateReceiptFile } from "@/features/checkout/checkout-validation";
import { cn } from "@/lib/utils";

interface PaymentProofFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PaymentProofField({ value, onChange, error }: PaymentProofFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => value && value.type.startsWith("image/") ? URL.createObjectURL(value) : null, [value]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectFile(file: File | null): void {
    const result = validateReceiptFile(file);
    if (!result.valid) {
      onChange(null);
      return;
    }
    onChange(file);
  }

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor="payment-proof-file">Payment proof</FieldLabel>
      <FieldDescription>Upload a JPEG, PNG, or PDF receipt up to {formatBytes(MAX_RECEIPT_BYTES)}.</FieldDescription>
      <input ref={inputRef} id="payment-proof-file" type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
      <button type="button" className={cn("flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-7 text-center transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", error && "border-destructive")} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0] ?? null); }}>
        {value ? <FileCheck2 aria-hidden="true" className="size-6 text-primary" /> : <FileUp aria-hidden="true" className="size-6 text-muted-foreground" />}
        <span className="text-sm font-medium text-foreground">{value ? "Replace payment proof" : "Choose or drop your receipt"}</span>
        <span className="text-xs text-muted-foreground">JPEG, PNG, or PDF · 5 MB maximum</span>
      </button>
      {value ? <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3"><div className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium text-foreground">{value.name}</span><span className="shrink-0 text-muted-foreground">{formatBytes(value.size)}</span></div>{previewUrl ? <div className="relative aspect-video overflow-hidden rounded-lg bg-muted"><Image src={previewUrl} alt="Preview of uploaded payment proof" fill sizes="(max-width: 768px) 100vw, 32rem" unoptimized className="object-contain" /></div> : <p className="flex items-center gap-2 text-xs text-muted-foreground"><FileCheck2 aria-hidden="true" className="size-4" />PDF selected. The file will be sent securely for admin review.</p>}</div> : null}
      <FieldError>{error}</FieldError>
    </div>
  );
}
