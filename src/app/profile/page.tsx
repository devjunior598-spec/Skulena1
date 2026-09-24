import type { Metadata } from "next";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { UtilityPage, InfoPanel } from "@/components/site/utility-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your profile — preview" };

export default function ProfilePage() {
  return <UtilityPage icon={UserRound} eyebrow="Your space" title="Welcome to your school search." description="You are browsing as a guest. Personal profiles will be available when accounts launch; this preview does not create an account or store personal details.">
    <InfoPanel title="Your shortlist is ready to use"><p>Tap the heart on any school to save it on this device. You can remove a saved school whenever you like.</p><Button asChild className="mt-5"><Link href="/saved">View saved schools</Link></Button></InfoPanel>
    <InfoPanel title="Account settings are coming later"><p>Account details, notification preferences and application history are planned features.</p><Button variant="outline" asChild className="mt-5"><Link href="/sign-in">Learn about accounts</Link></Button></InfoPanel>
  </UtilityPage>;
}
