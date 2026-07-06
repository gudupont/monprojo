import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/session";

export default async function Home() {
  const profile = await getActiveProfile();
  redirect(profile ? "/search" : "/profiles");
}
