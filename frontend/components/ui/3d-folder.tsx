"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type AnimatedFolderProject = {
  id: string;
  image: string;
  title: string;
};

type AnimatedFolderProps = {
  title: string;
  projects: AnimatedFolderProject[];
  className?: string;
};

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return reducedMotion;
}

export function AnimatedFolder({ title, projects, className }: AnimatedFolderProps) {
  const visibleProjects = projects.slice(0, 3);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  if (visibleProjects.length === 0) return null;

  const openProject = (index: number) => setSelectedIndex(index);

  return (
    <>
      <div
        className={cn(
          "relative flex min-h-80 w-full min-w-0 flex-col items-center justify-center overflow-visible rounded-2xl border-0 bg-transparent px-2 py-5 transition-opacity duration-500 sm:min-h-80 sm:px-4",
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/10 transition-opacity duration-500"
          style={{ opacity: isHovered ? 0.35 : 0 }}
          aria-hidden="true"
        />

        <div className="relative mb-3 h-56 w-full" aria-label={`${title}, ${projects.length} projects`}>
          <div className="absolute top-0 h-56 w-56 max-w-full [perspective:1000px]" style={{ left: "50%", transform: "translateX(-50%)" }}>
            <div
              className={cn(
                "absolute z-10 h-24 w-32 rounded-xl bg-secondary shadow-md",
                !reducedMotion && "transition-transform duration-500 [transform-origin:bottom_center]",
              )}
              style={{ left: "50%", top: "112px", transform: `translate(-50%, -50%) ${isHovered && !reducedMotion ? "rotateX(-15deg)" : "rotateX(0deg)"}` }}
              aria-hidden="true"
            />
            <div
              className={cn(
                "absolute z-10 h-4 w-12 rounded-t-md bg-secondary",
                !reducedMotion && "transition-transform duration-500 [transform-origin:bottom_center]",
              )}
              style={{ left: "calc(50% - 48px)", top: "52px", transform: isHovered && !reducedMotion ? "rotateX(-25deg) translateY(-2px)" : "rotateX(0deg)" }}
              aria-hidden="true"
            />

            <div className="absolute z-20 h-0 w-0" style={{ left: "50%", top: "112px" }}>
              {visibleProjects.map((project, index) => {
                const rotations = [-12, 0, 12];
                const translations = [-52, 0, 52];
                const shown = isHovered || reducedMotion;

                return (
                  <button
                    key={project.id}
                    type="button"
                    className={cn(
                      "absolute h-28 w-20 overflow-hidden rounded-xl border border-border bg-card text-start shadow-xl focus-visible:z-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      !reducedMotion && "transition-[transform,opacity] duration-500 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)]",
                      "hover:ring-2 hover:ring-primary/60",
                    )}
                    style={{
                      left: "50%",
                      top: "0",
                      transform: shown
                        ? `translate(calc(-50% + ${translations[index]}px), -100px) rotate(${rotations[index]}deg)`
                        : "translate(-50%, -10px) rotate(0deg) scale(0.7)",
                      opacity: shown ? 1 : 0,
                      zIndex: 30 - index,
                      transitionDelay: reducedMotion ? "0ms" : `${index * 80}ms`,
                    }}
                    onClick={() => openProject(index)}
                    aria-label={`Open sample work: ${project.title}`}
                  >
                    <Image src={project.image} alt="" fill sizes="80px" className="object-cover" />
                    <span className="absolute inset-x-1 bottom-1 line-clamp-2 text-[10px] font-semibold leading-tight text-primary-foreground drop-shadow-md">
                      {project.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className={cn(
                "absolute z-30 h-24 w-32 rounded-xl bg-primary shadow-lg",
                !reducedMotion && "transition-transform duration-500 [transform-origin:bottom_center]",
              )}
              style={{ left: "50%", top: "116px", transform: `translateX(-50%) ${isHovered && !reducedMotion ? "rotateX(25deg) translateY(8px)" : "rotateX(0deg)"}` }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute z-30 h-24 w-32 overflow-hidden rounded-xl bg-gradient-to-br from-primary-foreground/30 to-transparent"
              style={{ left: "50%", top: "116px", transform: `translateX(-50%) ${isHovered && !reducedMotion ? "rotateX(25deg) translateY(8px)" : "rotateX(0deg)"}` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <h3 className="relative mt-1 text-center font-heading text-lg font-semibold text-foreground">{title}</h3>
        <p className="relative text-sm text-muted-foreground">{projects.length} projects</p>
        <p className="relative mt-2 text-xs text-muted-foreground/80">Select a preview to explore</p>
      </div>

      {selectedIndex !== null ? (
        <FolderLightbox
          projects={visibleProjects}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onSelect={setSelectedIndex}
        />
      ) : null}
    </>
  );
}

type FolderLightboxProps = {
  projects: AnimatedFolderProject[];
  selectedIndex: number;
  onClose: () => void;
  onSelect: (index: number) => void;
};

function FolderLightbox({ projects, selectedIndex, onClose, onSelect }: FolderLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const project = projects[selectedIndex];

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && selectedIndex > 0) onSelect(selectedIndex - 1);
      if (event.key === "ArrowRight" && selectedIndex < projects.length - 1) onSelect(selectedIndex + 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onSelect, projects.length, selectedIndex]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="sample-work-viewer-title">
      <button type="button" className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} aria-label="Close sample work viewer" />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="relative aspect-[4/3] w-full bg-background">
          <Image src={project.image} alt={project.title} fill sizes="(min-width: 768px) 768px, 100vw" className="object-contain" priority />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="sample-work-viewer-title" className="truncate font-heading text-lg font-semibold text-foreground">{project.title}</h2>
            <p className="text-sm text-muted-foreground">{selectedIndex + 1} of {projects.length}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40" onClick={() => onSelect(selectedIndex - 1)} disabled={selectedIndex === 0} aria-label="Previous sample work"><ChevronLeft aria-hidden="true" className="size-5" /></button>
            <button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40" onClick={() => onSelect(selectedIndex + 1)} disabled={selectedIndex === projects.length - 1} aria-label="Next sample work"><ChevronRight aria-hidden="true" className="size-5" /></button>
            <button ref={closeButtonRef} type="button" className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90" onClick={onClose} aria-label="Close sample work viewer"><X aria-hidden="true" className="size-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
