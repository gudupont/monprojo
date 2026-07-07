"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-mp-text"
    >
      <ArrowLeft size={18} />
      Retour
    </button>
  );
}
