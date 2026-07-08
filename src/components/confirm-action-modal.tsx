"use client";

import { Button } from "@/components/ui/button";

export function ConfirmActionModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-mp-border bg-mp-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 font-heading text-xl text-mp-text">{title}</h2>
        <p className="mb-5 text-sm leading-relaxed text-mp-text-dim">{message}</p>
        <div className="flex justify-end gap-3">
          <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" size="sm" onClick={onConfirm}>
            Valider
          </Button>
        </div>
      </div>
    </div>
  );
}
