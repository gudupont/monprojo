"use client";

import { useState } from "react";
import { deleteProfile } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteProfileModalProps {
  profileId: string;
  profileName: string;
}

export function DeleteProfileModal({ profileId, profileName }: DeleteProfileModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            size="icon"
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <span className="sr-only">Supprimer {profileName}</span>
        <span aria-hidden="true">✕</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le profil « {profileName} » ?</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Toutes les données liées à ce profil seront
            définitivement perdues :
          </DialogDescription>
        </DialogHeader>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          <li>Watchlist</li>
          <li>Historique de visionnage</li>
          <li>Entrées de planning</li>
          <li>Plateformes associées</li>
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <form action={deleteProfile}>
            <input type="hidden" name="profileId" value={profileId} />
            <Button type="submit" variant="destructive">
              Supprimer définitivement
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
