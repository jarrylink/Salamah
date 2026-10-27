"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Crown,
  Eye,
  EyeOff,
  HelpCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { brand } from "@/config/brand";

type FormErrors = { identifier?: string; password?: string; form?: string };

export function LoginGateway() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!identifier.trim()) nextErrors.identifier = "Enter your username or email address.";
    if (!password) nextErrors.password = "Enter your password.";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    setErrors({});
    setIsLoading(true);

    // Auto-fill @salamah.ng if user entered username without domain
    const finalIdentifier = identifier.trim().includes("@")
      ? identifier.trim()
      : `${identifier.trim()}@salamah.ng`;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: finalIdentifier, password }),
      });
      const result = (await response.json()) as { message?: string; redirectTo?: string };
      if (!response.ok || !result.redirectTo) {
        setErrors({ form: result.message ?? "We could not sign you in. Please check your credentials." });
        return;
      }
      window.location.assign(result.redirectTo);
    } catch {
      setErrors({ form: "We could not reach the sign-in service. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  const clear = (field: "identifier" | "password") =>
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));

  return (
    <main className="min-h-screen bg-[#020b14] text-slate-100 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(520px,.85fr)]">
      {/* Left Hero Panel: Noble Academic Heritage */}
      <section className="relative hidden min-h-screen overflow-hidden border-r border-[#c5a059]/25 bg-gradient-to-br from-[#020d18] via-[#041a29] to-[#020b14] px-10 py-10 text-white lg:flex lg:flex-col xl:px-[clamp(3.5rem,7vw,8rem)] xl:py-[clamp(3.5rem,6vh,5.5rem)]">
        <Image
          src={brand.assets.background}
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020b14] via-transparent to-[#020b14]/70" />

        {/* Heraldic Header */}
        <div className="relative flex items-center justify-between salamah-enter">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 flex items-center justify-center">
              <Image
                src={brand.assets.logo}
                alt="Salamah International School"
                width={56}
                height={56}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-[#dfba73]" />
                <p className="font-serif text-2xl leading-none font-bold text-white tracking-wide">
                  Salamah
                </p>
              </div>
              <p className="mt-1 text-[9px] font-bold tracking-[0.24em] text-[#c5a059] uppercase">
                International School · Katsina
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-full border border-[#c5a059]/40 bg-[#072439]/70 px-4 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-[#0c3552] hover:border-[#c5a059]"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#dfba73]" />
            <span>Public Portal</span>
          </Link>
        </div>

        {/* Central Noble Inscription */}
        <div className="relative my-auto max-w-xl pb-10 salamah-enter [animation-delay:120ms]">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-12 bg-[#c5a059]" />
            <span className="text-[10px] font-extrabold tracking-[0.25em] text-[#dfba73] uppercase">
              Katsina State, Nigeria
            </span>
          </div>

          <h1 className="font-serif text-4xl leading-[1.12] font-bold tracking-tight sm:text-5xl xl:text-6xl text-white">
            Knowledge, Character &amp; Imperial Leadership.
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300">
            A unified authenticated terminal providing segregated access for Super Admins, Managers, Faculty, and Scholars.
          </p>

          <div className="mt-8 flex items-center gap-4 text-xs text-[#dfba73]">
            <div className="rounded-lg border border-[#c5a059]/30 bg-[#072133] px-3 py-1 font-mono">
              Cambridge International NG482
            </div>
            <div className="rounded-lg border border-[#c5a059]/30 bg-[#072133] px-3 py-1 font-mono">
              FME Accredited
            </div>
          </div>
        </div>

        {/* Security & Database Assurance Footer */}
        <div className="relative flex items-center gap-3 text-xs text-slate-300 salamah-enter [animation-delay:220ms]">
          <ShieldCheck className="h-5 w-5 text-[#dfba73]" aria-hidden="true" />
          <span>Single-source truth stored on Neon PostgreSQL with signed session security</span>
        </div>
      </section>

      {/* Right Login Panel */}
      <section className="flex min-h-screen items-center justify-center bg-[#03111d] px-5 py-8 sm:px-10 lg:px-14">
        <div className="w-full max-w-md salamah-enter">
          {/* Mobile Header */}
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 flex items-center justify-center">
                <Image src={brand.assets.logo} alt="Salamah" width={48} height={48} className="h-full w-auto object-contain" />
              </div>
              <div>
                <p className="font-serif text-xl font-bold leading-none text-white">Salamah</p>
                <p className="mt-1 text-[9px] font-bold tracking-[0.18em] text-[#c5a059] uppercase">
                  International School
                </p>
              </div>
            </div>
            <Link href="/" className="text-xs font-bold text-amber-300 underline">
              Home
            </Link>
          </div>

          <header>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#c5a059]/30 bg-[#c5a059]/15 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#dfba73] uppercase">
                Institutional Gateway
              </span>
            </div>
            <h2 className="mt-2.5 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Welcome back
            </h2>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              Authenticate with your official Salamah credentials to access your designated role workspace.
            </p>
          </header>

          <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
            {errors.form && (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs leading-5 text-rose-200 font-semibold"
              >
                {errors.form}
              </p>
            )}

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="identifier"
                  className="block text-[11px] font-bold text-[#dfba73] uppercase tracking-wider"
                >
                  Username or Email
                </label>
                {identifier.trim() && !identifier.includes("@") && (
                  <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-950/70 border border-teal-500/30 px-2 py-0.5 rounded-md">
                    Autofills: {identifier.trim()}@salamah.ng
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={errors.identifier ? "identifier-error" : undefined}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    clear("identifier");
                  }}
                  className="h-11 w-full rounded-xl border border-slate-700/80 bg-[#020c15] pr-4 pl-10 text-sm text-white outline-none transition placeholder:text-slate-500 hover:border-slate-600 focus:border-[#c5a059] focus:ring-2 focus:ring-[#c5a059]/25"
                  placeholder="e.g. staff1 or superadmin@salamah.ng"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                School members can log in using just their username (e.g. <strong className="text-slate-200">staff1</strong>). Non-school accounts must type full email.
              </p>
              {errors.identifier && (
                <p id="identifier-error" role="alert" className="mt-1.5 text-xs text-rose-400 font-medium">
                  {errors.identifier}
                </p>
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold text-[#dfba73] uppercase tracking-wider"
                >
                  Password
                </label>
                <a
                  href="mailto:it-support@salamah.edu.ng?subject=Credential%20Recovery"
                  className="text-xs font-semibold text-[#dfba73] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clear("password");
                  }}
                  className="h-11 w-full rounded-xl border border-slate-700/80 bg-[#020c15] pr-11 pl-10 text-sm text-white font-mono outline-none transition placeholder:text-slate-500 hover:border-slate-600 focus:border-[#c5a059] focus:ring-2 focus:ring-[#c5a059]/25"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute top-1/2 right-3 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-[#062033] hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1.5 text-xs text-rose-400 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#dfba73] px-5 text-sm font-bold text-[#020b14] shadow-[0_4px_20px_rgba(197,160,89,0.3)] transition hover:brightness-110 disabled:opacity-75 cursor-pointer"
            >
              {isLoading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#020b14]/40 border-t-[#020b14]" />
              )}
              {isLoading ? "Verifying Credentials…" : "Enter Designated Dashboard"}
            </button>
          </form>

          <div className="mt-7 flex items-start gap-3 border-t border-[#c5a059]/20 pt-4 text-xs text-slate-400">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#dfba73]" />
            <p>
              New guardian seeking admission?{" "}
              <Link href="/#enrollment-form" className="font-bold text-[#dfba73] hover:underline">
                Enrol your child now
              </Link>{" "}
              via the dynamic admissions portal.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
