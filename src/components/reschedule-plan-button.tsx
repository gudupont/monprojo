"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReschedulePlanDialog } from "@/components/reschedule-plan-dialog";

interface ReschedulePlanButtonProps {
  entryId: string;
  title: string;
  scheduledAt: Date;
}

export function ReschedulePlanButton({ entryId, title, scheduledAt }: ReschedulePlanButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setOpen(true)}
        aria-label="Replanifier"
        className="h-11 px-4 md:h-7 md:px-2.5"
      >
        <CalendarClock size={16} strokeWidth={1.8} />
      </Button>
      <ReschedulePlanDialog
        entryId={entryId}
        title={title}
        scheduledAt={scheduledAt}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
