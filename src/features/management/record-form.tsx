"use client";

import { useActionState, useState } from "react";
import type { Field } from "./config";
import type { Option, RecordRow } from "./data";
import { saveRecord } from "./actions";

export function RecordForm({ moduleKey, fields, options, record }: { moduleKey: string; fields: Field[]; options: Record<string, Option[]>; record?: RecordRow }) {
  const initial = Object.fromEntries(fields.map((field) => [field.name, String(field.type === "money" && record?.[field.name] != null ? Number(record[field.name]) / 100 : record?.[field.name] ?? (field.type === "number" ? field.min ?? 0 : field.options?.[0] ?? ""))]));
  const [values, setValues] = useState(initial);
  const [state, action, pending] = useActionState(async (previous: { ok: boolean; message: string }, form: FormData) => {
    const result = await saveRecord(moduleKey, previous, form);
    if (result.ok && !record) setValues(initial);
    if (result.ok && record) setValues((current) => ({ ...current, password: "" }));
    return result;
  }, { ok: false, message: "" });
  return <form action={action} className="space-y-5">
    {record && <><input type="hidden" name="id" value={record.id} /><input type="hidden" name="version" value={record.updated_at ?? ""} /></>}
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map((field) => {
        const locked = Boolean(record && field.immutable);
        const choices = field.reference ? options[field.reference] ?? [] : field.options?.map((value) => ({ value, label: value.replaceAll("_", " ") }));
        const control = { name: field.name, id: `${moduleKey}-${field.name}`, value: values[field.name] ?? "", onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues((current) => ({ ...current, [field.name]: event.target.value })), required: field.required || (field.type === "password" && !record), className: "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-teal-600 focus:outline-2 focus:outline-teal-600 disabled:bg-slate-100", disabled: pending || locked };
        return <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
          <label htmlFor={control.id} className="text-sm font-semibold text-[#043e52]">{field.label}{control.required && <span aria-hidden="true"> *</span>}</label>
          {choices ? <select {...control}><option value="">Choose {field.label.toLowerCase()}</option>{choices.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.type === "textarea" ? <textarea {...control} rows={3} maxLength={5000} /> : <input {...control} type={field.type === "money" ? "number" : field.type ?? "text"} step={field.type === "money" ? "0.01" : undefined} min={field.min} max={field.max} maxLength={256} autoComplete={field.type === "password" ? "new-password" : undefined} />}
          {locked && <input type="hidden" name={field.name} value={values[field.name] ?? ""} />}
          {(locked || field.hint) && <p className="mt-1 text-xs leading-5 text-slate-500">{locked ? "Fixed to preserve this record's history." : field.hint}</p>}
        </div>;
      })}
    </div>
    {state.message && <p role={state.ok ? "status" : "alert"} className={`rounded-xl px-4 py-3 text-sm ${state.ok ? "bg-teal-50 text-teal-900" : "bg-red-50 text-red-800"}`}>{state.message}</p>}
    <button disabled={pending} className="rounded-xl bg-[#043e52] px-5 py-3 text-sm font-bold text-white hover:bg-[#03283a] disabled:opacity-60">{pending ? "Saving…" : record ? "Save changes" : "Create record"}</button>
  </form>;
}
