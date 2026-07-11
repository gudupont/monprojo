import fs from "node:fs";
import { db } from "@/lib/db";
import { createProfile, selectProfile } from "@/lib/actions/profile";
import { getProfileProviders } from "@/lib/actions/provider";
import { getAvailableProviders } from "@/lib/tmdb";
import { getActiveProfile } from "@/lib/session";
import { isImportActive } from "@/lib/import/backup";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProviderSelector } from "@/components/provider-selector";
import { RadarrSettings } from "@/components/radarr-settings";
import { SonarrSettings } from "@/components/sonarr-settings";
import { PlexSettings } from "@/components/plex-settings";
import { getPlexStatus, type PlexStatus } from "@/lib/actions/plex";
import { DeleteProfileModal } from "@/components/delete-profile-modal";
import { RenameProfileButton } from "@/components/rename-profile-button";
import { TvtimeImport, type InitialImportBatch } from "@/components/tvtime-import";

async function getCurrentImportBatch(): Promise<InitialImportBatch | null> {
  const latest = await db.importBatch.findFirst({
    where: { status: { in: ["RUNNING", "DONE"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return null;

  const isActivelyRunning = latest.status === "RUNNING" && isImportActive(latest.id);
  const isOrphaned = latest.status === "RUNNING" && !isActivelyRunning;

  if (latest.status === "DONE" && !fs.existsSync(latest.backupPath)) {
    return null; // déjà finalisé (Garder), rien à afficher
  }

  return {
    id: latest.id,
    status: latest.status,
    progress: latest.progressJson ? JSON.parse(latest.progressJson) : null,
    report: latest.reportJson ? JSON.parse(latest.reportJson) : null,
    isOrphaned,
  };
}

export default async function ProfilesPage() {
  const profiles = await db.profile.findMany({ orderBy: { createdAt: "asc" } });
  const activeProfile = await getActiveProfile();
  const currentImportBatch = activeProfile ? await getCurrentImportBatch() : null;

  const [availableProviders, selectedProviderIds, plexStatus] = activeProfile
    ? await Promise.all([
        getAvailableProviders(),
        getProfileProviders(activeProfile.id),
        getPlexStatus(activeProfile.id),
      ])
    : [[], [], null as PlexStatus | null];

  return (
    <div className="max-w-2xl px-4 pt-5 pb-12 md:px-10 md:pt-0">
      <h1 className="mb-8 font-heading text-[30px] text-mp-text md:text-[38px]">Qui regarde ?</h1>

      <section className="mb-10">
        {profiles.length > 0 && (
          <div className="flex flex-wrap gap-6">
            {profiles.map((profile) => {
              const isActive = activeProfile?.id === profile.id;
              return (
                <div key={profile.id} className="relative flex flex-col items-center gap-2">
                  <form action={selectProfile}>
                    <input type="hidden" name="profileId" value={profile.id} />
                    <button
                      type="submit"
                      aria-label={isActive ? `${profile.name} (profil actif)` : `Passer au profil ${profile.name}`}
                      aria-current={isActive ? "true" : undefined}
                      className="flex cursor-pointer flex-col items-center gap-2"
                    >
                      <Avatar
                        className={`h-16 w-16 ring-2 ring-offset-2 ring-offset-mp-bg transition-colors ${
                          isActive ? "ring-mp-accent" : "ring-transparent hover:ring-mp-border"
                        }`}
                        style={{ backgroundColor: profile.avatarColor }}
                      >
                        <AvatarFallback
                          style={{ backgroundColor: profile.avatarColor }}
                          className="text-xl text-white"
                        >
                          {profile.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </form>
                  <RenameProfileButton profileId={profile.id} initialName={profile.name} />
                  <div className="absolute -top-1 -right-1">
                    <DeleteProfileModal profileId={profile.id} profileName={profile.name} />
                  </div>
                  {isActive && <span className="text-[11px] font-medium text-mp-accent">Actif</span>}
                </div>
              );
            })}
          </div>
        )}

        <form action={createProfile} className="mt-6 flex max-w-xs gap-2">
          <Input name="name" placeholder="Nouveau profil" required />
          <Button type="submit">Créer</Button>
        </form>
      </section>

      {activeProfile && (
        <section className="border-t border-mp-border pt-8">
          <p className="mb-6 text-sm text-mp-text-dim">
            Réglages de <span className="font-medium text-mp-text">{activeProfile.name}</span>
          </p>

          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-mp-text-dim">Mes plateformes</h2>
            <ProviderSelector
              profileId={activeProfile.id}
              providers={availableProviders}
              initialSelectedIds={selectedProviderIds}
            />
          </div>

          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-mp-text-dim">Radarr</h2>
            <RadarrSettings
              profileId={activeProfile.id}
              initialUrl={activeProfile.radarrUrl ?? ""}
              hasConfig={Boolean(activeProfile.radarrUrl && activeProfile.radarrApiKey)}
            />
          </div>

          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-mp-text-dim">Sonarr</h2>
            <SonarrSettings
              profileId={activeProfile.id}
              initialUrl={activeProfile.sonarrUrl ?? ""}
              hasConfig={Boolean(activeProfile.sonarrUrl && activeProfile.sonarrApiKey)}
            />
          </div>

          {plexStatus && (
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-mp-text-dim">Plex</h2>
              <PlexSettings
                profileId={activeProfile.id}
                initialServerUrl={activeProfile.plexServerUrl ?? ""}
                hasAccountConfig={plexStatus.hasAccountConfig}
                hasServerConfig={plexStatus.hasServerConfig}
                lastSyncAt={plexStatus.lastSyncAt}
                syncError={plexStatus.syncError}
              />
            </div>
          )}

          <div>
            <TvtimeImport initialBatch={currentImportBatch} />
          </div>
        </section>
      )}
    </div>
  );
}
