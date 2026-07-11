"use client";

import { useState, useTransition, type KeyboardEvent, type MouseEvent } from "react";
import { Pencil } from "lucide-react";
import { renameProfile } from "@/lib/actions/profile";

interface RenameProfileButtonProps {
  profileId: string;
  initialName: string;
}

export function RenameProfileButton({ profileId, initialName }: RenameProfileButtonProps) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState(false);
  const [, startTransition] = useTransition();

  function startEditing(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setValue(name);
    setError(false);
    setEditing(true);
  }

  function cancel() {
    setValue(name);
    setEditing(false);
  }

  function commit() {
    const trimmed = value.trim();
    if (trimmed.length === 0 || trimmed === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    const previousName = name;
    setName(trimmed);
    setEditing(false);
    startTransition(() => {
      renameProfile(profileId, trimmed).then((result) => {
        if (!result.success) {
          setName(previousName);
          setError(true);
        }
      });
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={startEditing}
        aria-label={`Renommer ${name}`}
        className="absolute -top-1 -left-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-mp-surface-2 text-mp-text-dim ring-1 ring-mp-border hover:text-mp-text focus-visible:ring-2 focus-visible:ring-mp-accent focus-visible:outline-none"
      >
        <Pencil size={12} />
      </button>
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-auto min-w-24 max-w-[10rem] rounded-md border border-mp-border bg-mp-surface px-2 py-0.5 text-center text-sm text-mp-text outline-none focus-visible:ring-2 focus-visible:ring-mp-accent"
        />
      ) : (
        <span className="text-sm">{name}</span>
      )}
      {error && (
        <span className="text-xs text-destructive">Non enregistré, réessaie</span>
      )}
    </>
  );
}
