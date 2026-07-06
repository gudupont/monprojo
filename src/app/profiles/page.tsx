import { db } from "@/lib/db";
import { createProfile, selectProfile } from "@/lib/actions/profile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function ProfilesPage() {
  const profiles = await db.profile.findMany({ orderBy: { createdAt: "asc" } });

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
    </div>
  );
}
