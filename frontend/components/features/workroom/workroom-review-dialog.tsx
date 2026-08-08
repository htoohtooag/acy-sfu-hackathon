"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { createReviewSchema, type CreateReviewRequest } from "shared/schemas";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWorkroomReview } from "@/features/workroom/workroom-deliverable-api";
import { ApiRequestError } from "@/lib/api-client";

interface WorkroomReviewDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error) return error.message;
  return "The review could not be submitted. Please try again.";
}

export function WorkroomReviewDialog({ orderId, open, onOpenChange, onSubmitted }: WorkroomReviewDialogProps): React.ReactNode {
  const reviewMutation = useCreateWorkroomReview();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<CreateReviewRequest>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { rating: 5, comment: "" },
  });

  async function submitReview(values: CreateReviewRequest): Promise<void> {
    setSubmitError(null);
    try {
      await reviewMutation.mutateAsync({ orderId, review: { rating: values.rating, comment: values.comment?.trim() || undefined } });
      reset({ rating: 5, comment: "" });
      onSubmitted();
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof ApiRequestError && error.code === "REVIEW_ALREADY_EXISTS") {
        onSubmitted();
        onOpenChange(false);
        return;
      }
      setSubmitError(errorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a review for this freelancer</DialogTitle>
          <DialogDescription>Share a rating and a short note about the completed work.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => { void handleSubmit(submitReview)(event); }}>
          <FieldGroup>
            <FieldSet>
              <legend className="text-sm font-medium text-foreground">Rating</legend>
              <Controller
                control={control}
                name="rating"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rating from one to five stars">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        type="button"
                        variant={field.value === rating ? "default" : "outline"}
                        aria-checked={field.value === rating}
                        role="radio"
                        onClick={() => field.onChange(rating)}
                      >
                        {rating} {rating === 1 ? "star" : "stars"}
                      </Button>
                    ))}
                  </div>
                )}
              />
              <FieldError>{errors.rating?.message}</FieldError>
            </FieldSet>
            <Field data-invalid={Boolean(errors.comment)}>
              <FieldLabel htmlFor="workroom-review-comment">Comment</FieldLabel>
              <Textarea id="workroom-review-comment" maxLength={2000} placeholder="What stood out about the work?" aria-invalid={Boolean(errors.comment)} {...register("comment")} />
              <FieldDescription>Optional, up to 2,000 characters.</FieldDescription>
              <FieldError>{errors.comment?.message}</FieldError>
            </Field>
            {submitError ? <Alert variant="destructive"><AlertTitle>Review could not be submitted</AlertTitle><AlertDescription>{submitError}</AlertDescription></Alert> : null}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={reviewMutation.isPending} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? <><Spinner data-icon="inline-start" /> Saving review…</> : "Submit review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
