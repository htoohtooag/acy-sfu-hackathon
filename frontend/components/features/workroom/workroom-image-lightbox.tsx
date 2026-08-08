"use client";

import Image from "next/image";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WorkroomImageLightboxProps {
  src: string | null;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function signedImageLoader({ src }: { src: string }): string {
  return src;
}

export function WorkroomImageLightbox({ src, alt, open, onOpenChange }: WorkroomImageLightboxProps): React.ReactNode {
  if (!src) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl overflow-hidden p-4 sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle>Watermarked image preview</DialogTitle>
          <DialogDescription>Tap or press Escape to close this preview. The original file remains protected until the client approves the final work.</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video max-h-[70vh] overflow-hidden rounded-xl bg-muted">
          <Image loader={signedImageLoader} src={src} alt={alt} fill sizes="(max-width: 1024px) 100vw, 72rem" unoptimized className="object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
