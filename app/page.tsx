import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";

export default async function Home() {
  await requireAuth();
  redirect("/library");
}
