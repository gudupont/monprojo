"use server";

import { db } from "@/lib/db";
import {
  testSonarrConnection,
  lookupSeriesByExistingId,
  lookupSeriesForAdd,
  getSonarrDefaults,
  addSeriesToSonarr,
} from "@/lib/sonarr";
import { revalidatePath } from "next/cache";

export interface SaveSonarrConfigResult {
  success: boolean;
  error?: string;
}

export async function saveSonarrConfig(
  profileId: string,
  url: string,
  apiKey: string,
): Promise<SaveSonarrConfigResult> {
  const connected = await testSonarrConnection(url, apiKey);
  if (!connected) {
    return { success: false, error: "Connexion à Sonarr impossible : vérifiez l'URL et la clé API." };
  }

  await db.profile.update({
    where: { id: profileId },
    data: { sonarrUrl: url, sonarrApiKey: apiKey },
  });

  revalidatePath("/profiles");
  return { success: true };
}

export async function getSonarrStatus(profileId: string): Promise<boolean> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { sonarrUrl: true, sonarrApiKey: true },
  });
  return Boolean(profile?.sonarrUrl && profile?.sonarrApiKey);
}

export type SonarrAddState = "already_present" | "added" | "error";

export interface AddToSonarrResult {
  state: SonarrAddState;
  error?: string;
}

export async function checkInSonarr(profileId: string, tmdbId: number): Promise<boolean> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { sonarrUrl: true, sonarrApiKey: true },
  });
  if (!profile?.sonarrUrl || !profile?.sonarrApiKey) return false;

  try {
    return await lookupSeriesByExistingId(profile.sonarrUrl, profile.sonarrApiKey, tmdbId);
  } catch {
    return false;
  }
}

export async function addToSonarr(profileId: string, tmdbId: number): Promise<AddToSonarrResult> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { sonarrUrl: true, sonarrApiKey: true },
  });
  if (!profile?.sonarrUrl || !profile?.sonarrApiKey) {
    return { state: "error", error: "Configuration Sonarr manquante." };
  }
  const { sonarrUrl: url, sonarrApiKey: apiKey } = profile;

  try {
    const alreadyPresent = await lookupSeriesByExistingId(url, apiKey, tmdbId);
    if (alreadyPresent) {
      return { state: "already_present" };
    }

    const series = await lookupSeriesForAdd(url, apiKey, tmdbId);
    const defaults = await getSonarrDefaults(url, apiKey);
    await addSeriesToSonarr(url, apiKey, series, defaults.qualityProfileId, defaults.rootFolderPath);

    return { state: "added" };
  } catch (error) {
    return { state: "error", error: error instanceof Error ? error.message : "Erreur inconnue lors de l'ajout à Sonarr." };
  }
}
