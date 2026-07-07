"use server";

import { db } from "@/lib/db";
import {
  testRadarrConnection,
  lookupMovieByExistingId,
  lookupMovieForAdd,
  getRadarrDefaults,
  addMovieToRadarr,
} from "@/lib/radarr";
import { revalidatePath } from "next/cache";

export interface SaveRadarrConfigResult {
  success: boolean;
  error?: string;
}

export async function saveRadarrConfig(
  profileId: string,
  url: string,
  apiKey: string,
): Promise<SaveRadarrConfigResult> {
  const connected = await testRadarrConnection(url, apiKey);
  if (!connected) {
    return { success: false, error: "Connexion à Radarr impossible : vérifiez l'URL et la clé API." };
  }

  await db.profile.update({
    where: { id: profileId },
    data: { radarrUrl: url, radarrApiKey: apiKey },
  });

  revalidatePath("/profiles");
  return { success: true };
}

export async function getRadarrStatus(profileId: string): Promise<boolean> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { radarrUrl: true, radarrApiKey: true },
  });
  return Boolean(profile?.radarrUrl && profile?.radarrApiKey);
}

export type RadarrAddState = "already_present" | "added" | "error";

export interface AddToRadarrResult {
  state: RadarrAddState;
  error?: string;
}

export async function checkInRadarr(profileId: string, tmdbId: number): Promise<boolean> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { radarrUrl: true, radarrApiKey: true },
  });
  if (!profile?.radarrUrl || !profile?.radarrApiKey) return false;

  try {
    return await lookupMovieByExistingId(profile.radarrUrl, profile.radarrApiKey, tmdbId);
  } catch {
    return false;
  }
}

export async function addToRadarr(profileId: string, tmdbId: number): Promise<AddToRadarrResult> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { radarrUrl: true, radarrApiKey: true },
  });
  if (!profile?.radarrUrl || !profile?.radarrApiKey) {
    return { state: "error", error: "Configuration Radarr manquante." };
  }
  const { radarrUrl: url, radarrApiKey: apiKey } = profile;

  try {
    const alreadyPresent = await lookupMovieByExistingId(url, apiKey, tmdbId);
    if (alreadyPresent) {
      return { state: "already_present" };
    }

    const movie = await lookupMovieForAdd(url, apiKey, tmdbId);
    const defaults = await getRadarrDefaults(url, apiKey);
    await addMovieToRadarr(url, apiKey, movie, defaults.qualityProfileId, defaults.rootFolderPath);

    return { state: "added" };
  } catch (error) {
    return { state: "error", error: error instanceof Error ? error.message : "Erreur inconnue lors de l'ajout à Radarr." };
  }
}
