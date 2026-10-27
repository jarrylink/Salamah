import { z } from "zod";
import type { Module } from "./config";

export function parseRecord(module: Module, form: FormData, editing: boolean) {
  const data: Record<string, string | number | null> = {};
  for (const field of module.fields) {
    const raw = form.get(field.name);
    if (typeof raw !== "string") {
      if (field.required) throw new Error(`${field.label} is required.`);
      data[field.name] = null;
      continue;
    }
    const value = field.type === "password" ? raw : raw.trim();
    if (!value) {
      if (field.required || (field.type === "password" && !editing)) throw new Error(`${field.label} is required.`);
      data[field.name] = null;
    } else if (field.reference) {
      if (!z.uuid().safeParse(value).success) throw new Error(`Choose a valid ${field.label.toLowerCase()}.`);
      data[field.name] = value;
    } else if (field.options) {
      if (!field.options.includes(value)) throw new Error(`Choose a valid ${field.label.toLowerCase()}.`);
      data[field.name] = value;
    } else if (field.type === "money") {
      const amount = Number(value);
      if (!/^\d+(\.\d{1,2})?$/.test(value) || amount < (field.min ?? 0) || amount > (field.max ?? 21474836.47)) throw new Error(`${field.label} must be a positive amount with at most two decimal places.`);
      data[field.name] = Math.round(amount * 100);
    } else if (field.type === "number") {
      const n = Number(value);
      if (!Number.isSafeInteger(n) || n < (field.min ?? 0) || n > (field.max ?? 1000000)) throw new Error(`${field.label} is outside the allowed range.`);
      data[field.name] = n;
    } else if (field.type === "date") {
      if (!z.iso.date().safeParse(value).success) throw new Error(`${field.label} must be a valid date.`);
      data[field.name] = value;
    } else {
      if (value.length > (field.type === "textarea" ? 5000 : 256)) throw new Error(`${field.label} is too long.`);
      if (field.type === "email" && !z.email().safeParse(value).success) throw new Error("Enter a valid email address.");
      if (field.type === "password" && value.length < 12) throw new Error("Use a password with at least 12 characters.");
      data[field.name] = field.type === "email" ? value.toLowerCase() : value;
    }
  }
  if (data.expiry_date && String(data.expiry_date) < String(data.publish_date)) throw new Error("Expiry date cannot precede publication.");
  return data;
}

export function assertImmutable(module: Module, data: Record<string, unknown>, existing: Record<string, unknown>) {
  for (const field of module.fields) {
    if (field.immutable && String(data[field.name] ?? "") !== String(existing[field.name] ?? "")) {
      throw new Error(`${field.label} cannot be changed on an existing record. Create a new record to preserve history.`);
    }
  }
}
