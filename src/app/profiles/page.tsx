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

export default async function ProfilesPage() {
  const profiles = await db.profile.findMany({ orderBy: { createdAt: "asc" } });
  const activeProfile = await getActiveProfile();

  const [availableProviders, selectedProviderIds] = activeProfile
    ? await Promise.all([getAvailableProviders(), getProfileProviders(activeProfile.id)])
    : [[], []];

  return (
    <div className="mx-auto max-w-md space-y-8">
      <h1 className="text-2xl font-semibold">Qui regarde ?</h1>

      {profiles.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <form key={profile.id} action={selectProfile}>
              <input type="hidden" name="profileId" value={profile.id} />
              <button type="submit" className="flex flex-col items-center gap-2">
                <Avatar className="h-16 w-16" style={{ backgroundColor: profile.avatarColor }}>
                  <AvatarFallback style={{ backgroundColor: profile.avatarColor }} className="text-white text-xl">
                    {profile.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{profile.name}</span>
              </button>
            </form>
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
    </div>
  );
}
