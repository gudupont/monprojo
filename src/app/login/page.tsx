"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, rememberMe }),
      });

      if (!response.ok) {
        setError("Mot de passe incorrect");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Une erreur est survenue, réessaie");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-8">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-mp-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#181004">
            <path d="M6 4l14 8-14 8z" />
          </svg>
        </div>
        <span className="font-heading text-xl italic text-mp-text">MonProjo</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm text-mp-text-dim">
            Mot de passe
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoFocus
            aria-invalid={error ? true : undefined}
          />
        </div>

        {error && <p className="text-sm text-mp-accent-ink bg-red-500/10 text-red-400 rounded-lg px-3 py-2">{error}</p>}

        <label className="flex items-center gap-2 text-sm text-mp-text-dim">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-mp-border accent-mp-accent"
          />
          Rester connecté
        </label>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </div>
  );
}
