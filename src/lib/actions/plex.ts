"use server";

import { db } from "@/lib/db";
import {
  testPlexAccountConnection,
  testPlexServerConnection,
  checkPlexLibraryAvailability,
  type PlexMediaType,
} from "@/lib/plex";
import { revalidatePath } from "next/cache";

export interface SavePlexConfigResult {
  success: boolean;
  error?: string;
}

export async function savePlexConfig(
  profileId: string,
  accountToken: string,
  serverUrl: string,
  serverToken: string,
): Promise<SavePlexConfigResult> {
  if (!accountToken && !serverUrl && !serverToken) {
    return { success: false, error: "Renseignez au moins un token de compte Plex." };
  }

  if (accountToken) {
    const accountOk = await testPlexAccountConnection(accountToken);
    if (!accountOk) {
      return { success: false, error: "Connexion au compte Plex impossible : vérifiez le token." };
    }
  }

  if (serverUrl || serverToken) {
    if (!serverUrl || !serverToken) {
      return { success: false, error: "L'URL et le token du serveur Plex doivent être renseignés ensemble." };
    }
    const serverOk = await testPlexServerConnection(serverUrl, serverToken);
    if (!serverOk) {
      return { success: false, error: "Connexion au serveur Plex impossible : vérifiez l'URL et le token." };
    }
  }

  await db.profile.update({
    where: { id: profileId },
    data: {
      plexAccountToken: accountToken || null,
      plexServerUrl: serverUrl || null,
      plexServerToken: serverToken || null,
      plexSyncError: null,
    },
  });

  revalidatePath("/profiles");
  return { success: true };
}

export interface PlexStatus {
  hasAccountConfig: boolean;
  hasServerConfig: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;
}

export async function getPlexStatus(profileId: string): Promise<PlexStatus> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: {
      plexAccountToken: true,
      plexServerUrl: true,
      plexServerToken: true,
      lastPlexSyncAt: true,
      plexSyncError: true,
    },
  });

  return {
    hasAccountConfig: Boolean(profile?.plexAccountToken),
    hasServerConfig: Boolean(profile?.plexServerUrl && profile?.plexServerToken),
    lastSyncAt: profile?.lastPlexSyncAt ?? null,
    syncError: profile?.plexSyncError ?? null,
  };
}

export async function getPlexServerConfigStatus(profileId: string): Promise<boolean> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { plexServerUrl: true, plexServerToken: true },
  });
  return Boolean(profile?.plexServerUrl && profile?.plexServerToken);
}

export async function checkPlexAvailability(
  profileId: string,
  tmdbId: number,
  type: PlexMediaType,
): Promise<boolean> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { plexServerUrl: true, plexServerToken: true },
  });
  if (!profile?.plexServerUrl || !profile?.plexServerToken) return false;

  return checkPlexLibraryAvailability(profile.plexServerUrl, profile.plexServerToken, tmdbId, type);
}
