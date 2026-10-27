"use client";
import { useActionState, type ReactNode } from "react";
import type { ActionState } from "./actions";

export function ActionForm({ action, children, label }: { action: (state: ActionState, form: FormData) => Promise<ActionState>; children: ReactNode; label: string }) {
  const [state, submit, pending] = useActionState(action, { ok: false, message: "" });
  return <form action={submit} className="space-y-4">{children}<button disabled={pending} className="rounded-xl bg-[#043e52] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Saving…" : label}</button>{state.message && <p role={state.ok ? "status" : "alert"} className={`rounded-lg p-3 text-sm ${state.ok ? "bg-teal-50 text-teal-900" : "bg-red-50 text-red-800"}`}>{state.message}</p>}</form>;
}
