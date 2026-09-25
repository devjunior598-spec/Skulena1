import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Saved schools" };

export default function SavedPage() {
  redirect("/parent/saved");
}
