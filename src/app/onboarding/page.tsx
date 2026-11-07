import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

/** Onboarding is folded into authenticated /profiles (Task 7). */
export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/profiles");
  }
  redirect("/profiles");
}
