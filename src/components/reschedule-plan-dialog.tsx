"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reschedulePlanEntry } from "@/lib/actions/calendar";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface ReschedulePlanDialogProps {
  entryId: string;
  title: string;
  scheduledAt: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReschedulePlanDialog({
  entryId,
  title,
  scheduledAt,
  open,
  onOpenChange,
}: ReschedulePlanDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const newDate = formData.get("scheduledAt");
    if (typeof newDate !== "string") return;

    setError(null);
    startTransition(async () => {
      const result = await reschedulePlanEntry(entryId, newDate);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replanifier « {title} »</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="scheduledAt">
              Nouvelle date
            </label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="date"
              defaultValue={toDateInputValue(scheduledAt)}
              required
            />
          </div>
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            Replanifier
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
