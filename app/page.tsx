"use client";

import { HomeChatInput } from "@/components/chat/home-chat-input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import Link from "next/link";
import {
  FileText, Github, Linkedin, Mail, Terminal, X,
  Briefcase, GraduationCap, Code2,
  Sparkles, Building2, ChevronDown, Trophy, ArrowUp, Menu,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type MouseEvent as ReactMouseEvent } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useInView, useScroll } from "framer-motion";
import { visitorHeaders } from "@/lib/visitor";

/* ── constants ─────────────────────────────────────────── */

const spring = { type: "spring" as const, stiffness: 260, damping: 26 };

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const NAV_SECTIONS = [
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "chat", label: "AI Chat" },
] as const;

const TYPED_WORDS = ["distributed systems", "cloud platforms", "full-stack products", "scalable APIs"];
const TYPED_SPEED = 80;
const TYPED_DELETE_SPEED = 40;
const TYPED_PAUSE = 1800;

/* ── helpers ───────────────────────────────────────────── */

const fmtDate = (s?: string) => {
  if (!s) return "";
  const d = new Date(s);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const formatDateRange = (date?: { start?: string; end?: string }) => {
  if (!date) return "";
  const a = fmtDate(date.start);
  const b = fmtDate(date.end);
  if (a && b) return `${a} — ${b}`;
  return a || b || "";
};

/* ── text scramble hook ─────────────────────────────────── */

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&";

function useScrambleText(text: string, trigger: boolean, speed = 30) {
  const [display, setDisplay] = useState(text);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!trigger || hasRun.current) return;
    hasRun.current = true;
    let frame: number;
    let iteration = 0;
    const maxIterations = text.length;

    const scramble = () => {
      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iteration) return text[i];
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          })
          .join(""),
      );
      iteration += 1 / 3;
      if (iteration <= maxIterations) {
        frame = window.setTimeout(scramble, speed);
      } else {
        setDisplay(text);
      }
    };
    scramble();
    return () => clearTimeout(frame);
  }, [trigger, text, speed]);

  return display;
}

/* ── section header ────────────────────────────────────── */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const scrambled = useScrambleText(title, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="space-y-1"
    >
      <div className="flex items-center gap-2 text-primary text-sm font-medium tracking-wide">
        {icon}
        <span className="uppercase">{subtitle}</span>
      </div>
      <h2
        className="text-3xl sm:text-4xl font-bold tracking-tight"
        style={{
          background: "linear-gradient(to right, var(--foreground) 30%, var(--primary) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {scrambled}
      </h2>
    </motion.div>
  );
}

/* ── section divider ───────────────────────────────────── */

function SectionDivider() {
  return (
    <div className="max-w-6xl mx-auto px-6">
      <div
        className="h-[1px] w-full"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, var(--border) 30%, var(--border) 70%, transparent 100%)",
          opacity: 0.5,
        }}
      />
    </div>
  );
}

/* ── glow card ─────────────────────────────────────────── */

function GlowCard({ children, className }: { children: ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouse = useCallback((e: ReactMouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouse}
      className={`glow-card ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/* ── animated counter ──────────────────────────────────── */

function AnimatedCounter({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const numericMatch = value.match(/^(\d+)(.*)$/);
  const target = numericMatch ? parseInt(numericMatch[1], 10) : 0;
  const suffix = numericMatch ? numericMatch[2] : value;
  const isNumeric = !!numericMatch;

  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView || !isNumeric) return;
    let frame: number;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, isNumeric]);

  return (
    <div ref={ref} className="px-6 sm:px-10 text-center">
      <div className="text-xl sm:text-2xl font-bold">
        {isNumeric ? `${count}${suffix}` : value}
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

/* ── 3D tilt card ──────────────────────────────────────── */

function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-6, 6]), { stiffness: 300, damping: 30 });

  const handleMouse = (e: ReactMouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── typed text ────────────────────────────────────────── */

function useTypedText(words: string[], speed = 80, deleteSpeed = 40, pause = 1800) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    const timer = setTimeout(
      () => {
        if (!isDeleting) {
          setText(word.slice(0, text.length + 1));
          if (text.length + 1 === word.length) {
            setTimeout(() => setIsDeleting(true), pause);
          }
        } else {
          setText(word.slice(0, text.length - 1));
          if (text.length - 1 === 0) {
            setIsDeleting(false);
            setWordIdx((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );
    return () => clearTimeout(timer);
  }, [text, wordIdx, isDeleting, words, speed, deleteSpeed, pause]);

  return text;
}

/* ── page ──────────────────────────────────────────────── */

export default function Home() {
  const [data, setData] = useState<any | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [terminalSelection, setTerminalSelection] = useState<"github" | "exit" | null>(null);
  const [terminalMessages, setTerminalMessages] = useState<string[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /* scroll progress */
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 });
  const backToTopOpacity = useTransform(scrollYProgress, [0, 0.08, 0.1], [0, 0, 1]);

  /* active section tracking */
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const sectionIds = NAV_SECTIONS.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  /* typed text */
  const typedText = useTypedText(TYPED_WORDS, TYPED_SPEED, TYPED_DELETE_SPEED, TYPED_PAUSE);

  /* client log */
  const sendClientLog = (event: string, extra?: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    fetch("/api/log", {
      method: "POST",
      headers: visitorHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ event, data: extra }),
      keepalive: true,
    }).catch(() => {});
  };

  useEffect(() => {
    fetch("/api/projects", { headers: visitorHeaders() })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    sendClientLog("page_view", {
      path: typeof window !== "undefined" ? window.location.pathname : "/",
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── data ──────────────────────────────────────────── */

  const experiences = data?.experience || [];
  const projects = data?.projects || [];
  const education = data?.education || [];
  const skills = data?.skills || null;
  const achievements = data?.achievements || [];

  const projectOrder = [
    "real-time-news-analysis-and-alert-platform",
    "distributed-job-orchestration-platform",
    "portfoliox-mobile-app",
    "realtime-stock-watchlist-android",
    "coursebundler",
    "mental-health-treatment-prediction",
    "license-plate-detector",
  ];

  const experienceOrder = [
    "greatbear-swe-2024-2025",
    "greatbear-intern-2024",
    "flourish-creations-intern-2023",
  ];

  const orderBy = (list: any[], order: string[]) => {
    const rank = new Map(order.map((id, i) => [id, i]));
    return [...list].sort((a, b) => {
      const ar = rank.get(a.id) ?? Infinity;
      const br = rank.get(b.id) ?? Infinity;
      return ar !== br
        ? ar - br
        : String(a.title || a.id || "").localeCompare(String(b.title || b.id || ""));
    });
  };

  const orderedProjects = useMemo(() => orderBy(projects, projectOrder), [projects]);
  const orderedExperiences = useMemo(() => orderBy(experiences, experienceOrder), [experiences]);

  /* transformed items (used by terminal dialog) */

  const experienceItems = useMemo(
    () =>
      orderedExperiences.map((e: any) => ({
        id: e.id,
        kind: "experience",
        title: `${e.company} • ${e.role}`,
        subtitle: formatDateRange(e.date),
        date: formatDateRange(e.date),
        company: e.company,
        role: e.role,
        location: e.location,
        stack: e.techStack || [],
        logs: e.highlights || [],
        summary: e.summary,
      })),
    [orderedExperiences],
  );

  const projectItems = useMemo(
    () =>
      orderedProjects.map((p: any) => ({
        id: p.id,
        kind: "projects",
        title: p.title,
        subtitle: p.summary || "Project",
        stack: p.techStack || [],
        logs: p.highlights || [],
        details: p.details,
        repo: p.links?.repo,
      })),
    [orderedProjects],
  );

  const educationItems = useMemo(
    () =>
      education.map((e: any) => ({
        id: e.id,
        kind: "education",
        title: e.school,
        subtitle: `${e.degree} in ${e.field}`,
        degree: `${e.degree} in ${e.field}`,
        date: formatDateRange(e.date),
        coursework: e.coursework || [],
        logs: e.coursework || [],
      })),
    [education],
  );

  const skillItems = useMemo(() => {
    if (!skills) return [];

    const categories: { id: string; title: string; key: string }[] = [
      { id: "skill-languages", title: "Languages", key: "languages" },
      { id: "skill-backend", title: "Backend", key: "backend" },
      { id: "skill-cloud", title: "Cloud & DevOps", key: "cloudAndDevOps" },
      { id: "skill-observability", title: "Observability", key: "observability" },
      { id: "skill-frontend", title: "Frontend & Mobile", key: "frontendAndMobile" },
      { id: "skill-ml", title: "ML & AI", key: "mlAndAi" },
      { id: "skill-systems", title: "Systems", key: "systems" },
    ];

    return categories
      .map((cat) => {
        const val = skills[cat.key];
        if (!val) return null;
        // Support both flat arrays and legacy nested objects
        const items: string[] = Array.isArray(val)
          ? val
          : Object.values(val as Record<string, string[]>).flat();
        return items.length > 0
          ? { id: cat.id, kind: "skills", title: cat.title, subtitle: "Skill Set", logs: items }
          : null;
      })
      .filter(Boolean);
  }, [skills]);

  /* ── terminal dialog logic ────────────────────────── */

  const openTerminal = (item: any) => setSelectedItem(item);
  const closeTerminal = () => setSelectedItem(null);
  const terminalHeader = selectedItem?.title || selectedItem?.school || "Terminal";

  useEffect(() => {
    if (!selectedItem) return;
    setTerminalMessages([]);
    setTerminalSelection(selectedItem.kind === "projects" && selectedItem.repo ? "github" : "exit");
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem) return;
    const options =
      selectedItem.kind === "projects" && selectedItem.repo ? ["github", "exit"] : ["exit"];

    const move = (dir: "next" | "prev") => {
      if (!terminalSelection) return;
      const idx = options.indexOf(terminalSelection);
      if (idx < 0) return;
      const next =
        dir === "next"
          ? (idx + 1) % options.length
          : (idx - 1 + options.length) % options.length;
      setTerminalSelection(options[next] as "github" | "exit");
    };

    const run = (choice: "github" | "exit", label?: string) => {
      if (choice === "github" && selectedItem.repo) {
        setTerminalMessages((p) => [
          ...p,
          `> Executing: ${label || "open_github.sh"}...`,
          "> Opening repository in new tab.",
        ]);
        window.open(selectedItem.repo, "_blank", "noopener,noreferrer");
      } else {
        setTerminalMessages((p) => [
          ...p,
          `> ${label || "exit_terminal.sh"}...`,
          "> Closing terminal.",
        ]);
        closeTerminal();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        e.preventDefault();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") return move("next");
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") return move("prev");
      if (e.key === "Enter" && terminalSelection)
        run(
          terminalSelection,
          terminalSelection === "github" ? "open_github.sh" : "exit_terminal.sh",
        );
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedItem, terminalSelection]);

  /* ── cursor spotlight ─────────────────────────────── */
  const spotlightRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (spotlightRef.current) {
      spotlightRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      spotlightRef.current.style.opacity = "1";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = "0";
    }
  }, []);

  /* ── render ────────────────────────────────────────── */

  if (!data) {
    return (
      <main className="min-h-screen text-foreground overflow-x-hidden isolate">
        <div className="bg-mesh">
          <div className="bg-mesh__grid" />
          <div className="bg-mesh__noise" />
          <div className="bg-mesh__vignette" />
        </div>
        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <span className="font-bold text-lg tracking-tight select-none">NP<span className="text-primary">.</span></span>
            <div className="flex items-center gap-2">
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="skeleton w-8 h-8 rounded-lg" />
            </div>
          </div>
        </nav>
        <div className="max-w-5xl mx-auto px-6 space-y-24 py-16">
          {/* Hero skeleton */}
          <div className="flex flex-col items-center gap-6 pt-16">
            <div className="skeleton w-32 h-32 rounded-full" />
            <div className="skeleton w-64 h-10 rounded-xl" />
            <div className="skeleton w-80 h-5 rounded-lg max-w-full" />
            <div className="flex gap-3 mt-2">
              <div className="skeleton w-28 h-10 rounded-full" />
              <div className="skeleton w-28 h-10 rounded-full" />
            </div>
          </div>
          {/* Experience skeleton */}
          <div className="space-y-6">
            <div className="skeleton w-48 h-8 rounded-lg" />
            <div className="space-y-4 pl-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton rounded-2xl" style={{ height: 144 }} />
              ))}
            </div>
          </div>
          {/* Projects skeleton */}
          <div className="space-y-6">
            <div className="skeleton w-36 h-8 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton rounded-2xl" style={{ height: 176 }} />
              ))}
            </div>
          </div>
          {/* Skills skeleton */}
          <div className="space-y-6">
            <div className="skeleton w-32 h-8 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton rounded-2xl" style={{ height: 128 }} />
              ))}
            </div>
          </div>
          {/* Education skeleton */}
          <div className="space-y-6">
            <div className="skeleton w-40 h-8 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="skeleton rounded-2xl" style={{ height: 144 }} />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen text-foreground overflow-x-hidden isolate"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── animated mesh background ───────────────── */}
      <div className="bg-mesh">
        <div className="bg-mesh__grid" />
        <div ref={spotlightRef} className="bg-mesh__spotlight" />
        <div className="bg-mesh__orb bg-mesh__orb--1" />
        <div className="bg-mesh__orb bg-mesh__orb--2" />
        <div className="bg-mesh__orb bg-mesh__orb--3" />
        <div className="bg-mesh__orb bg-mesh__orb--4" />
        <div className="bg-mesh__beam" />
        <div className="bg-mesh__noise" />
        <div className="bg-mesh__vignette" />
      </div>

      {/* ── scroll progress bar ────────────────────── */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-linear-to-r from-primary via-primary/80 to-accent origin-left z-[60]"
      />

      {/* ── sticky navbar ──────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight select-none">
            NP<span className="text-primary">.</span>
          </Link>

          {/* section links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-1 relative">
            {NAV_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`relative px-3 py-1.5 rounded-lg text-sm transition-colors z-[1] ${
                  activeSection === s.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {activeSection === s.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-[1]">{s.label}</span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {[
              { href: "https://www.linkedin.com/in/niharpatel4", icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn" },
              { href: "https://github.com/Nihar4", icon: <Github className="w-4 h-4" />, label: "GitHub" },
              { href: "mailto:niharpatel718@gmail.com", icon: <Mail className="w-4 h-4" />, label: "Email" },
              { href: "/resume.pdf", icon: <FileText className="w-4 h-4" />, label: "Resume" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                target={l.href.startsWith("http") || l.href.endsWith(".pdf") ? "_blank" : undefined}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label={l.label}
              >
                {l.icon}
              </Link>
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            <ThemeToggle />
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              onClick={() => setMobileNavOpen((p) => !p)}
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-border/40 overflow-hidden"
            >
              <div className="px-6 py-3 flex flex-col gap-1">
                {NAV_SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={() => setMobileNavOpen(false)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === s.id
                        ? "text-primary font-medium bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── hero section ───────────────────────────── */}
      <section className="relative flex items-center justify-center min-h-[88vh] px-6">
        <div className="max-w-4xl mx-auto w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
            }}
            className="flex flex-col items-center text-center space-y-8"
          >
            {/* availability badge */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1 } }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Open for 2026 Summer Internships
              </div>
            </motion.div>

            {/* avatar */}
            <motion.div
              variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
              transition={{ ...spring }}
            >
              <div className="avatar-ring-wrapper relative w-28 h-28 sm:w-32 sm:h-32">
                <div className="avatar-ring-glow" />
                <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl shadow-primary/10 bg-card">
                  <Image
                    src="/me.png"
                    alt="Nihar Patel"
                    fill
                    className="object-cover"
                    sizes="128px"
                    priority
                  />
                </div>
              </div>
            </motion.div>

            {/* headline */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h1
                className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1]"
              >
                <span className="bg-linear-to-br from-foreground via-foreground/90 to-muted-foreground/70 bg-clip-text text-transparent">
                  Nihar Patel
                </span>
              </h1>
              <p
                className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed h-14 sm:h-auto"
              >
                Software engineer building{" "}
                <span className="text-foreground font-medium">
                  {typedText}
                  <span className="animate-pulse text-primary">|</span>
                </span>
              </p>
            </motion.div>

            {/* cta buttons */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap justify-center gap-3"
            >
              <Link
                href="#chat"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/25"
              >
                <Sparkles className="w-4 h-4" />
                Ask my AI
              </Link>
              <Link
                href="/resume.pdf"
                target="_blank"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
              >
                <FileText className="w-4 h-4" />
                Resume
              </Link>
            </motion.div>

            {/* scroll cue */}
            <motion.div
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              transition={{ duration: 0.5 }}
              className="pt-6"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground/60" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ── experience ─────────────────────────────── */}
      <section id="experience" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            icon={<Briefcase className="w-5 h-5" />}
            title="Experience"
            subtitle="Where I've worked"
          />

          {/* timeline */}
          <div className="relative mt-14 pl-8 sm:pl-10 space-y-10">
            {/* animated timeline line */}
            <motion.div
              className="absolute left-0 top-0 w-[2px] bg-linear-to-b from-primary/60 via-primary/30 to-border/30 origin-top"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: "100%" }}
            />
            {experienceItems.map((item: any, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="relative"
              >
                {/* timeline dot */}
                <div className="absolute -left-6.5 sm:-left-7.25 top-5 w-4 h-4 rounded-full bg-primary/80 border-[3px] border-background shadow-md shadow-primary/20" />

                <button
                  onClick={() => openTerminal(item)}
                  className="w-full text-left group"
                >
                  <TiltCard>
                  <GlowCard>
                  <div className="p-5 sm:p-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors">
                            {item.company}
                          </h3>
                          <p className="text-sm text-muted-foreground">{item.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground sm:text-right shrink-0 pl-13 sm:pl-0">
                        <span>{item.date}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">{item.location}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.summary}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {item.stack.slice(0, 8).map((t: string) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="text-[11px] font-mono bg-muted/40 border-border/40 group-hover:border-primary/20 transition-colors"
                        >
                          {t}
                        </Badge>
                      ))}
                      {item.stack.length > 8 && (
                        <Badge variant="outline" className="text-[11px] font-mono bg-muted/40">
                          +{item.stack.length - 8}
                        </Badge>
                      )}
                    </div>

                    {/* click hint */}
                    <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground/70 group-hover:text-primary/70 transition-colors">
                      <Terminal className="w-3 h-3" />
                      <span>Click to open terminal</span>
                    </div>
                  </div>
                  </GlowCard>
                  </TiltCard>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ── projects ───────────────────────────────── */}
      <section id="projects" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            icon={<Code2 className="w-5 h-5" />}
            title="Projects"
            subtitle="What I've built"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {projectItems.map((item: any, idx: number) => (
              <motion.div
                key={item.id}
                variants={fadeUp}
                className={idx < 2 ? "lg:row-span-1" : ""}
              >
                <button
                  onClick={() => openTerminal(item)}
                  className="w-full h-full text-left group"
                >
                  <TiltCard className="h-full">
                  <GlowCard className="h-full">
                  <div className="relative h-full p-5 sm:p-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col overflow-hidden">
                    {/* top glow line */}
                    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <Terminal className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
                      {item.subtitle}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {item.stack.slice(0, 5).map((t: string) => (
                        <Badge
                          key={t}
                          variant="outline"
                          className="text-[11px] font-mono bg-muted/40 border-border/40 group-hover:border-primary/20 transition-colors"
                        >
                          {t}
                        </Badge>
                      ))}
                      {item.stack.length > 5 && (
                        <Badge variant="outline" className="text-[11px] font-mono bg-muted/40">
                          +{item.stack.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                  </GlowCard>
                  </TiltCard>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ── skills ─────────────────────────────────── */}
      <section id="skills" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            icon={<Sparkles className="w-5 h-5" />}
            title="Skills"
            subtitle="Technologies I work with"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {skillItems.map((group: any, gIdx: number) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: gIdx * 0.1, duration: 0.5 }}
                className="p-5 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/20 transition-colors"
              >
                <h3 className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                  {group.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {group.logs.map((skill: string, i: number) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{
                        delay: gIdx * 0.1 + i * 0.04,
                        duration: 0.35,
                        type: "spring",
                        stiffness: 400,
                        damping: 15,
                      }}
                      className="inline-block"
                    >
                      <Badge
                        variant="outline"
                        className="text-[11px] font-mono bg-muted/40 border-border/40"
                      >
                        {skill}
                      </Badge>
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ── education ──────────────────────────────── */}
      <section id="education" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            icon={<GraduationCap className="w-5 h-5" />}
            title="Education"
            subtitle="Where I studied"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {educationItems.map((item: any) => (
              <motion.div key={item.id} variants={fadeUp}>
                <button
                  onClick={() => openTerminal(item)}
                  className="w-full text-left group"
                >
                  <div className="p-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">{item.date}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(item.coursework || []).map((c: string) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className="text-[11px] bg-muted/40 border-border/40"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── achievements ───────────────────────────── */}
      {achievements.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {achievements.map((a: any) => (
                <motion.div
                  key={a.id}
                  variants={fadeUp}
                  className="flex items-start gap-3 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5"
                >
                  <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.details && (
                      <p className="text-xs text-muted-foreground mt-1">{a.details}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── AI chat CTA ────────────────────────────── */}
      <section id="chat" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              AI-Powered
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Ask me anything
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Chat with my AI to learn more about my experience, projects, and skills.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mt-8"
          >
            <HomeChatInput />
          </motion.div>
        </div>
      </section>

      {/* ── footer ─────────────────────────────────── */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Nihar Patel</span>
          <div className="flex items-center gap-5">
            <Link
              href="https://www.linkedin.com/in/niharpatel4"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              LinkedIn
            </Link>
            <Link
              href="https://github.com/Nihar4"
              target="_blank"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="mailto:niharpatel718@gmail.com"
              className="hover:text-foreground transition-colors"
            >
              Email
            </Link>
          </div>
        </div>
      </footer>

      {/* ── terminal dialog ────────────────────────── */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && closeTerminal()}>
        <DialogContent
          showCloseButton={false}
          className="fixed! top-1/2! left-1/2! -translate-x-1/2! -translate-y-1/2! overflow-hidden bg-black text-green-400 border border-green-500/40 w-[92vw] h-[82vh] sm:w-[85vw] sm:h-[80vh] lg:w-[75vw] lg:h-[78vh] max-w-none sm:max-w-none shadow-[0_0_60px_rgba(34,197,94,0.2)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_10%,rgba(34,197,94,0.12),transparent_55%)] before:opacity-70 before:pointer-events-none font-mono p-0"
        >
          <div className="relative z-10 flex h-full flex-col p-4 sm:p-6">
            {/* terminal chrome */}
            <div className="flex items-center justify-between pb-4 border-b border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex items-center gap-2 text-green-200">
                  <Terminal className="h-3.5 w-3.5" />
                  <DialogTitle className="text-xs font-mono uppercase tracking-widest text-green-200">
                    {terminalHeader}
                  </DialogTitle>
                </div>
              </div>
              <button
                onClick={closeTerminal}
                className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-green-200 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Exit
              </button>
            </div>

            {/* terminal body */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-2 text-xs sm:text-sm wrap-break-word">
              {selectedItem && (
                <>
                  {selectedItem.kind === "experience" && (
                    <>
                      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={spring}>
                        <span className="text-green-300">ROLE:</span> {selectedItem.role || selectedItem.title}
                      </motion.div>
                      {selectedItem.company && (
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.04 }}>
                          <span className="text-green-300">COMPANY:</span> {selectedItem.company}
                        </motion.div>
                      )}
                      {selectedItem.location && (
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.06 }}>
                          <span className="text-green-300">LOCATION:</span> {selectedItem.location}
                        </motion.div>
                      )}
                    </>
                  )}

                  {selectedItem.kind === "projects" && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={spring}>
                      <span className="text-green-300">PROJECT:</span> {selectedItem.title}
                    </motion.div>
                  )}

                  {selectedItem.kind === "skills" && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={spring}>
                      <span className="text-green-300">SKILL AREA:</span> {selectedItem.title}
                    </motion.div>
                  )}

                  {selectedItem.kind === "education" && (
                    <>
                      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={spring}>
                        <span className="text-green-300">SCHOOL:</span> {selectedItem.title}
                      </motion.div>
                      {selectedItem.degree && (
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.04 }}>
                          <span className="text-green-300">DEGREE:</span> {selectedItem.degree}
                        </motion.div>
                      )}
                      {selectedItem.date && (
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.08 }}>
                          <span className="text-green-300">DATES:</span> {selectedItem.date}
                        </motion.div>
                      )}
                    </>
                  )}

                  {selectedItem.stack && (selectedItem.kind === "experience" || selectedItem.kind === "projects") && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.08 }}>
                      <span className="text-green-300">STACK:</span> {selectedItem.stack.join(", ")}
                    </motion.div>
                  )}

                  {selectedItem.logs && selectedItem.logs.length > 0 && (
                    <div className="space-y-1 mt-4">
                      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.1 }}>
                        <span className="text-green-300">
                          {selectedItem.kind === "experience"
                            ? "HIGHLIGHTS:"
                            : selectedItem.kind === "skills"
                              ? "CAPABILITIES:"
                              : selectedItem.kind === "education"
                                ? "COURSEWORK:"
                                : "DETAILS:"}
                        </span>
                      </motion.div>
                      {selectedItem.logs.map((log: string, i: number) => (
                        <motion.div
                          key={`${selectedItem.title || selectedItem.school}-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring, delay: 0.14 + i * 0.05 }}
                        >
                          &gt; {log}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* commands */}
                  <div className="mt-6 space-y-2">
                    <div className="text-green-300 text-xs">COMMANDS:</div>
                    <div className="space-y-1 text-xs">
                      {selectedItem.kind === "projects" && selectedItem.repo && (
                        <div
                          onClick={() => setTerminalSelection("github")}
                          className={`cursor-pointer flex items-center gap-2 ${
                            terminalSelection === "github" ? "text-white" : "text-green-200/80"
                          }`}
                        >
                          <span className="text-green-400">&gt;</span>
                          <span>github</span>
                          {terminalSelection === "github" && (
                            <span className="ml-1 inline-block animate-pulse text-green-400">
                              ▋
                            </span>
                          )}
                        </div>
                      )}
                      <div
                        onClick={() => setTerminalSelection("exit")}
                        className={`cursor-pointer flex items-center gap-2 ${
                          terminalSelection === "exit" ? "text-white" : "text-green-200/80"
                        }`}
                      >
                        <span className="text-green-400">&gt;</span>
                        <span>exit</span>
                        {terminalSelection === "exit" && (
                          <span className="ml-1 inline-block animate-pulse text-green-400">
                            ▋
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-green-200/60">
                      Use arrow keys to move, Enter to run.
                    </div>
                    {terminalMessages.length > 0 && (
                      <div className="mt-3 space-y-1 text-green-200/80 text-xs">
                        {terminalMessages.map((msg, i) => (
                          <div key={`terminal-msg-${i}`}>{msg}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── back-to-top button ─────────────────────── */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{ opacity: backToTopOpacity }}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full border border-border/50 bg-card/80 backdrop-blur-md text-muted-foreground hover:text-primary hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 pointer-events-auto"
        aria-label="Back to top"
      >
        <ArrowUp className="w-4 h-4" />
      </motion.button>
    </main>
  );
}
