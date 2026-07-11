import { describe, expect, it } from "vitest";
import { formatWatchDuration } from "@/lib/format-duration";

describe("formatWatchDuration", () => {
  it("affiche 0 minute pour une durée nulle", () => {
    expect(formatWatchDuration(0)).toBe("0 minute");
  });

  it("affiche les minutes pour une durée inférieure à une heure", () => {
    expect(formatWatchDuration(45)).toBe("45 minutes");
  });

  it("affiche uniquement les heures pour une durée inférieure à un jour", () => {
    expect(formatWatchDuration(5 * 60)).toBe("5 heures");
  });

  it("affiche jours et heures pour une durée inférieure à un mois", () => {
    expect(formatWatchDuration(26 * 60)).toBe("1 jour 2 heures");
  });

  it("plafonne à mois et jours pour une durée dépassant un mois (2 unités max)", () => {
    const minutes = (30 * 24 + 24 + 3) * 60;
    expect(formatWatchDuration(minutes)).toBe("1 mois 1 jour");
  });

  it("omet les heures nulles", () => {
    expect(formatWatchDuration(24 * 60)).toBe("1 jour");
  });

  it("gère plusieurs mois", () => {
    expect(formatWatchDuration(2 * 30 * 24 * 60)).toBe("2 mois");
  });
});
