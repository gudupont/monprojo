import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlexButtonProps {
  available: boolean;
}

export function PlexButton({ available }: PlexButtonProps) {
  return (
    <Button type="button" variant={available ? "secondary" : "outline"} className="h-11 gap-2 rounded-full" disabled>
      {available ? <Check size={16} /> : <X size={16} />}
      <span role="status" aria-live="polite">
        {available ? "Disponible sur Plex" : "Absent de Plex"}
      </span>
    </Button>
  );
}
