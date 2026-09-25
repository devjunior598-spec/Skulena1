import type { Metadata } from "next";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { UtilityPage, InfoPanel } from "@/components/site/utility-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your account" };

export default function ProfilePage() {
  return <UtilityPage icon={UserRound} eyebrow="Your account" title="Keep your school search together." description="Sign in to manage your account and saved schools.">
    <InfoPanel title="Your saved schools"><p>Save published schools to your account shortlist and return to them whenever you need.</p><Button asChild className="mt-5"><Link href="/saved">View saved schools</Link></Button></InfoPanel>
    <InfoPanel title="Account details"><p>Update the profile information associated with your account from your private account workspace.</p><Button variant="outline" asChild className="mt-5"><Link href="/sign-in">Sign in</Link></Button></InfoPanel>
  </UtilityPage>;
}
