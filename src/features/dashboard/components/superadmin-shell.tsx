"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  BadgeCheck,
  BookMarked,
  Briefcase,
  CalendarDays,
  ChevronRight,
  Compass,
  Crown,
  FileSignature,
  Globe2,
  GraduationCap,
  Landmark,
  ListChecks,
  LogOut,
  Menu,
  Pin,
  PinOff,
  ScrollText,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Award,
  Users,
  X,
} from "lucide-react";
import { brand } from "@/config/brand";
import { AcademicContextSwitcher } from "@/features/academic/components/academic-context-switcher";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: typeof Landmark;
  badge?: string;
  subMenus: {
    label: string;
    href: string;
    description?: string;
  }[];
};

const navigation: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: Landmark,
    subMenus: [
      { label: "Executive Overview", href: "/dashboard", description: "School KPIs and academic performance telemetry" },
      { label: "Academic Sessions", href: "/dashboard/academic-sessions", description: "Manage academic years and term calendars" },
      { label: "Reports & Audits", href: "/dashboard/reports", description: "Enrolment statistics and administrative activity logs" },
    ],
  },
  {
    id: "cms",
    label: "CMS Landing Page",
    href: "/dashboard/cms",
    icon: Globe2,
    badge: "0 Hardcode",
    subMenus: [
      { label: "Hero & Admissions CTA", href: "/dashboard/cms?section=hero", description: "Headline, statistics and application banner" },
      { label: "About & Philosophy", href: "/dashboard/cms?section=about", description: "School mission, vision and principal's note" },
      { label: "Curriculum & Wings", href: "/dashboard/cms?section=curriculum", description: "Nursery, Primary, JSS, SS & Cambridge" },
      { label: "Campus & Facilities", href: "/dashboard/cms?section=facilities", description: "STEM labs, boarding halls and sports pavilion" },
      { label: "Fees & Investment", href: "/dashboard/cms?section=fees", description: "Tuition packages and scholarship criteria" },
      { label: "Testimonials & Voices", href: "/dashboard/cms?section=testimonials", description: "Distinguished alumni and parent feedback" },
      { label: "Contact & Diplomatic Zone", href: "/dashboard/cms?section=contact", description: "Maitama campus address and phone lines" },
    ],
  },
  {
    id: "applications",
    label: "Applications",
    href: "/dashboard/applications",
    icon: ScrollText,
    badge: "Live",
    subMenus: [
      { label: "Received Applications", href: "/dashboard/applications", description: "Review incoming parent and child entries" },
      { label: "Fee Pricing & Config", href: "/dashboard/applications?tab=pricing", description: "Set price per child application form" },
      { label: "Admit & Enrol to DB", href: "/dashboard/applications?tab=admitted", description: "Database enrollment synchronization" },
    ],
  },
  {
    id: "students",
    label: "Students",
    href: "/dashboard/students",
    icon: Users,
    badge: "CRUD",
    subMenus: [
      { label: "Pending Students", href: "/dashboard/students?tab=pending", description: "Enrollment intake from landing page form" },
      { label: "Active Students", href: "/dashboard/students?tab=active", description: "Fully registered scholars with class & admission ID" },
      { label: "Quick List", href: "/dashboard/students?tab=quick", description: "Classroom quick-enrollment & teacher intake switch" },
    ],
  },
  {
    id: "student-promotion",
    label: "Student Promotion",
    href: "/dashboard/student-promotion",
    icon: TrendingUp,
    badge: "Class Engine",
    subMenus: [
      { label: "Class Progression", href: "/dashboard/student-promotion", description: "Promote, repeat, or demote scholars between classes" },
      { label: "Promotion Ledger", href: "/dashboard/student-promotion?tab=ledger", description: "Permanent audit log of academic progression" },
    ],
  },
  {
    id: "duty-roster",
    label: "Duty Roster",
    href: "/dashboard/duty-roster",
    icon: CalendarDays,
    badge: "A4 Roster",
    subMenus: [
      { label: "Weekly Duty Roster", href: "/dashboard/duty-roster", description: "A4 paper printable duty roster & staff distribution" },
      { label: "Generate Distribution", href: "/dashboard/duty-roster?tab=generator", description: "Equal staff distribution across academic weeks" },
      { label: "Roster Archives", href: "/dashboard/duty-roster?tab=archives", description: "Archived rosters and active status configuration" },
    ],
  },
  {
    id: "school-ac",
    label: "School AC",
    href: "/dashboard/school-ac",
    icon: Sparkles,
    badge: "Week 4",
    subMenus: [
      { label: "Academic Calendar", href: "/dashboard/school-ac", description: "Term weeks, schedule, and 7-day automated progression" },
      { label: "Current Week Tracker", href: "/dashboard/school-ac?tab=tracker", description: "Real-time scholastic week and manual override" },
    ],
  },
  {
    id: "weekly-theme",
    label: "Weekly Theme",
    href: "/dashboard/weekly-theme",
    icon: BookMarked,
    subMenus: [
      { label: "Weekly Themes", href: "/dashboard/weekly-theme", description: "Weekly theme titles, scriptures, hadiths & core values" },
      { label: "Theme Management", href: "/dashboard/weekly-theme?tab=manage", description: "Create, update, and schedule assembly themes" },
    ],
  },
  {
    id: "access-control",
    label: "Access Control",
    href: "/dashboard/access-control",
    icon: BadgeCheck,
    badge: "4 Roles",
    subMenus: [
      { label: "All User Accounts", href: "/dashboard/access-control", description: "Superadmins, Managers, Staff & Students credentials" },
      { label: "Faculty & Staff", href: "/dashboard/access-control?tab=staff", description: "Teaching & non-academic staff accounts and dossiers" },
      { label: "Managers", href: "/dashboard/access-control?tab=managers", description: "Manager accounts, supervisory roles & credentials" },
      { label: "Scholars & Students", href: "/dashboard/access-control?tab=students", description: "Student accounts linked to enrolled profiles" },
      { label: "Hierarchy & Supervision", href: "/dashboard/access-control?tab=hierarchy", description: "Assign staff reporting to managers" },
    ],
  },
  {
    id: "managers",
    label: "Section Heads (Managers)",
    href: "/dashboard/managers",
    icon: Award,
    badge: "Leadership",
    subMenus: [
      { label: "Section Personalization", href: "/dashboard/managers", description: "Configure Head of Nursery, Head Teacher & Principal" },
      { label: "Signatures & Seals", href: "/dashboard/managers?tab=signatures", description: "Official signatures and stamps for report cards" },
      { label: "Default Remarks", href: "/dashboard/managers?tab=comments", description: "Section-specific appraisal commendations" },
    ],
  },
  {
    id: "subjects",
    label: "Subjects",
    href: "/dashboard/subjects",
    icon: BookMarked,
    subMenus: [
      { label: "Subject Catalogue", href: "/dashboard/subjects", description: "Core and elective subjects catalogue" },
      { label: "Subject Combinations", href: "/dashboard/subjects?tab=combinations", description: "Combine multiple subjects into curriculum tracks" },
    ],
  },
  {
    id: "classes",
    label: "Classes",
    href: "/dashboard/classes",
    icon: GraduationCap,
    subMenus: [
      { label: "Class Directory", href: "/dashboard/classes", description: "Grades, arms and student registers" },
      { label: "Subject Combination Link", href: "/dashboard/classes?tab=combinations", description: "Attach subject curricula to classes" },
      { label: "Class Teachers", href: "/dashboard/classes?tab=teachers", description: "Assign pastoral and form teachers" },
      { label: "Daily Registration", href: "/dashboard/classes?tab=attendance", description: "Student daily attendance tracking" },
    ],
  },
  {
    id: "offices",
    label: "Offices",
    href: "/dashboard/offices",
    icon: Briefcase,
    subMenus: [
      { label: "Offices Directory", href: "/dashboard/offices", description: "Create offices and define binding duties" },
      { label: "Manager & Staff Assignment", href: "/dashboard/offices?tab=assignments", description: "Assign personnel to offices" },
      { label: "Weekly Logs & Reports", href: "/dashboard/offices?tab=logs", description: "Weekly task reports from assigned staff" },
    ],
  },
  {
    id: "tasks",
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: ListChecks,
    subMenus: [
      { label: "Task Catalogue", href: "/dashboard/tasks", description: "Security, gardening, sanitation duties" },
      { label: "Staff Task Assignment", href: "/dashboard/tasks?tab=assignments", description: "Delegate tasks to support staff" },
      { label: "Responsibility Documents", href: "/dashboard/tasks?tab=documents", description: "Editable operating procedures & SOPs" },
      { label: "Execution Logs", href: "/dashboard/tasks?tab=logs", description: "Daily reports from assigned workers" },
    ],
  },
  {
    id: "elearning",
    label: "E-Learning",
    href: "/dashboard/elearning",
    icon: Compass,
    subMenus: [
      { label: "Resource Library", href: "/dashboard/elearning", description: "Manage learning items for students" },
      { label: "Add Text / Document", href: "/dashboard/elearning?action=create&type=text", description: "Publish revision study notes" },
      { label: "Add External URL", href: "/dashboard/elearning?action=create&type=url", description: "Embed interactive videos or links" },
    ],
  },
  {
    id: "letterhead-studio",
    label: "Letter Head Studio",
    href: "/dashboard/letterhead-studio",
    icon: FileSignature,
    badge: "Official",
    subMenus: [
      { label: "Official Composer", href: "/dashboard/letterhead-studio", description: "Draft official Salamah letterhead memo" },
      { label: "Letterhead Archive", href: "/dashboard/letterhead-studio?tab=archive", description: "Previously issued correspondence" },
      { label: "Template Preview", href: "/dashboard/letterhead-studio?tab=preview", description: "Sample heraldic header and crest" },
    ],
  },
  {
    id: "system-settings",
    label: "System Settings",
    href: "/dashboard/system-settings",
    icon: SlidersHorizontal,
    subMenus: [
      { label: "Academic Sessions & Terms", href: "/dashboard/system-settings?tab=academic", description: "Current session and term pointers" },
      { label: "Official Signatories", href: "/dashboard/system-settings?tab=signatories", description: "Principal & Registrar signatures" },
      { label: "School Identity", href: "/dashboard/system-settings?tab=profile", description: "Diplomatic zone address & legal registration" },
      { label: "Security & Authentication", href: "/dashboard/system-settings?tab=security", description: "Credential and session policies" },
    ],
  },
];

export function SuperadminShell({
  email,
  children,
  sessions = [],
  terms = [],
  sessionId,
  termId,
}: {
  email: string;
  children: ReactNode;
  sessions?: { id: string; name: string }[];
  terms?: { id: string; sessionId: string; name: string }[];
  sessionId?: string;
  termId?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine current active item based on pathname
  const currentNav = navigation.find((item) => {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(item.href);
  }) || navigation[0];

  // Active / Selected menu
  const [activeMenu, setActiveMenu] = useState<NavItem>(currentNav);
  // Hovered menu driving the extension preview
  const [hoveredMenu, setHoveredMenu] = useState<NavItem | null>(null);
  // State for hover extension visibility
  const [isHovered, setIsHovered] = useState(false);
  // Optional pin state
  const [isPinned, setIsPinned] = useState(false);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update active menu when route changes
  useEffect(() => {
    const matched = navigation.find((item) => {
      if (item.href === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(item.href);
    });
    if (matched) {
      setActiveMenu(matched);
    }
  }, [pathname]);

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  function handleMenuHover(item: NavItem) {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredMenu(item);
    setIsHovered(true);
  }

  function handleContainerLeave() {
    if (isPinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setHoveredMenu(null);
    }, 180);
  }

  function handleContainerEnter() {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }

  function withContext(href: string) {
    const query = new URLSearchParams();
    const selectedSession = params.get("sessionId");
    const selectedTerm = params.get("termId");
    if (selectedSession) query.set("sessionId", selectedSession);
    if (selectedTerm) query.set("termId", selectedTerm);
    return query.size ? `${href}${href.includes("?") ? "&" : "?"}${query}` : href;
  }

  // Which menu to display in the extension: hovered menu first, fallback to active
  const displayedExtensionMenu = hoveredMenu || activeMenu;
  const showExtension = isPinned || isHovered;

  return (
    <div className="min-h-screen bg-[#020b14] text-slate-100 antialiased selection:bg-[#c5a059] selection:text-[#020b14]">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Dual-Tier Nav Outer Wrapper with hover bridging */}
      <div
        className="fixed inset-y-0 left-0 z-50 flex pointer-events-none"
        onMouseEnter={handleContainerEnter}
        onMouseLeave={handleContainerLeave}
      >
        {/* Tier 1: Primary Academic Navigation Rail */}
        <aside
          id="school-navigation"
          className={`pointer-events-auto flex h-full w-[245px] flex-col border-r border-[#c5a059]/20 bg-[#031320] text-slate-100 shadow-[10px_0_30px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-in-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Noble Brand Crest Header */}
          <div className="flex h-19 items-center gap-3 border-b border-[#c5a059]/20 bg-[#020f1a] px-3.5">
            <div className="relative h-11 w-11 shrink-0 flex items-center justify-center">
              <Image src={brand.assets.logo} alt="Salamah" width={44} height={44} className="h-full w-auto object-contain" priority />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <Crown className="h-3 w-3 text-[#dfba73]" />
                <p className="truncate font-serif text-sm font-bold tracking-wide text-white">
                  Salamah
                </p>
              </div>
              <p className="truncate text-[9px] font-bold tracking-[0.16em] text-[#c5a059] uppercase">
                Imperial Super Admin
              </p>
              <p className="truncate text-[8px] tracking-wider text-slate-400 italic">
                Scientia · Mores · Ducatus
              </p>
            </div>
            <button
              className="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Primary Menus List — Minimized padding to strictly avoid X-overflow */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2.5 noble-scrollbar">
            <div className="px-2 pb-1.5 flex items-center justify-between">
              <span className="text-[9px] font-extrabold tracking-[0.2em] text-[#c5a059] uppercase">
                Academic Modules
              </span>
              <span className="text-[8px] font-medium text-slate-500 uppercase tracking-widest">
                Hover to Open
              </span>
            </div>

            <nav className="space-y-0.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isSelected = activeMenu.id === item.id;
                const isHoveredItem = hoveredMenu?.id === item.id;
                const firstSubMenu = item.subMenus?.[0];
                const targetHref = firstSubMenu?.href || item.href;

                return (
                  <Link
                    key={item.id}
                    href={withContext(targetHref)}
                    onMouseEnter={() => handleMenuHover(item)}
                    onClick={() => {
                      setActiveMenu(item);
                      setHoveredMenu(item);
                      if (!isPinned) {
                        setIsHovered(false);
                      }
                      if (mobileOpen) setMobileOpen(false);
                    }}
                    className={`group relative flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-all overflow-hidden ${
                      isSelected
                        ? "bg-[#082236] text-white ring-1 ring-[#c5a059]/40 shadow-sm"
                        : isHoveredItem
                        ? "bg-[#061d2d] text-amber-200 border-l-2 border-[#c5a059]"
                        : "text-slate-300 hover:bg-[#051926] hover:text-white"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Icon
                        className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                          isSelected
                            ? "text-[#dfba73]"
                            : isHoveredItem
                            ? "text-amber-200"
                            : "text-slate-400 group-hover:text-amber-200"
                        }`}
                      />
                      <span className={`truncate text-[13px] tracking-tight ${
                        isSelected ? "text-white font-bold" : "text-slate-300 group-hover:text-white"
                      }`}>
                        {item.label}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {item.badge && (
                        <span className="rounded-full border border-[#c5a059]/30 bg-[#c5a059]/15 px-1.5 py-0.2 text-[8px] font-bold text-amber-200">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`h-3 w-3 transition-transform ${
                          isSelected
                            ? "text-[#dfba73] translate-x-0.5"
                            : isHoveredItem
                            ? "text-amber-300 translate-x-0.5"
                            : "text-slate-600 group-hover:text-slate-400"
                        }`}
                      />
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Noble Footer: Quick Public Preview & Authenticated User */}
          <div className="border-t border-[#c5a059]/20 bg-[#020c15] p-2.5">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 rounded-lg border border-[#c5a059]/30 bg-[#072133] px-2.5 py-1.5 text-xs font-medium text-amber-200 transition hover:bg-[#0c2f48] hover:border-[#c5a059]/60"
            >
              <Globe2 className="h-3.5 w-3.5 text-[#dfba73]" />
              <span className="truncate">Public Landing Page</span>
              <Sparkles className="ml-auto h-3 w-3 text-amber-400" />
            </Link>

            <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span className="truncate max-w-[130px] text-slate-300 font-mono text-[10px]">{email}</span>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-1 font-semibold text-rose-400 hover:text-rose-300 transition"
                  title="Sign out of Super Admin"
                >
                  <LogOut className="h-3 w-3" />
                  <span className="text-[10px] uppercase tracking-wider">Exit</span>
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Tier 2: Slide-in/out Sidebar Extension Panel (Hover Triggered & Hidden by default) */}
        <div
          className={`pointer-events-auto fixed lg:left-[245px] top-0 bottom-0 z-50 flex flex-col w-[285px] border-r border-y border-[#c5a059]/30 bg-[#041928]/95 backdrop-blur-xl text-slate-100 shadow-[20px_0_40px_rgba(0,0,0,0.65)] transition-all duration-200 ease-out overflow-hidden ${
            showExtension
              ? "opacity-100 translate-x-0 visible"
              : "opacity-0 -translate-x-3 pointer-events-none invisible"
          }`}
          onMouseEnter={handleContainerEnter}
          onMouseLeave={handleContainerLeave}
        >
          {displayedExtensionMenu && (
            <div className="flex h-full flex-col overflow-hidden">
              {/* Extension Header */}
              <div className="flex h-19 items-center justify-between border-b border-[#c5a059]/20 bg-[#031320] px-4">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#dfba73]" />
                    <p className="text-[9px] font-extrabold tracking-[0.2em] text-[#c5a059] uppercase">
                      Sub-Menu Navigator
                    </p>
                  </div>
                  <h3 className="font-serif text-sm font-bold text-white truncate">
                    {displayedExtensionMenu.label}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsPinned(!isPinned)}
                    className={`rounded-lg p-1.5 transition ${
                      isPinned
                        ? "bg-[#c5a059]/20 text-[#dfba73] ring-1 ring-[#c5a059]/50"
                        : "text-slate-400 hover:bg-[#072439] hover:text-white"
                    }`}
                    title={isPinned ? "Unpin Extension" : "Pin Extension open"}
                  >
                    {isPinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPinned(false);
                      setIsHovered(false);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-[#072439] hover:text-white"
                    title="Close preview"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub-menu Direct Links — Minimized padding to strictly avoid X-overflow */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 noble-scrollbar space-y-1">
                <p className="px-1 text-[9px] font-extrabold tracking-[0.16em] text-slate-400 uppercase">
                  Sub-Sections & Operations
                </p>

                {displayedExtensionMenu.subMenus.map((sub, idx) => {
                  const isSubActive =
                    pathname === sub.href ||
                    (sub.href.includes("?") &&
                      pathname === sub.href.split("?")[0] &&
                      params.get(sub.href.split("?")[1]?.split("=")[0]) ===
                        sub.href.split("?")[1]?.split("=")[1]);

                  return (
                    <Link
                      key={idx}
                      href={withContext(sub.href)}
                      onClick={() => {
                        setActiveMenu(displayedExtensionMenu);
                        if (!isPinned) setIsHovered(false);
                        setMobileOpen(false);
                      }}
                      className={`group block rounded-lg px-2.5 py-2 transition-all overflow-hidden ${
                        isSubActive
                          ? "bg-gradient-to-r from-[#c5a059]/20 to-transparent ring-1 ring-[#c5a059]/40 text-amber-100"
                          : "hover:bg-[#062033] text-slate-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold truncate text-white group-hover:text-[#dfba73]">
                          {sub.label}
                        </p>
                        <ChevronRight className="h-3 w-3 text-slate-500 opacity-0 transition group-hover:opacity-100 shrink-0" />
                      </div>
                      {sub.description && (
                        <p className="mt-0.5 text-[10.5px] leading-tight text-slate-400 truncate">
                          {sub.description}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area — Now with generous breathing space (lg:pl-[245px] instead of cramped 530px!) */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          isPinned ? "lg:pl-[530px]" : "lg:pl-[245px]"
        }`}
      >
        {/* Top Control Bar with Academic Nobility Header */}
        <header className="sticky top-0 z-30 flex h-19 items-center justify-between border-b border-[#c5a059]/20 bg-[#031320]/95 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open mobile navigation"
              className="rounded-lg border border-[#c5a059]/30 p-2 text-slate-300 hover:text-white lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Quick Pin / Unpin button in header */}
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#c5a059]/30 bg-[#072439]/60 px-2.5 py-1 text-xs font-medium text-amber-200 transition hover:bg-[#0b334f] hover:border-[#c5a059]/60"
              title={isPinned ? "Collapse pinned sub-menu" : "Pin sub-menu panel open"}
            >
              {isPinned ? (
                <>
                  <PinOff className="h-3.5 w-3.5 text-[#dfba73]" />
                  <span>Pinned</span>
                </>
              ) : (
                <>
                  <Pin className="h-3.5 w-3.5 text-[#dfba73]" />
                  <span>Pin Sub-Menu</span>
                </>
              )}
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <AcademicContextSwitcher
              sessions={sessions}
              terms={terms}
              sessionId={sessionId}
              termId={termId}
            />

            <div className="hidden h-6 w-px bg-[#c5a059]/20 md:block" />

            {/* Super Admin Badge Profile */}
            <div className="flex items-center gap-2.5 rounded-xl border border-[#c5a059]/25 bg-[#041a29] px-2.5 py-1.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-tr from-[#c5a059] to-[#dfba73] text-xs font-bold text-[#020b14] shadow-xs">
                SA
              </div>
              <div className="hidden text-left xl:block">
                <p className="text-xs font-serif font-bold leading-none text-white">Executive Super Admin</p>
                <p className="mt-0.5 text-[10px] font-mono text-[#dfba73]">{email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with High Readability and Noble Framing */}
        <main className="p-4 sm:p-6 lg:p-8 salamah-enter">{children}</main>
      </div>
    </div>
  );
}
