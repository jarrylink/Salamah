"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, HelpCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { brand } from "@/config/brand";

type FormErrors = { identifier?: string; password?: string; form?: string };

export function LoginGateway() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextErrors: FormErrors = {};
    const identifier = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!identifier) nextErrors.identifier = "Enter your email address.";
    if (!password) nextErrors.password = "Enter your password.";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    setErrors({});
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password }) });
      const result = await response.json() as { message?: string; redirectTo?: string };
      if (!response.ok || !result.redirectTo) {
        setErrors({ form: result.message ?? "We could not sign you in. Please try again." });
        return;
      }
      window.location.assign(result.redirectTo);
    } catch {
      setErrors({ form: "We could not reach the sign-in service. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }
  const clear = (field: "identifier" | "password") => setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));

  return <main className="min-h-screen bg-[#f8fafc] lg:grid lg:grid-cols-[minmax(0,1.06fr)_minmax(500px,.94fr)]">
    <section className="relative hidden min-h-screen overflow-hidden bg-[#03283a] px-10 py-10 text-white lg:flex lg:flex-col xl:px-[clamp(3rem,7vw,8.5rem)] xl:py-[clamp(3rem,6vh,5.5rem)]">
      <Image src={brand.assets.background} alt="" fill priority sizes="55vw" className="object-cover opacity-25" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,40,58,.98),rgba(4,62,82,.86)_57%,rgba(30,140,122,.65))]" />
      <div className="relative flex items-center gap-4 salamah-enter"><div className="relative h-15 w-15 overflow-hidden rounded-2xl border border-white/25 bg-white shadow-xl"><Image src={brand.assets.logo} alt="Salamah International School" fill sizes="60px" className="object-cover" /></div><div><p className="font-display text-2xl leading-none">Salamah</p><p className="mt-1 text-[10px] font-bold tracking-[0.22em] text-teal-100 uppercase">International School</p></div></div>
      <div className="relative my-auto max-w-xl pb-10 salamah-enter [animation-delay:120ms]"><div className="mb-8 h-px w-16 bg-[#28a38e]" /><p className="mb-5 text-xs font-bold tracking-[0.2em] text-teal-100 uppercase">Secure digital gateway</p><h1 className="font-display text-5xl leading-[1.08] tracking-[-0.025em] xl:text-6xl">Thoughtful systems for a thriving school community.</h1><p className="mt-7 max-w-lg font-editorial text-xl leading-relaxed text-slate-200">A calm, secure place for the people who keep Salamah moving forward.</p></div>
      <div className="relative flex items-center gap-3 text-sm text-teal-50/80 salamah-enter [animation-delay:220ms]"><ShieldCheck className="h-5 w-5 text-[#67d4c1]" aria-hidden="true" /><span>For authorised members of the school community</span></div>
    </section>
    <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10 lg:px-12"><div className="w-full max-w-md salamah-enter">
      <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="relative h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><Image src={brand.assets.logo} alt="Salamah International School" fill sizes="48px" className="object-cover" /></div><div><p className="font-display text-xl leading-none text-[#043e52]">Salamah</p><p className="mt-1 text-[9px] font-bold tracking-[0.18em] text-[#1e8c7a] uppercase">International School</p></div></div>
      <header><p className="text-xs font-bold tracking-[0.18em] text-[#1e8c7a] uppercase">Management system</p><h2 className="mt-3 font-display text-4xl tracking-[-0.02em] text-[#03283a]">Welcome back</h2><p className="mt-3 text-[15px] leading-6 text-slate-600">Sign in to securely access the Salamah School Management System.</p></header>
      <form className="mt-9 space-y-5" noValidate onSubmit={handleSubmit}>
        {errors.form && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800">{errors.form}</p>}
        <div><label htmlFor="identifier" className="mb-2 block text-sm font-semibold text-[#043e52]">Email address</label><div className="relative"><Mail className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" /><input id="identifier" name="identifier" type="email" autoComplete="username" aria-invalid={Boolean(errors.identifier)} aria-describedby={errors.identifier ? "identifier-error" : undefined} onChange={() => clear("identifier")} className="h-13 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-11 text-[15px] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#28a38e] focus:ring-4 focus:ring-[#28a38e]/15" placeholder="Enter your email address" /></div>{errors.identifier && <p id="identifier-error" role="alert" className="mt-2 text-sm text-rose-700">{errors.identifier}</p>}</div>
        <div><div className="mb-2 flex items-center justify-between gap-4"><label htmlFor="password" className="block text-sm font-semibold text-[#043e52]">Password</label><a href="mailto:office@salamah.edu?subject=Password%20assistance" className="text-sm font-semibold text-[#1e8c7a] transition hover:text-[#043e52] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#28a38e]">Forgot password?</a></div><div className="relative"><LockKeyhole className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" /><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "password-error" : undefined} onChange={() => clear("password")} className="h-13 w-full rounded-xl border border-slate-200 bg-white pr-12 pl-11 text-[15px] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#28a38e] focus:ring-4 focus:ring-[#28a38e]/15" placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute top-1/2 right-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-[#043e52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#28a38e]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}</button></div>{errors.password && <p id="password-error" role="alert" className="mt-2 text-sm text-rose-700">{errors.password}</p>}</div>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600"><input name="remember" type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-[#1e8c7a] focus:ring-[#28a38e]" />Remember me on this device</label>
        <button type="submit" disabled={isLoading} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#043e52] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(4,62,82,.18)] transition hover:bg-[#03283a] hover:shadow-[0_12px_30px_rgba(4,62,82,.24)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#28a38e] disabled:cursor-wait disabled:opacity-75">{isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}{isLoading ? "Signing in…" : "Sign in securely"}</button>
      </form>
      <div className="mt-8 flex items-start gap-3 border-t border-slate-200 pt-6 text-sm leading-5 text-slate-500"><HelpCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#1e8c7a]" aria-hidden="true" /><p>Need assistance? <a href="mailto:office@salamah.edu?subject=Management%20System%20Support" className="font-semibold text-[#1e8c7a] underline-offset-3 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#28a38e]">Contact the school office</a>.</p></div>
    </div></section>
  </main>;
}
