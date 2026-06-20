"use client";

import { useActionState } from "react";
import {
  inviteEmail,
  revokeInvite,
  type InviteState,
} from "@/app/settings/actions";

const initial: InviteState = { ok: false };

type Invite = { email: string; joined: boolean };

/** Owner-only: invite people by email and manage outstanding invites. */
export function InviteManager({ invites }: { invites: Invite[] }) {
  const [state, action, pending] = useActionState(inviteEmail, initial);

  return (
    <>
      <form className="group invite-add" action={action}>
        <input
          className="invite-input"
          type="email"
          name="email"
          placeholder="friend@email.com"
          aria-label="Invite email"
          autoComplete="off"
        />
        <button className="invite-btn" type="submit" disabled={pending}>
          {pending ? "…" : "Invite"}
        </button>
      </form>
      {state.error ? (
        <div className="section-footer" style={{ color: "var(--red)" }}>
          {state.error}
        </div>
      ) : null}

      {invites.length > 0 && (
        <div className="group spaced">
          {invites.map((inv) => (
            <div className="row" key={inv.email}>
              <span className="row-label">
                <span className="row-title">{inv.email}</span>
                <span className="row-sub">
                  {inv.joined ? "Joined" : "Invited — not yet joined"}
                </span>
              </span>
              <form action={revokeInvite}>
                <input type="hidden" name="email" value={inv.email} />
                <button
                  type="submit"
                  className="invite-revoke"
                  aria-label={`Revoke invite for ${inv.email}`}
                >
                  Revoke
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
