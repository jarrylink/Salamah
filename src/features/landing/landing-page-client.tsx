"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Building,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Printer,
  Quote,
  School,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  User,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";
import { brand } from "@/config/brand";
import type { CmsSection } from "@/lib/services/cms";
import { formatNaira } from "@/lib/date-utils";

export type ChildEntry = {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  intendedClass: string;
  previousSchool: string;
  medicalInfo: string;
};

// Cloudinary Auto-Format & Dimension Optimizer for instant image loads (100x speedup)
function optImg(url: string, width = 800) {
  if (!url || !url.includes("res.cloudinary.com") || url.includes("/f_auto,")) {
    return url;
  }
  return url.replace("/image/upload/", `/image/upload/f_auto,q_auto,w_${width}/`);
}

// Animated Number Component with easing
function AnimatedNumber({
  value,
  duration = 1800,
}: {
  value: string | number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    const raw = value.toString();
    return raw.replace(/(\d[\d,]*)/, "0");
  });

  useEffect(() => {
    const rawStr = value.toString();
    const match = rawStr.match(/(\d[\d,]*)/);
    if (!match) {
      setDisplayValue(rawStr);
      return;
    }

    const numStr = match[1].replace(/,/g, "");
    const targetNum = parseInt(numStr, 10);
    if (isNaN(targetNum)) {
      setDisplayValue(rawStr);
      return;
    }

    const prefix = rawStr.slice(0, match.index);
    const suffix = rawStr.slice((match.index ?? 0) + match[1].length);

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(ease * targetNum);
      const formatted = current.toLocaleString();
      setDisplayValue(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(rawStr);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  return <span>{displayValue}</span>;
}

export function LandingPageClient({
  sections,
  feePerChildKobo,
  schoolProfile,
  currentUser,
}: {
  sections: Record<string, CmsSection>;
  feePerChildKobo: number;
  schoolProfile: Record<string, unknown>;
  currentUser?: {
    id: string;
    email: string;
    role: string;
    name?: string;
    avatarUrl?: string;
  } | null;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);

  // Quick Sign In State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Enrollment Form State
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");
  const [guardianOccupation, setGuardianOccupation] = useState("");

  const [childrenList, setChildrenList] = useState<ChildEntry[]>([
    {
      firstName: "",
      middleName: "",
      lastName: "",
      gender: "male",
      dateOfBirth: "2015-05-10",
      intendedClass: "JSS 1",
      previousSchool: "",
      medicalInfo: "",
    },
  ]);

  // Payment & Submission State
  const [paymentMethod, setPaymentMethod] = useState("online_card");
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    applicationNumber: string;
    totalFeeKobo: number;
    paymentReference: string;
    numberOfChildren: number;
  } | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  // Section Content from Database via CMS
  const heroSec = sections["hero"] || {
    title: "Salamah International School",
    subtitle:
      "Welcome to Salamah International School, Nigeria's premier private academy delivering Cambridge International & Nigerian curricula.",
    content: {
      motto: "Learning for Peaceful Co-existence",
      ctaPrimaryText: "Enrol Your Child Now",
      highlights: [
        { value: "30+", label: "Years of Academic Distinction" },
        { value: "2,850+", label: "Distinguished Scholars Enrolled" },
        { value: "98%", label: "Cambridge & WAEC Examination Pass Rate" },
        { value: "247", label: "Accredited Faculty & Educators" },
      ],
    },
  };

  const aboutSec = sections["about"] || {
    title: "Our Heritage of Scholarly Rigour & Ethical Distinction",
    subtitle:
      "Established to provide Federal standard education infused with timeless Islamic values, benchmarked against international Cambridge excellence.",
    content: {
      mission:
        "To inspire an unquenchable thirst for knowledge, critical inquiry, leadership, and unwavering Islamic character in every child.",
      philosophy:
        "Education should prepare students for both worldly success and spiritual fulfillment, grounded in Federal curriculum standards and Islamic principles.",
      principalName: "Alhaji Ahmad Zayyana",
      principalTitle: "Founder & Chairman of Governing Council",
      historyText:
        "Visionary leader with over 30 years of experience in educational development, community service, and institutional governance aligned with Federal standards.",
    },
  };

  const currSec = sections["curriculum"] || {
    title: "Academic Structure & Educational Framework",
    subtitle:
      "A comprehensive educational pathway aligned with Federal Government standards and Cambridge International benchmarks.",
  };

  const progSec = sections["programs"];
  const propSec = sections["proprietress"];
  const leadSec = sections["leadership"];

  const facSec = sections["facilities"] || {
    title: "World-Class Academic Infrastructure & Amenities",
    subtitle:
      "Purposefully centralized within our secured school grounds, our state-of-the-art facilities provide safe, distraction-free learning environments optimized for academic mastery, scientific exploration, and moral discipline without the logistical fragmentation of multiple campuses.",
    content: {
      badge: "School Facilities & Academic Infrastructure",
      items: [
        {
          title: "Ultra-Modern STEM & Computer Labs",
          desc: "Equipped with 100+ high-performance workstations, dedicated high-speed educational network, coding software, and dual science laboratories.",
        },
        {
          title: "Grand Islamic Centre & Central Mosque",
          desc: "A serene central sanctuary dedicated to daily congregational prayers, Friday Khutbahs, and the intensive Hifz Quranic memorization program.",
        },
        {
          title: "Comprehensive Sports & Athletics Arenas",
          desc: "Synthetic turf pitch, basketball courts, badminton areas, and structured physical development arenas designed for student fitness and team building.",
        },
        {
          title: "Smart Digital Classrooms",
          desc: "Interactive 4K digital learning panels, teacher-guided multimedia instruction, and ergonomic learning suites designed for optimal concentration.",
        },
        {
          title: "Healthcare & First-Aid Sanctuary",
          desc: "Qualified resident nursing post providing round-the-clock emergency care, routine health screenings, and comprehensive student welfare support.",
        },
        {
          title: "Hygienic School Cafeteria",
          desc: "Serving wholesome, nutritious, and balanced halal meals prepared fresh daily under rigorous sanitary and clinical health standards.",
        },
      ],
    },
  };

  const feesSec = sections["fees"] || {
    title: "Transparent Investment in Your Child's Future",
    subtitle:
      "Providing unparalleled academic value, certified educators, premium boarding, and lifetime mentorship.",
    content: {
      tiers: [
        {
          title: "Day Scholar (Early Years - SS 3)",
          price: "₦1,850,000 / term",
          features: [
            "Full Cambridge & Federal curriculum",
            "Nutritious lunch & refreshments",
            "STEM labs & robotics clubs",
            "Cambridge & WAEC prep materials",
          ],
        },
        {
          title: "Full Boarding Scholar",
          price: "₦3,250,000 / term",
          features: [
            "Executive en-suite boarding room",
            "5 nutritious meals daily",
            "Evening prep & Quranic mentorship",
            "Full laundry, health clinic & sports complex access",
          ],
        },
      ],
    },
  };

  const testSec = sections["testimonials"] || {
    title: "Voices of Our Distinguished Community",
    subtitle:
      "What esteemed parents, alumni, and educational partners say about their Salamah experience.",
    content: {
      quotes: [
        {
          quote:
            "Salamah transformed my daughter not just into a straight-A Cambridge scholar, but gave her profound humility, Islamic character, and eloquence. She has now been admitted with distinction.",
          author: "Hajiya Maryam Al-Hassan",
          designation: "Executive Director, Federal Ministry of Finance & Parent",
        },
        {
          quote:
            "The personalized attention from the faculty, the 3 digital computer labs, and the disciplined hostel environment are second to none in Northern Nigeria. It is the best investment we made for our sons.",
          author: "Engr. Farouk Bello, FNSE",
          designation: "Managing Director & Salamah Parent",
        },
      ],
    },
  };

  const contactSec = sections["contact"] || {
    title: "Begin Your Child's Journey at Salamah",
    subtitle:
      "Our Admissions Directorate is delighted to assist your family and schedule a private campus tour.",
    content: {
      address: "8 Bindawa Street, Kofar Kaura Layout, Katsina, Katsina State, Nigeria",
      phone1: "+234 803 123 4567",
      email: "info@salamah.edu.ng",
      officeHours: "Monday – Friday: 07:30 AM – 04:30 PM",
    },
  };

  // Fee Calculation
  const feePerChildNaira = feePerChildKobo / 100;
  const totalCalculatedNaira = childrenList.length * feePerChildNaira;

  // Add child input
  function handleAddChild() {
    setChildrenList((prev) => [
      ...prev,
      {
        firstName: "",
        middleName: "",
        lastName: guardianName.trim().split(" ").slice(-1)[0] || "",
        gender: "male",
        dateOfBirth: "2016-01-15",
        intendedClass: "JSS 1",
        previousSchool: "",
        medicalInfo: "",
      },
    ]);
  }

  // Remove child
  function handleRemoveChild(index: number) {
    if (childrenList.length === 1) return;
    setChildrenList((prev) => prev.filter((_, idx) => idx !== index));
  }

  // Update specific child field
  function handleChildChange(index: number, field: keyof ChildEntry, value: string) {
    setChildrenList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  // Submit Application
  async function handleSubmitApplication(e: React.FormEvent) {
    e.preventDefault();
    setAppError(null);

    if (
      !guardianName.trim() ||
      !guardianEmail.trim() ||
      !guardianPhone.trim() ||
      !guardianAddress.trim()
    ) {
      setAppError("Please fill in all guardian contact details.");
      return;
    }

    for (let i = 0; i < childrenList.length; i++) {
      const c = childrenList[i];
      if (!c.firstName.trim() || !c.lastName.trim() || !c.dateOfBirth.trim()) {
        setAppError(`Please fill in required fields for Child #${i + 1}.`);
        return;
      }
    }

    setIsSubmittingApp(true);

    try {
      const res = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardian: {
            name: guardianName.trim(),
            email: guardianEmail.trim().toLowerCase(),
            phone: guardianPhone.trim(),
            address: guardianAddress.trim(),
            occupation: guardianOccupation.trim() || null,
          },
          children: childrenList.map((c) => ({
            firstName: c.firstName.trim(),
            middleName: c.middleName.trim() || null,
            lastName: c.lastName.trim(),
            gender: c.gender,
            dateOfBirth: c.dateOfBirth,
            intendedClass: c.intendedClass,
            previousSchool: c.previousSchool.trim() || null,
            medicalInfo: c.medicalInfo.trim() || null,
          })),
          payment: {
            method: paymentMethod,
            amountKobo: childrenList.length * feePerChildKobo,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Application submission failed.");
      }

      setSubmissionSuccess({
        applicationNumber: data.applicationNumber,
        totalFeeKobo: data.totalFeeKobo,
        paymentReference: data.paymentReference,
        numberOfChildren: data.numberOfChildren,
      });
    } catch (err: unknown) {
      setAppError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setIsSubmittingApp(false);
    }
  }

  // Quick Sign In from Modal
  async function handleQuickSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSignInError(null);
    setIsSigningIn(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (res.ok && data.redirectTo) {
        window.location.href = data.redirectTo;
      } else {
        setSignInError(data.error || "Authentication failed. Check credentials.");
      }
    } catch {
      setSignInError("Connection failed. Please retry.");
    } finally {
      setIsSigningIn(false);
    }
  }

  // Compute User Initials
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .filter(Boolean)
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : currentUser?.email?.charAt(0).toUpperCase() || "SA";

  return (
    <div className="min-h-screen bg-[#031520] text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* 1. LUXURY TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 border-b border-teal-500/15 bg-[#031520]/95 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo & School Title — using favicon as requested */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 flex items-center justify-center">
              <Image
                src={brand.assets.favicon}
                alt="Salamah"
                width={44}
                height={44}
                priority
                className="h-full w-auto object-contain"
              />
            </div>
            <div>
              <span className="font-display text-xl font-black tracking-tight text-white">
                Salamah
              </span>
              <p className="text-[9px] font-bold tracking-[0.24em] text-teal-400 uppercase">
                International School • Katsina
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#about" className="hover:text-teal-300 transition">About &amp; Vision</a>
            <a href="#academics" className="hover:text-teal-300 transition">Academics</a>
            <a href="#programs" className="hover:text-teal-300 transition">Programs</a>
            <a href="#leadership" className="hover:text-teal-300 transition">Leadership</a>
            <a href="#facilities" className="hover:text-teal-300 transition">Facilities</a>
            <a href="#contact" className="hover:text-teal-300 transition">Contact</a>
          </nav>

          {/* Account Toggle Circle & Enrol Child Button */}
          <div className="flex items-center gap-3">
            {/* CIRCULAR ACCOUNT LOGIN BUTTON — circle with logged in user name initial */}
            <button
              onClick={() => setAccountModalOpen(true)}
              className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition shadow-lg hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
              aria-label="Account Login"
              title={
                currentUser
                  ? `Logged in: ${currentUser.name || currentUser.email} (${currentUser.role})`
                  : "Institutional Account Login"
              }
            >
              {currentUser ? (
                currentUser.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name || currentUser.email}
                    className="h-full w-full rounded-full object-cover border-2 border-[#dfba73] shadow-[0_0_12px_rgba(223,186,115,0.45)]"
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-[#28a38e] via-teal-600 to-[#dfba73] border-2 border-[#dfba73] flex items-center justify-center font-black text-slate-950 text-xs sm:text-sm font-mono shadow-[0_0_14px_rgba(223,186,115,0.45)]">
                    {userInitials}
                  </div>
                )
              ) : (
                <div className="h-full w-full rounded-full border-2 border-teal-500/50 bg-teal-950/80 flex items-center justify-center text-teal-300 hover:border-[#dfba73] hover:text-[#dfba73] transition shadow-md">
                  <User className="h-5 w-5" />
                </div>
              )}

              {/* Active Status Beacon Dot */}
              {currentUser && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#031520] shadow-sm" />
              )}
            </button>

            {/* Enrol Child Button opening the Enrollment Popup Modal */}
            <button
              onClick={() => setEnrollmentModalOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-teal-500/20 hover:brightness-110 transition cursor-pointer"
            >
              <span>Enrol Child</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="p-1.5 text-slate-400 hover:text-white lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mt-3 rounded-2xl border border-slate-800 bg-[#041d2c] p-4 lg:hidden space-y-3 text-sm">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">About &amp; Vision</a>
            <a href="#academics" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">Academics</a>
            <a href="#programs" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">Programs</a>
            <a href="#leadership" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">Leadership</a>
            <a href="#facilities" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">Facilities</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300">Contact</a>
            <div className="pt-2 border-t border-slate-700 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setEnrollmentModalOpen(true);
                }}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 py-2 text-xs font-bold text-slate-950"
              >
                Enrol Child Now
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAccountModalOpen(true);
                }}
                className="w-full rounded-xl bg-teal-950 border border-teal-500/40 py-2 text-xs font-bold text-teal-300"
              >
                {currentUser ? "Open Account Menu" : "Sign In to Account"}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. REPLICATED 3D ROTATING SHIELD HERO SECTION
          - Reduced space: 30% of original
          - Generous clearance (mb-12 sm:mb-14) so circling lines NEVER touch the badge
          - Circling lines: NOT full (broken arcs with strokeDasharray) rotating in opposite directions
          - One line is thicker (3.5px gold), one is thinner (1.5px teal)
          - Favicon used as the animated logo
          - Motto bolder above hero text
          - ONLY "Enrol Your Child Now" button */}
      <section id="hero" className="relative min-h-[92svh] w-full flex items-center justify-center overflow-hidden pt-2 sm:pt-4 pb-12">
        {/* Slideshow Background (5 Authentic Pictures - Optimized) */}
        <div className="hero-slideshow" aria-hidden="true">
          <div
            className="hero-slide"
            style={{
              backgroundImage: `url('${optImg("https://res.cloudinary.com/djkudkxmx/image/upload/v1764673906/DSC_0227_vpfvkk.jpg", 1400)}')`,
            }}
          />
          <div
            className="hero-slide"
            style={{
              backgroundImage: `url('${optImg("https://res.cloudinary.com/djkudkxmx/image/upload/v1764673926/DSC_0299_obgakh.jpg", 1400)}')`,
            }}
          />
          <div
            className="hero-slide"
            style={{
              backgroundImage: `url('${optImg("https://res.cloudinary.com/djkudkxmx/image/upload/v1764673886/DSC_0184_rnwrjk.jpg", 1400)}')`,
            }}
          />
          <div
            className="hero-slide"
            style={{
              backgroundImage: `url('${optImg("https://res.cloudinary.com/djkudkxmx/image/upload/v1764673855/DSC_0126_nynie5.jpg", 1400)}')`,
            }}
          />
          <div
            className="hero-slide"
            style={{
              backgroundImage: `url('${optImg("https://res.cloudinary.com/djkudkxmx/image/upload/v1764673842/DSC_0110_l7fzri.jpg", 1400)}')`,
            }}
          />
        </div>

        {/* Deep dark edge bleed & vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#031520]/90 via-[#031520]/65 to-[#031520] pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,21,32,0.55)_60%,rgba(3,21,32,0.95)_100%)] pointer-events-none z-[1]" />

        {/* Central Content Wrap with reduced 30% top space */}
        <div className="hero-content-wrap relative z-10 w-full px-4 sm:px-6">
          <div className="hero-content-card mx-auto">
            {/* Enlarged 3D Rotating Crest with Broken Circling Arcs in Opposite Directions */}
            <div className="salamah-hero-logo" aria-label="Salamah International School">
              <div className="salamah-shield-stage">
                {/* SVG Circling Broken Lines (NOT full, rotating in opposite directions, one thicker than the other) */}
                <svg
                  className="absolute inset-[-14px] sm:inset-[-18px] w-[calc(100%+28px)] sm:w-[calc(100%+36px)] h-[calc(100%+28px)] sm:h-[calc(100%+36px)] pointer-events-none"
                  viewBox="0 0 360 360"
                  aria-hidden="true"
                >
                  {/* Thicker golden broken arc (3.5px) spinning clockwise */}
                  <circle
                    cx="180"
                    cy="180"
                    r="162"
                    fill="none"
                    stroke="#dfba73"
                    strokeWidth="3.5"
                    strokeDasharray="260 70 170 80"
                    strokeLinecap="round"
                    className="salamah-svg-ring-gold"
                  />
                  {/* Thinner blue-green broken arc (1.5px) spinning counter-clockwise in opposite direction */}
                  <circle
                    cx="180"
                    cy="180"
                    r="172"
                    fill="none"
                    stroke="#28a38e"
                    strokeWidth="1.5"
                    strokeDasharray="190 90 140 100"
                    strokeLinecap="round"
                    className="salamah-svg-ring-teal"
                  />
                </svg>

                {/* Ambient Radial Glow */}
                <div className="salamah-shield-glow" aria-hidden="true" />

                {/* Animated Logo using Favicon */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.assets.favicon}
                  alt="Salamah International School Crest"
                  className="salamah-shield mx-auto h-auto w-[230px] sm:w-[290px]"
                  width={290}
                  height={290}
                />
              </div>

              {/* Major & Minor Noble Heading Reveal */}
              <h1 className="salamah-motto">
                <span className="salamah-major">SALAMAH</span>
                <span className="salamah-minor">INTERNATIONAL SCHOOL</span>
                <span className="salamah-underline-reveal" aria-hidden="true">
                  <svg className="salamah-underline" viewBox="0 0 460 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 11 C 95 3, 230 19, 457 11" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
            </div>

            {/* School Motto Bolder Above the Hero Text (DB Driven) */}
            <div className="mt-5 space-y-2 text-center max-w-3xl mx-auto">
              <p className="font-serif text-lg sm:text-2xl font-black tracking-wide text-[#dfba73] uppercase drop-shadow-md">
                {(heroSec.content as Record<string, string>)?.motto || "Learning for Peaceful Co-existence"}
              </p>
              <p className="font-sans text-sm sm:text-base font-normal text-slate-200 leading-relaxed drop-shadow-sm max-w-2xl mx-auto">
                {heroSec.subtitle || "Welcome to Salamah International School, Nigeria's premier private academy delivering Cambridge International & Nigerian curricula."}
              </p>
            </div>

            {/* Hero CTA — ONLY "Enrol Your Child Now" button (Golden) */}
            <div className="hero-cta mt-7 flex items-center justify-center">
              <button
                onClick={() => setEnrollmentModalOpen(true)}
                className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-[#dfba73] px-9 py-4 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-110 transition scale-100 hover:scale-105 cursor-pointer"
              >
                <span>{(heroSec.content as Record<string, string>)?.ctaPrimaryText || "Enrol Your Child Now"}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Metrics Grid with Smoothly Animated Numbers (DB Driven) */}
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-4xl w-full">
              {(((heroSec.content as Record<string, unknown>)?.highlights as { value: string; label: string }[]) || [
                { value: "30+", label: "Years of Academic Distinction" },
                { value: "2,850+", label: "Distinguished Scholars Enrolled" },
                { value: "98%", label: "Cambridge & WAEC Examination Pass Rate" },
                { value: "247", label: "Accredited Faculty & Educators" },
              ]).map((item, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-amber-500/20 bg-slate-950/70 p-4 backdrop-blur-md shadow-lg text-center"
                >
                  <p className="font-display text-2xl sm:text-3xl font-black text-amber-300">
                    <AnimatedNumber value={item.value} />
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-300 leading-snug">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Scroll Cue */}
        <a href="#about" className="hero-scroll-cue">
          <span>Explore Salamah</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </section>

      {/* 3. ABOUT & FOUNDER'S VISION SECTION */}
      <section id="about" className="py-24 bg-[#031520] relative border-t border-teal-500/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 uppercase tracking-widest">
                Our Heritage &amp; Philosophy
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl leading-tight">
                {aboutSec.title}
              </h2>
              <p className="mt-4 text-base text-slate-300 leading-relaxed font-sans">
                {aboutSec.subtitle}
              </p>

              <div className="mt-8 space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="rounded-2xl border border-teal-500/20 bg-[#062030] p-5 shadow-md">
                  <strong className="text-teal-300 text-sm block mb-1">Our Mission:</strong>
                  {(aboutSec.content as Record<string, string>)?.mission ||
                    "To inspire an unquenchable thirst for knowledge, critical inquiry, leadership, and unwavering Islamic character in every child."}
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-[#062030] p-5 shadow-md">
                  <strong className="text-amber-300 text-sm block mb-1">Our Educational Philosophy:</strong>
                  &quot;Education should prepare students for both worldly success and spiritual fulfillment, grounded in Federal curriculum standards and Islamic principles.&quot;
                </div>
              </div>
            </div>

            {/* Founder & Chairman Card with Authentic Picture */}
            <div className="rounded-3xl border border-[#c5a059]/40 bg-gradient-to-br from-[#062030] to-[#041624] p-6 sm:p-8 shadow-2xl relative">
              <div className="relative h-72 sm:h-80 w-full overflow-hidden rounded-2xl border border-[#c5a059]/30 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optImg("https://res.cloudinary.com/djkudkxmx/image/upload/v1764673927/DSC_0347_xj7qct.jpg", 800)}
                  alt="Alhaji Ahmad Zayyana"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 rounded-full bg-gradient-to-r from-teal-500 to-amber-400 px-3 py-1 text-[10px] font-bold text-slate-950 uppercase tracking-wider shadow-lg">
                  Founder &amp; Chairman
                </div>
              </div>

              <h3 className="font-display text-2xl font-bold text-white">Alhaji Ahmad Zayyana</h3>
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mt-0.5">
                Founder &amp; Chairman of Governing Council
              </p>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Visionary leader with over 30 years of experience in educational development, community service, and institutional governance aligned with Federal standards.
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 text-center">
                <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800">
                  <p className="font-display text-lg font-bold text-teal-300">
                    <AnimatedNumber value="30+" />
                  </p>
                  <p className="text-[10px] text-slate-400">Years Experience</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800">
                  <p className="font-display text-lg font-bold text-amber-300">
                    <AnimatedNumber value="5" />
                  </p>
                  <p className="text-[10px] text-slate-400">Institutions</p>
                </div>
                <div className="rounded-xl bg-slate-950/60 p-2 border border-slate-800">
                  <p className="font-display text-lg font-bold text-emerald-400">
                    <AnimatedNumber value="1000+" />
                  </p>
                  <p className="text-[10px] text-slate-400">Scholarships</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACADEMIC STRUCTURE (NURSERY, PRIMARY, SECONDARY) */}
      <section id="academics" className="py-24 bg-[#041a27] relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 uppercase tracking-widest">
              Federal Curriculum Standard
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl">
              Academic Structure
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              A comprehensive educational framework aligned with Federal Government standards and international benchmarks.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* Early Years / Nursery */}
            <div className="rounded-3xl border border-teal-500/20 bg-[#062030] p-8 shadow-xl flex flex-col justify-between hover:border-teal-400/40 transition">
              <div>
                <div className="h-14 w-14 rounded-2xl bg-teal-500/15 flex items-center justify-center text-teal-300 mb-6">
                  <Sparkles className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-teal-500/20 px-3 py-1 text-[11px] font-bold text-teal-300">
                  Ages 2 – 5
                </span>
                <h3 className="mt-3 font-display text-2xl font-bold text-white">
                  Early Years Foundation
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-300">
                  Federal-approved early childhood education focusing on holistic development, foundational Islamic values, and creative exploration through play-based learning.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span>Montessori-inspired Curriculum</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span>Quranic Memorization Program</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span>Sensory &amp; Motor Skill Development</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setEnrollmentModalOpen(true)}
                className="mt-8 w-full rounded-xl border border-teal-500/40 bg-teal-950/40 py-2.5 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition cursor-pointer"
              >
                Enrol for Nursery
              </button>
            </div>

            {/* Primary Education */}
            <div className="rounded-3xl border border-amber-500/30 bg-[#072439] p-8 shadow-2xl flex flex-col justify-between relative hover:border-amber-400/50 transition">
              <div className="absolute top-4 right-4 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[9px] font-bold text-amber-300 uppercase">
                Core Foundation
              </div>
              <div>
                <div className="h-14 w-14 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-300 mb-6">
                  <BookOpen className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300">
                  Grades 1 – 6
                </span>
                <h3 className="mt-3 font-display text-2xl font-bold text-white">
                  Primary Education
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-300">
                  National Curriculum integrated with Cambridge Primary, emphasizing character building, academic excellence, and technological literacy.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>Cambridge Primary Framework</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>Comprehensive Islamic Studies</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>STEM Foundation &amp; Robotics</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setEnrollmentModalOpen(true)}
                className="mt-8 w-full rounded-xl bg-gradient-to-r from-amber-400 to-[#dfba73] py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 transition shadow-md cursor-pointer"
              >
                Enrol for Primary
              </button>
            </div>

            {/* Secondary Education */}
            <div className="rounded-3xl border border-teal-500/20 bg-[#062030] p-8 shadow-xl flex flex-col justify-between hover:border-teal-400/40 transition">
              <div>
                <div className="h-14 w-14 rounded-2xl bg-teal-500/15 flex items-center justify-center text-teal-300 mb-6">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <span className="rounded-full bg-teal-500/20 px-3 py-1 text-[11px] font-bold text-teal-300">
                  Grades 7 – 12 (JSS 1 – SS 3)
                </span>
                <h3 className="mt-3 font-display text-2xl font-bold text-white">
                  Secondary Education
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-slate-300">
                  Advanced preparation for WAEC, NECO, and Cambridge IGCSE with university pathway programs and comprehensive career counseling.
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span>Dual IGCSE &amp; WAEC Curricula</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span>University Preparation Program</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span>Career Guidance &amp; Mentorship</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setEnrollmentModalOpen(true)}
                className="mt-8 w-full rounded-xl border border-teal-500/40 bg-teal-950/40 py-2.5 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition cursor-pointer"
              >
                Enrol for Secondary
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INTEGRATED LEARNING PROGRAMS (With Authentic Pictures) */}
      <section id="programs" className="py-24 bg-[#031520] relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 uppercase tracking-widest">
              Comprehensive Programs
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl">
              {progSec?.title || "Integrated Learning Programs"}
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
              {progSec?.subtitle || "Federal-approved programs combining academic excellence with moral values and modern technology."}
            </p>
          </div>

          <div className="mt-16 space-y-16">
            {/* Program 1: Academic Excellence */}
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-3xl border border-teal-500/30 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optImg("https://res.cloudinary.com/djkudkxmx/image/upload/v1764673926/DSC_0299_obgakh.jpg", 800)}
                  alt="Academic Excellence Program"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div>
                <span className="rounded-full bg-teal-500/20 px-3 py-1 text-[11px] font-bold text-teal-300 uppercase">
                  Program 01 • Academic Excellence
                </span>
                <h3 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-white">
                  Federal Curriculum &amp; Cambridge Distinction
                </h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Our academic program is fully aligned with Federal Ministry of Education standards, enhanced by Cambridge International curriculum to provide world-class education while maintaining strong Islamic values.
                </p>

                <div className="mt-6 space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-3 rounded-xl bg-[#062030] p-3 border border-slate-800">
                    <CheckCircle className="h-5 w-5 text-teal-400 shrink-0" />
                    <span><strong>Federal Accreditation:</strong> Fully accredited by Federal Ministry of Education.</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-[#062030] p-3 border border-slate-800">
                    <CheckCircle className="h-5 w-5 text-teal-400 shrink-0" />
                    <span><strong>Cambridge International:</strong> IGCSE and Cambridge Primary certification.</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-[#062030] p-3 border border-slate-800">
                    <CheckCircle className="h-5 w-5 text-teal-400 shrink-0" />
                    <span><strong>Quality Assurance:</strong> Top 5% globally in IGCSE examination results.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Program 2: Digital Literacy & STEM */}
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div className="order-2 lg:order-1">
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300 uppercase">
                  Program 02 • Digital Innovation
                </span>
                <h3 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-white">
                  Digital Literacy, STEM &amp; Computer Labs
                </h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Preparing students for the modern technological age with 3 state-of-the-art computer labs, coding workshops, and STEM programs aligned with national educational standards.
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl border border-teal-500/20 bg-[#062030] p-4">
                    <p className="font-display text-2xl font-bold text-teal-300">
                      <AnimatedNumber value="3" />
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Computer Labs</p>
                  </div>
                  <div className="rounded-2xl border border-amber-500/20 bg-[#062030] p-4">
                    <p className="font-display text-2xl font-bold text-amber-300">
                      <AnimatedNumber value="100+" />
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Workstations</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-[#062030] p-4">
                    <p className="font-display text-2xl font-bold text-emerald-300">24/7</p>
                    <p className="text-[10px] text-slate-400 mt-1">Campus WiFi</p>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2 relative h-72 sm:h-96 w-full overflow-hidden rounded-3xl border border-amber-500/30 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optImg("https://res.cloudinary.com/djkudkxmx/image/upload/v1764673886/DSC_0184_rnwrjk.jpg", 800)}
                  alt="Digital Literacy and STEM"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Program 3: Islamic Studies & Quran Memorization */}
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div className="relative h-72 sm:h-96 w-full overflow-hidden rounded-3xl border border-teal-500/30 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optImg("https://res.cloudinary.com/djkudkxmx/image/upload/v1764673855/DSC_0126_nynie5.jpg", 800)}
                  alt="Islamic Studies and Quran Memorization"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div>
                <span className="rounded-full bg-teal-500/20 px-3 py-1 text-[11px] font-bold text-teal-300 uppercase">
                  Program 03 • Islamic Moral Leadership
                </span>
                <h3 className="mt-3 font-display text-2xl sm:text-3xl font-bold text-white">
                  Islamic Values, Ethics &amp; Hifz Program
                </h3>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Our Islamic studies program integrates Quran memorization, Islamic history, and character development within the Federal educational framework, nurturing scholars who excel academically while maintaining deep spiritual grounding.
                </p>

                <div className="mt-6 space-y-3 text-xs text-slate-300">
                  <div className="rounded-xl bg-[#062030] p-4 border border-slate-800">
                    <strong className="text-teal-300 text-sm block mb-1">Quran Memorization (Hifz):</strong>
                    Structured Hifz program with certified teachers and daily tajweed recitation.
                  </div>
                  <div className="rounded-xl bg-[#062030] p-4 border border-slate-800">
                    <strong className="text-amber-300 text-sm block mb-1">Character Building &amp; Adab:</strong>
                    Imparting Islamic etiquette, truthfulness, and community leadership in service of humanity.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DEDICATED SEPARATE SECTION FOR THE PROPRIETRESS (Hajiya Asma'u Zayyana) */}
      <section id="proprietress" className="py-28 bg-gradient-to-b from-[#031520] via-[#041d2e] to-[#031520] relative border-y border-[#dfba73]/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(223,186,115,0.08),transparent_70%)] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="rounded-full border border-amber-400/40 bg-amber-950/60 px-4 py-1.5 text-xs font-bold text-amber-300 uppercase tracking-widest shadow-lg">
              {(propSec?.content as Record<string, string>)?.badge || "Office of the Proprietress"}
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-5xl font-black text-white leading-tight">
              {propSec?.title || "Pioneering Female Academic Leadership & Moral Excellence"}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              {propSec?.subtitle || "Dedicated leadership cultivating dignity, academic brilliance, and holistic character for the next generation of distinguished women leaders."}
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-12 items-center">
            {/* Left Column: Prestigious Portrait of the Proprietress (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-md rounded-3xl border-2 border-[#dfba73]/40 bg-gradient-to-b from-[#08293d] to-[#031520] p-4 shadow-[0_0_35px_rgba(223,186,115,0.2)]">
                <div className="relative h-[430px] sm:h-[480px] w-full overflow-hidden rounded-2xl border border-[#dfba73]/30 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={optImg("https://res.cloudinary.com/djkudkxmx/image/upload/v1764673875/DSC_0134_ytpexf.jpg", 700)}
                    alt="Hajiya Asma'u Zayyana"
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020d17]/85 via-transparent to-transparent" />
                  
                  {/* Gold Filigree Badge */}
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="font-display text-2xl font-black text-white">
                      {(propSec?.content as Record<string, string>)?.name || "Hajiya Asma'u Zayyana"}
                    </p>
                    <p className="text-xs font-bold text-[#dfba73] uppercase tracking-wider mt-0.5">
                      {(propSec?.content as Record<string, string>)?.role || "Proprietress"}
                    </p>
                    <p className="text-[10px] text-slate-300 italic mt-1">
                      {(propSec?.content as Record<string, string>)?.titleTag || "Pioneer in Girls' Education • Moral Education Authority"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quoted Manifesto & Strategic Pastoral Pillars (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Manifesto Quote Box */}
              <div className="rounded-3xl border border-amber-400/30 bg-[#072439]/80 p-8 shadow-2xl relative">
                <Quote className="h-10 w-10 text-amber-400/30 mb-3" />
                <blockquote className="font-sans text-base sm:text-lg leading-relaxed text-slate-100 italic">
                  &quot;{(propSec?.content as Record<string, string>)?.quote || "When a daughter of our society is endowed with profound moral anchors and world-class scientific intellect, she becomes a source of boundless tranquility, wisdom, and righteous leadership for future generations. At Salamah, we do not merely educate young women; we cultivate the pious custodians of humanity."}&quot;
                </blockquote>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white block font-display">
                      {(propSec?.content as Record<string, string>)?.name || "Hajiya Asma'u Zayyana"}
                    </strong>
                    <span className="text-amber-300 font-semibold text-[11px]">
                      {(propSec?.content as Record<string, string>)?.directorate || "Directorate of the Proprietress"}
                    </span>
                  </div>
                  <span className="rounded-lg bg-teal-950 px-3 py-1 border border-teal-500/30 text-[10px] text-teal-300 font-mono">
                    {(propSec?.content as Record<string, string>)?.educatorId || "Federal Educator #EDU-742"}
                  </span>
                </div>
              </div>

              {/* 3 Strategic Pillars of the Proprietress */}
              <div className="grid gap-4 sm:grid-cols-3">
                {(((propSec?.content as Record<string, unknown>)?.pillars as Array<{ title: string; desc: string; tag: string }>) || [
                  {
                    title: "Pastoral Sanctuary",
                    desc: "Structured spiritual circles, female mentoring, and compassionate emotional guidance.",
                    tag: "Character First",
                  },
                  {
                    title: "Women in STEM",
                    desc: "Intensive track record preparing female scholars for medicine, AI, coding, and engineering.",
                    tag: "Future Pioneers",
                  },
                  {
                    title: "Quranic Eloquence",
                    desc: "Comprehensive Tajweed, Hifz, and public oratory programs grounded in modesty.",
                    tag: "Spiritual Mastery",
                  },
                ]).map((pillar, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-teal-500/25 bg-[#062030] p-5 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-10 w-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300 mb-3">
                        {idx === 1 ? (
                          <Award className="h-5 w-5 text-amber-300" />
                        ) : idx === 2 ? (
                          <Sparkles className="h-5 w-5" />
                        ) : (
                          <HeartHandshake className="h-5 w-5" />
                        )}
                      </div>
                      <h3 className="font-display font-bold text-white text-sm">{pillar.title}</h3>
                      <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
                        {pillar.desc}
                      </p>
                    </div>
                    <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mt-4">
                      {pillar.tag}
                    </p>
                  </div>
                ))}
              </div>

              {/* Direct Metrics Ribbon */}
              <div className="rounded-2xl border border-slate-800 bg-[#020e17] p-4 grid grid-cols-3 gap-3 text-center">
                {(((propSec?.content as Record<string, unknown>)?.metrics as Array<{ value: string; label: string }>) || [
                  { value: "1,200+", label: "Female Scholars Graduated" },
                  { value: "100%", label: "University Placement Rate" },
                  { value: "15+", label: "National Academic Awards" },
                ]).map((item, idx) => (
                  <div key={idx}>
                    <p className="font-display text-2xl font-black text-amber-300">
                      <AnimatedNumber value={item.value} />
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SCHOOL ADMINISTRATIVE LEADERSHIP (Subordinated Executive Administration) */}
      <section id="leadership" className="py-24 bg-[#031520] relative border-t border-teal-500/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 uppercase tracking-widest">
              {(leadSec?.content as Record<string, string>)?.badge || "Executive School Administration"}
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl">
              {leadSec?.title || "Distinguished School Leadership"}
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed font-sans">
              {leadSec?.subtitle || "Operating under the stewardship of the Proprietress, our executive officers ensure rigorous academic standards, student pastoral growth, and fiscal excellence."}
            </p>
          </div>

          {/* 4 Executive Officers in Exact Sequence: Principal, Vice Principal, Headmistress, Accountant (DB Driven) */}
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {(((leadSec?.content as Record<string, unknown>)?.officers as Array<{
              name: string;
              role: string;
              badge: string;
              directorate: string;
              desc: string;
              tags: string[];
            }>) || [
              {
                name: "Mr. Ahmed Bogunmbe",
                role: "Principal & Chief Academic Officer",
                badge: "Executive Principal",
                directorate: "Directorate of Academic Standards",
                desc: "Leading Cambridge Assessment International Education moderation, Federal curriculum standards, and faculty supervision for secondary education.",
                tags: ["Cambridge Certified", "TRCN Fellow"],
              },
              {
                name: "Hajiya Maryam Zayyana",
                role: "Vice Principal & Academic Administrator",
                badge: "Vice Principal",
                directorate: "Academic Welfare & Administration",
                desc: "Directing student pastoral welfare, faculty coordination across STEM and humanities, and academic synergy upholding moral excellence.",
                tags: ["Pastoral Care Lead", "Faculty Synergist"],
              },
              {
                name: "Hajiya Fatima Zayyana",
                role: "Headmistress (Primary & Early Years)",
                badge: "Headmistress",
                directorate: "Primary & Early Years Directorate",
                desc: "Directing foundational Montessori methodologies, early childhood cognitive development, and structured Quranic phonetic literacy.",
                tags: ["Montessori Director", "Early Foundation"],
              },
              {
                name: "Arch Sani Sule Mashi",
                role: "School Accountant & Bursar",
                badge: "School Accountant",
                directorate: "Financial Directorate & Bursary",
                desc: "Overseeing institutional fiscal governance, student welfare accounts, statutory audit integrity, and transparent resource allocation.",
                tags: ["Financial Controller", "Audit & Compliance"],
              },
            ]).map((officer, i) => {
              const photos = [
                "https://res.cloudinary.com/djkudkxmx/image/upload/v1764673868/DSC_0152_qjtqb7.jpg",
                "https://res.cloudinary.com/djkudkxmx/image/upload/v1764673865/DSC_0146_wbxrpw.jpg",
                "https://res.cloudinary.com/djkudkxmx/image/upload/v1764673919/DSC_0268_dghqbl.jpg",
                "https://res.cloudinary.com/djkudkxmx/image/upload/v1764673861/DSC_0132_kpjdgc.jpg",
              ];
              const badgeColors = [
                "bg-teal-500 text-slate-950",
                "bg-amber-400 text-slate-950",
                "bg-teal-500 text-slate-950",
                "bg-emerald-400 text-slate-950",
              ];
              const dirColors = [
                "text-teal-400",
                "text-amber-300",
                "text-teal-400",
                "text-emerald-400",
              ];

              return (
                <div
                  key={i}
                  className="group rounded-3xl border border-slate-800 bg-gradient-to-b from-[#062030] to-[#031520] p-5 shadow-xl hover:border-teal-500/40 transition duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-slate-700/80 mb-4 shadow-md bg-slate-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={optImg(photos[i % photos.length], 600)}
                        alt={officer.name}
                        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className={`absolute top-2 left-2 rounded-full px-3 py-0.5 text-[9px] font-bold uppercase shadow ${badgeColors[i % badgeColors.length]}`}>
                        {officer.badge}
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold tracking-wider uppercase ${dirColors[i % dirColors.length]}`}>
                      {officer.directorate}
                    </span>
                    <h4 className="mt-1 font-display text-lg font-bold text-white">
                      {officer.name}
                    </h4>
                    <p className="text-xs font-semibold text-amber-300">
                      {officer.role}
                    </p>
                    <p className="mt-2.5 text-[11px] text-slate-300 leading-relaxed">
                      {officer.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap gap-1.5 text-[9px] font-bold text-teal-300">
                    {officer.tags.map((t, tidx) => (
                      <span key={tidx} className="rounded bg-teal-950 px-2 py-0.5 border border-teal-500/30">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. STATE-OF-THE-ART FACILITIES */}
      <section id="facilities" className="py-24 bg-[#041a27] relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 uppercase tracking-widest">
              {(facSec.content as Record<string, string>)?.badge || "School Facilities & Academic Infrastructure"}
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl">
              {facSec.title}
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
              {facSec.subtitle}
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {((facSec.content as Record<string, unknown>)?.items as { title: string; desc: string }[] || []).map((fac, i) => (
              <div
                key={i}
                className="rounded-3xl border border-teal-500/15 bg-gradient-to-br from-[#062030] to-[#041624] p-6 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/20 text-teal-300">
                    <Building className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">{fac.title}</h3>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-300">
                  {fac.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. TUITION & FEES SECTION */}
      <section id="fees" className="py-24 bg-[#031520] relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 uppercase tracking-widest">
              Tuition &amp; Investment
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl">
              {feesSec.title}
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              {feesSec.subtitle}
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {((feesSec.content as Record<string, unknown>)?.tiers as { title: string; price: string; features: string[] }[] || []).map((tier, i) => (
              <div
                key={i}
                className="rounded-3xl border border-teal-500/30 bg-[#072235] p-8 shadow-2xl flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display text-xl font-bold text-white">{tier.title}</h3>
                  <p className="mt-4 font-display text-3xl font-black text-teal-300">{tier.price}</p>
                  <ul className="mt-6 space-y-3 text-xs text-slate-300">
                    {tier.features?.map((f, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setEnrollmentModalOpen(true)}
                  className="mt-8 block w-full rounded-xl bg-teal-500 py-3 text-center text-xs font-bold text-slate-950 hover:bg-teal-400 transition cursor-pointer"
                >
                  Apply for this Programme
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. TESTIMONIALS */}
      <section id="testimonials" className="py-24 bg-[#041a27] relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 uppercase tracking-widest">
              Community Voices
            </span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-5xl">
              {testSec.title}
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              {testSec.subtitle}
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 max-w-5xl mx-auto">
            {((testSec.content as Record<string, unknown>)?.quotes as { quote: string; author: string; designation: string }[] || []).map((q, i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-800 bg-[#062030] p-8 shadow-xl flex flex-col justify-between"
              >
                <blockquote className="font-sans text-base leading-relaxed text-slate-200 italic">
                  &quot;{q.quote}&quot;
                </blockquote>
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <h4 className="font-display font-bold text-white text-sm">{q.author}</h4>
                  <p className="text-xs text-teal-400">{q.designation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. CONTACT & ACCREDITATIONS */}
      <section id="contact" className="py-24 bg-[#031520] relative border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 uppercase tracking-widest">
                Campus Headquarters
              </span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-white sm:text-4xl">
                {contactSec.title}
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {contactSec.subtitle}
              </p>

              <div className="mt-8 space-y-4 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-teal-400 shrink-0" />
                  <span>{(contactSec.content as Record<string, string>)?.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-teal-400 shrink-0" />
                  <span>{(contactSec.content as Record<string, string>)?.phone1}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-teal-400 shrink-0" />
                  <span>{(contactSec.content as Record<string, string>)?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-teal-400 shrink-0" />
                  <span>{(contactSec.content as Record<string, string>)?.officeHours}</span>
                </div>
              </div>
            </div>

            {/* Official Accreditation Badges */}
            <div className="rounded-3xl border border-teal-500/30 bg-[#072031] p-8 flex flex-col justify-center">
              <p className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">
                Accreditations &amp; Examination Authority
              </p>
              <h3 className="mt-2 font-display text-xl font-bold text-white">
                Officially Accredited Federal &amp; International Academy
              </h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Accredited by the Federal Ministry of Education and Cambridge Assessment International Education (NG482). WAEC and NECO registered examination centre.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-bold text-teal-300">
                <span className="rounded-lg bg-teal-950 px-3 py-1 border border-teal-500/30">Cambridge International NG482</span>
                <span className="rounded-lg bg-teal-950 px-3 py-1 border border-teal-500/30">WAEC Centre #04812</span>
                <span className="rounded-lg bg-teal-950 px-3 py-1 border border-teal-500/30">FME/KTS/1998/045</span>
                <span className="rounded-lg bg-teal-950 px-3 py-1 border border-teal-500/30">State Code: KTS-EDU-045</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FOOTER — using transparent favicon without background wrapper */}
      <footer className="border-t border-slate-800 bg-[#020e16] py-12 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
              <Image
                src={brand.assets.favicon}
                alt="Salamah"
                width={40}
                height={40}
                className="h-full w-auto object-contain"
              />
            </div>
            <div>
              <p className="font-display font-bold text-white">Salamah International School</p>
              <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                Learning for Peaceful Co-existence • Katsina State, Nigeria
              </p>
            </div>
          </div>

          <p className="text-center text-slate-500">
            © 1995–{new Date().getFullYear()} Salamah International School, Katsina. All Rights Reserved. Stored in Neon Cloud DB.
          </p>

          <button
            onClick={() => setAccountModalOpen(true)}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Management Login
          </button>
        </div>
      </footer>

      {/* POPUP MODAL: GUARDIAN & SCHOLAR ENROLLMENT APPLICATION */}
      {enrollmentModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 p-3 sm:p-6 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEnrollmentModalOpen(false);
          }}
        >
          <div className="relative my-auto flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-teal-500/40 bg-[#072031] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 shrink-0 bg-[#051724]">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">
                  Direct Online Admissions • 2026/2027 Session
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                  Guardian &amp; Scholar Enrollment Application
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Register one or more scholars under your family account with instant fee calculation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnrollmentModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 salamah-scrollbar">

            {submissionSuccess ? (
              /* Printable Success Slip */
              <div className="mt-6 rounded-3xl border border-emerald-500/40 bg-[#08293d] p-8 text-center shadow-2xl">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="mt-4 font-display text-2xl font-bold text-white">
                  Application Submitted &amp; Payment Confirmed!
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  Your admission application has been successfully recorded in the Salamah central database.
                </p>

                <div className="mt-6 inline-block rounded-2xl border border-teal-500/30 bg-slate-900/80 p-5 text-left text-xs space-y-2">
                  <p>
                    <span className="text-slate-400">Official Application Number: </span>
                    <strong className="text-teal-300 font-mono text-sm">
                      {submissionSuccess.applicationNumber}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Payment Reference: </span>
                    <span className="font-mono text-slate-200">
                      {submissionSuccess.paymentReference}
                    </span>
                  </p>
                  <p>
                    <span className="text-slate-400">Total Children Registered: </span>
                    <strong className="text-white">
                      {submissionSuccess.numberOfChildren} Scholar(s)
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Application Fee Paid: </span>
                    <strong className="text-emerald-400 text-sm" suppressHydrationWarning>
                      ₦{formatNaira(submissionSuccess.totalFeeKobo / 100)}
                    </strong>
                  </p>
                </div>

                <div className="mt-8 flex justify-center gap-4">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-teal-400 shadow-md cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Application Slip</span>
                  </button>
                  <button
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setChildrenList([
                        {
                          firstName: "",
                          middleName: "",
                          lastName: "",
                          gender: "male",
                          dateOfBirth: "2015-05-10",
                          intendedClass: "JSS 1",
                          previousSchool: "",
                          medicalInfo: "",
                        },
                      ]);
                      setEnrollmentModalOpen(false);
                    }}
                    className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              /* Enrollment Multi-Child Form */
              <form onSubmit={handleSubmitApplication} className="mt-6 space-y-8">
                {appError && (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-semibold text-rose-300">
                    {appError}
                  </div>
                )}

                {/* 1. Guardian Details */}
                <div>
                  <h4 className="font-display text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                    <User className="h-4 w-4 text-teal-400" />
                    <span>1. Guardian / Parent Information</span>
                  </h4>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Guardian Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alhaji Mansur Danbatta"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Occupation / Organization
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Director, Danbatta Logistics"
                        value={guardianOccupation}
                        onChange={(e) => setGuardianOccupation(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. guardian@danbatta.ng"
                        value={guardianEmail}
                        onChange={(e) => setGuardianEmail(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Active Phone Hotline *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +234 803 123 4567"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Residential Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 15 Kofar Kaura Layout, Katsina"
                        value={guardianAddress}
                        onChange={(e) => setGuardianAddress(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Children Information with Dynamic + Button */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-teal-400" />
                      <span>
                        2. Scholar Information ({childrenList.length} Child{childrenList.length > 1 ? "ren" : ""})
                      </span>
                    </h4>

                    {/* PLUS BUTTON TO ADD ANOTHER CHILD */}
                    <button
                      type="button"
                      onClick={handleAddChild}
                      className="flex items-center gap-1.5 rounded-xl bg-teal-500/20 border border-teal-500/50 px-3 py-1 text-xs font-bold text-teal-300 hover:bg-teal-500 hover:text-slate-950 transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>+ Add Another Child</span>
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {childrenList.map((child, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 relative"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
                          <span className="rounded-lg bg-teal-500/20 px-2.5 py-0.5 text-xs font-bold text-teal-300">
                            Scholar #{idx + 1}
                          </span>

                          {childrenList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChild(idx)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              First Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Khadijah"
                              value={child.firstName}
                              onChange={(e) => handleChildChange(idx, "firstName", e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Middle Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Mansur"
                              value={child.middleName}
                              onChange={(e) => handleChildChange(idx, "middleName", e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Last Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Danbatta"
                              value={child.lastName}
                              onChange={(e) => handleChildChange(idx, "lastName", e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 mt-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Gender *
                            </label>
                            <select
                              value={child.gender}
                              onChange={(e) => handleChildChange(idx, "gender", e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Date of Birth *
                            </label>
                            <input
                              type="date"
                              required
                              value={child.dateOfBirth}
                              onChange={(e) => handleChildChange(idx, "dateOfBirth", e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Intended Class *
                            </label>
                            <select
                              value={child.intendedClass}
                              onChange={(e) => handleChildChange(idx, "intendedClass", e.target.value)}
                              className="w-full rounded-xl border border-teal-500/40 bg-slate-950 px-3 py-2 text-xs text-white font-bold"
                            >
                              <option value="Nursery 1">Nursery 1 (Age 2-3)</option>
                              <option value="Nursery 2">Nursery 2 (Age 4-5)</option>
                              <option value="Primary 1">Primary 1</option>
                              <option value="Primary 2">Primary 2</option>
                              <option value="Primary 3">Primary 3</option>
                              <option value="Primary 4">Primary 4</option>
                              <option value="Primary 5">Primary 5</option>
                              <option value="Primary 6">Primary 6</option>
                              <option value="JSS 1">Junior Secondary 1 (JSS 1)</option>
                              <option value="JSS 2">Junior Secondary 2 (JSS 2)</option>
                              <option value="JSS 3">Junior Secondary 3 (JSS 3)</option>
                              <option value="SS 1">Senior Secondary 1 (SS 1 - Science/Arts)</option>
                              <option value="SS 2">Senior Secondary 2 (SS 2)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 mt-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Previous School Attended
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Katsina Model Academy"
                              value={child.previousSchool}
                              onChange={(e) => handleChildChange(idx, "previousSchool", e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Medical Condition / Allergies
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. None / Asthmatic / Peanut allergy"
                              value={child.medicalInfo}
                              onChange={(e) => handleChildChange(idx, "medicalInfo", e.target.value)}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Automatic Fee Calculation & Payment Step */}
                <div className="rounded-2xl border border-teal-500/40 bg-gradient-to-br from-teal-950/60 to-slate-950 p-5 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">
                        Application Fee Calculation
                      </span>
                      <h4 className="font-display text-lg font-bold text-white mt-0.5">
                        {childrenList.length} × Application Form{childrenList.length > 1 ? "s" : ""}
                      </h4>
                      <p className="mt-1 text-xs text-slate-300" suppressHydrationWarning>
                        Official admissions fee of <strong>₦{formatNaira(feePerChildNaira)}</strong> per child application.
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Payable Amount</p>
                      <p className="font-display text-2xl sm:text-3xl font-black text-emerald-400" suppressHydrationWarning>
                        ₦{formatNaira(totalCalculatedNaira)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-teal-400" />
                      <span className="text-xs text-slate-300">
                        Instant Online Gateway (Card, Bank Transfer, USSD)
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingApp}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 px-6 py-3 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
                    >
                      <span suppressHydrationWarning>
                        {isSubmittingApp
                          ? "Processing Application..."
                          : `Pay ₦${formatNaira(totalCalculatedNaira)} & Submit Application`}
                      </span>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING QUICK ACCOUNT LOGIN MODAL */}
      {accountModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 sm:p-6 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAccountModalOpen(false);
          }}
        >
          <div className="relative my-auto w-full max-w-md rounded-3xl border border-teal-500/40 bg-[#092233] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">
                  Institutional Portal
                </span>
                <h3 className="font-display text-xl font-bold text-white">
                  {currentUser ? "Account Session" : "Account Sign In"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* If currently logged in, show user profile & quick dashboard navigation */}
            {currentUser ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-amber-400/30 bg-slate-900/80 p-4 flex items-center gap-3">
                  {currentUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatarUrl}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover border border-[#dfba73]"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#28a38e] to-[#dfba73] flex items-center justify-center font-bold text-slate-950 text-base font-mono">
                      {userInitials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-bold text-white text-sm truncate">
                      {currentUser.name || currentUser.email}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-teal-300">
                      Role: {currentUser.role}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href="/dashboard"
                    className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 py-3 text-center text-xs font-bold text-slate-950 shadow-md hover:brightness-110 transition"
                  >
                    Go to Your Workspace Dashboard
                  </Link>

                  <button
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.reload();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-950/40 hover:border-rose-500/50 transition cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out of Account</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickSignIn} className="mt-5 space-y-4">
                {signInError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-2.5 text-xs text-rose-300 font-semibold">
                    {signInError}
                  </div>
                )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                      placeholder="Enter email..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="text-[11px] text-teal-400"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
                      placeholder="Enter password..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="w-full rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 disabled:opacity-50 cursor-pointer transition"
                  >
                    {isSigningIn ? "Signing In…" : "Sign In to Dashboard"}
                  </button>

                  <div className="pt-2 text-center">
                    <Link
                      href="/login"
                      onClick={() => setAccountModalOpen(false)}
                      className="text-xs text-[#dfba73] hover:underline font-semibold"
                    >
                      Institutional Gateway Sign-In &rarr;
                    </Link>
                  </div>
                </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
