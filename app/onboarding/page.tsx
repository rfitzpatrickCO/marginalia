import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { GoodreadsImport } from "@/components/GoodreadsImport";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  const first = user.name?.trim().split(/\s+/)[0];

  return (
    <main className="scroll">
      <h1 className="large-title">Welcome{first ? `, ${first}` : ""}</h1>
      <p className="onboarding-lede">
        Marginalia is your private reading log — track what you read, log progress,
        and save quotes. Want to bring your books over from Goodreads to start?
      </p>

      <div className="section-header">Import from Goodreads</div>
      <GoodreadsImport />

      <div className="onboarding-actions">
        <Link href="/home" className="btn-primary onboarding-go">
          Go to my library
        </Link>
      </div>
      <p className="section-footer">
        No Goodreads export? No problem — add books anytime, and you can import
        later from Settings.
      </p>
    </main>
  );
}
