import { db } from "@/lib/db";
import { createProfile, selectProfile } from "@/lib/actions/profile";
import { getProfileProviders } from "@/lib/actions/provider";
import { getAvailableProviders } from "@/lib/tmdb";
import { getActiveProfile } from "@/lib/session";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProviderSelector } from "@/components/provider-selector";
import { RadarrSettings } from "@/components/radarr-settings";
import { SonarrSettings } from "@/components/sonarr-settings";
import { DeleteProfileModal } from "@/components/delete-profile-modal";
import { RenameProfileButton } from "@/components/rename-profile-button";

export default async function ProfilesPage() {
  const profiles = await db.profile.findMany({ orderBy: { createdAt: "asc" } });
  const activeProfile = await getActiveProfile();

  const [availableProviders, selectedProviderIds] = activeProfile
    ? await Promise.all([getAvailableProviders(), getProfileProviders(activeProfile.id)])
    : [[], []];

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Qui regarde ?</h1>

      {profiles.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4">
          {profiles.map((profile) => (
            <div key={profile.id} className="relative flex flex-col items-center gap-2">
              <form action={selectProfile}>
                <input type="hidden" name="profileId" value={profile.id} />
                <button
                  type="submit"
                  aria-label={profile.name}
                  className="flex cursor-pointer flex-col items-center gap-2"
                >
                  <Avatar className="h-16 w-16" style={{ backgroundColor: profile.avatarColor }}>
                    <AvatarFallback style={{ backgroundColor: profile.avatarColor }} className="text-white text-xl">
                      {profile.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </form>
              <RenameProfileButton profileId={profile.id} initialName={profile.name} />
              <div className="absolute -top-1 -right-1">
                <DeleteProfileModal profileId={profile.id} profileName={profile.name} />
              </div>
            </div>
          ))}
        </div>
      )}

      <form action={createProfile} className="flex gap-2">
        <Input name="name" placeholder="Nouveau profil" required />
        <Button type="submit">Créer</Button>
      </form>

      {activeProfile && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Mes plateformes</h2>
          <ProviderSelector
            profileId={activeProfile.id}
            providers={availableProviders}
            initialSelectedIds={selectedProviderIds}
          />
        </div>
      )}

      {activeProfile && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Radarr</h2>
          <RadarrSettings
            profileId={activeProfile.id}
            initialUrl={activeProfile.radarrUrl ?? ""}
            hasConfig={Boolean(activeProfile.radarrUrl && activeProfile.radarrApiKey)}
          />
        </div>
      )}

      {activeProfile && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Sonarr</h2>
          <SonarrSettings
            profileId={activeProfile.id}
            initialUrl={activeProfile.sonarrUrl ?? ""}
            hasConfig={Boolean(activeProfile.sonarrUrl && activeProfile.sonarrApiKey)}
          />
        </div>
      )}
    </div>
  );
}
