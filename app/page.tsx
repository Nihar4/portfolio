"use client";

import { HomeChatInput } from "@/components/chat/home-chat-input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import Link from "next/link";
import { FileText, Github, Linkedin, Mail, Terminal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 260, damping: 26 };

const formatDateRange = (date?: { start?: string; end?: string }) => {
  if (!date) return "";
  if (date.start && date.end) return `${date.start} — ${date.end}`;
  return date.start || date.end || "";
};

const formatSkillGroup = (title: string, items?: string[]) => ({
  id: `skill-${title.toLowerCase().replace(/\s+/g, "-")}`,
  kind: "skills",
  title,
  subtitle: "Skill Set",
  logs: items && items.length > 0 ? items : [],
});

export default function Home() {
  const [data, setData] = useState<any | null>(null);
  const [activeCategory, setActiveCategory] = useState<
    "experience" | "projects" | "skills" | "education"
  >("experience");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [terminalSelection, setTerminalSelection] = useState<"github" | "exit" | null>(null);
  const [terminalMessages, setTerminalMessages] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((payload) => setData(payload))
      .catch((err) => console.error("Failed to load projects:", err));
  }, []);

  const experiences = data?.experience || [];
  const projects = data?.projects || [];
  const education = data?.education || [];
  const skills = data?.skills || null;
  const profile = data?.profile || null;

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
    const rank = new Map(order.map((id, index) => [id, index]));
    return [...list].sort((a, b) => {
      const aRank = rank.has(a.id) ? rank.get(a.id)! : Number.MAX_SAFE_INTEGER;
      const bRank = rank.has(b.id) ? rank.get(b.id)! : Number.MAX_SAFE_INTEGER;
      if (aRank === bRank) {
        const aLabel = a.title || a.company || a.school || a.id || "";
        const bLabel = b.title || b.company || b.school || b.id || "";
        return String(aLabel).localeCompare(String(bLabel));
      }
      return aRank - bRank;
    });
  };

  const orderedProjects = useMemo(() => orderBy(projects, projectOrder), [projects]);
  const orderedExperiences = useMemo(() => orderBy(experiences, experienceOrder), [experiences]);

  const projectItems = useMemo(() => {
    return orderedProjects.map((project: any) => ({
      id: project.id,
      kind: "projects",
      title: project.title,
      subtitle: project.summary || "Project",
      stack: project.techStack || [],
      logs: project.highlights || [],
      details: project.details,
      repo: project.links?.repo,
    }));
  }, [orderedProjects]);

  const experienceItems = useMemo(() => {
    return orderedExperiences.map((exp: any) => ({
      id: exp.id,
      kind: "experience",
      title: `${exp.company} • ${exp.role}`,
      subtitle: formatDateRange(exp.date),
      date: formatDateRange(exp.date),
      company: exp.company,
      role: exp.role,
      location: exp.location,
      stack: exp.techStack || [],
      logs: exp.highlights || [],
      summary: exp.summary,
    }));
  }, [orderedExperiences]);

  const educationItems = useMemo(() => {
    return education.map((edu: any) => ({
      id: edu.id,
      kind: "education",
      title: edu.school,
      subtitle: `${edu.degree} in ${edu.field}`,
      degree: `${edu.degree} in ${edu.field}`,
      date: formatDateRange(edu.date),
      coursework: edu.coursework || [],
      logs: edu.coursework || [],
    }));
  }, [education]);

  const skillItems = useMemo(() => {
    if (!skills) return [];
    const items: any[] = [];
    items.push(formatSkillGroup("Languages", skills.languages));

    const backend = skills.backend || {};
    items.push({
      id: "skill-backend",
      kind: "skills",
      title: "Backend",
      subtitle: "Skill Set",
      logs: [
        backend.runtime ? `Runtime: ${backend.runtime.join(", ")}` : null,
        backend.frameworks ? `Frameworks: ${backend.frameworks.join(", ")}` : null,
        backend.apisAndProtocols ? `APIs & Protocols: ${backend.apisAndProtocols.join(", ")}` : null,
        backend.messagingAndStreaming ? `Messaging/Streaming: ${backend.messagingAndStreaming.join(", ")}` : null,
        backend.caching ? `Caching: ${backend.caching.join(", ")}` : null,
        backend.datastores ? `Datastores: ${backend.datastores.join(", ")}` : null,
        backend.vectorAndSearch ? `Vector/Search: ${backend.vectorAndSearch.join(", ")}` : null,
        backend.auth ? `Auth: ${backend.auth.join(", ")}` : null,
      ].filter(Boolean),
    });

    const cloud = skills.cloudAndDevOps || {};
    items.push({
      id: "skill-cloud",
      kind: "skills",
      title: "Cloud & DevOps",
      subtitle: "Skill Set",
      logs: [
        cloud.cloud ? `Cloud: ${cloud.cloud.join(", ")}` : null,
        cloud.computeAndServerless ? `Compute/Serverless: ${cloud.computeAndServerless.join(", ")}` : null,
        cloud.containers ? `Containers: ${cloud.containers.join(", ")}` : null,
        cloud.iac ? `IaC: ${cloud.iac.join(", ")}` : null,
        cloud.cicd ? `CI/CD: ${cloud.cicd.join(", ")}` : null,
        cloud.edgeAndDelivery ? `Edge/Delivery: ${cloud.edgeAndDelivery.join(", ")}` : null,
        cloud.storage ? `Storage: ${cloud.storage.join(", ")}` : null,
        cloud.loadBalancing ? `Load Balancing: ${cloud.loadBalancing.join(", ")}` : null,
        cloud.artifactRegistry ? `Registry: ${cloud.artifactRegistry.join(", ")}` : null,
      ].filter(Boolean),
    });

    const obs = skills.observability || {};
    items.push({
      id: "skill-observability",
      kind: "skills",
      title: "Observability",
      subtitle: "Skill Set",
      logs: [
        obs.tools ? `Tools: ${obs.tools.join(", ")}` : null,
        obs.concepts ? `Concepts: ${obs.concepts.join(", ")}` : null,
      ].filter(Boolean),
    });

    const frontend = skills.frontendAndMobile || {};
    items.push({
      id: "skill-frontend",
      kind: "skills",
      title: "Frontend & Mobile",
      subtitle: "Skill Set",
      logs: [
        frontend.web ? `Web: ${frontend.web.join(", ")}` : null,
        frontend.mobile ? `Mobile: ${frontend.mobile.join(", ")}` : null,
      ].filter(Boolean),
    });

    const ml = skills.mlAndAi || {};
    items.push({
      id: "skill-ml",
      kind: "skills",
      title: "ML & AI",
      subtitle: "Skill Set",
      logs: [
        ml.frameworks ? `Frameworks: ${ml.frameworks.join(", ")}` : null,
        ml.systems ? `Systems: ${ml.systems.join(", ")}` : null,
      ].filter(Boolean),
    });

    const systems = skills.systems || {};
    items.push({
      id: "skill-systems",
      kind: "skills",
      title: "Systems",
      subtitle: "Skill Set",
      logs: [
        systems.distributedSystems ? `Distributed: ${systems.distributedSystems.join(", ")}` : null,
        systems.osAndIsolation ? `Isolation: ${systems.osAndIsolation.join(", ")}` : null,
        systems.serialization ? `Serialization: ${systems.serialization.join(", ")}` : null,
      ].filter(Boolean),
    });

    return items.filter((item) => item.logs && item.logs.length > 0);
  }, [skills]);

  const activeList =
    activeCategory === "experience"
      ? experienceItems
      : activeCategory === "projects"
        ? projectItems
        : activeCategory === "skills"
          ? skillItems
          : educationItems;

  const openTerminal = (item: any) => setSelectedItem(item);
  const closeTerminal = () => setSelectedItem(null);

  const terminalHeader = selectedItem
    ? selectedItem.title || selectedItem.school
    : "Terminal";

  useEffect(() => {
    if (!selectedItem) return;
    setTerminalMessages([]);
    if (selectedItem.kind === "projects" && selectedItem.repo) {
      setTerminalSelection("github");
    } else {
      setTerminalSelection("exit");
    }
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem) return;

    const options =
      selectedItem.kind === "projects" && selectedItem.repo
        ? ["github", "exit"]
        : ["exit"];

    const moveSelection = (direction: "next" | "prev") => {
      if (!terminalSelection) return;
      const currentIndex = options.indexOf(terminalSelection);
      if (currentIndex === -1) return;
      const nextIndex =
        direction === "next"
          ? (currentIndex + 1) % options.length
          : (currentIndex - 1 + options.length) % options.length;
      setTerminalSelection(options[nextIndex] as "github" | "exit");
    };

    const runSelection = (choice: "github" | "exit", actionLabel?: string) => {
      if (choice === "github" && selectedItem.repo) {
        setTerminalMessages((prev) => [
          ...prev,
          `> Executing: ${actionLabel || "open_github.sh"}...`,
          "> Opening repository in new tab.",
        ]);
        window.open(selectedItem.repo, "_blank", "noopener,noreferrer");
      } else {
        setTerminalMessages((prev) => [
          ...prev,
          `> ${actionLabel || "exit_terminal.sh"}...`,
          "> Closing terminal.",
        ]);
        closeTerminal();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        moveSelection("next");
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        moveSelection("prev");
        return;
      }

      if (event.key === "Enter" && terminalSelection) {
        runSelection(terminalSelection, terminalSelection === "github" ? "open_github.sh" : "exit_terminal.sh");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, terminalSelection]);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-muted overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col min-h-screen">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-10 sm:mb-12">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-muted-foreground">Open for 2026 Summer Internships</span>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <Link
              href="https://www.linkedin.com/in/niharpatel4"
              target="_blank"
              className="p-2 hover:text-foreground hover:bg-muted rounded-full transition-all"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </Link>
            <Link
              href="https://github.com/Nihar4"
              target="_blank"
              className="p-2 hover:text-foreground hover:bg-muted rounded-full transition-all"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </Link>
            <Link
              href="mailto:niharpatel718@gmail.com"
              className="p-2 hover:text-foreground hover:bg-muted rounded-full transition-all"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </Link>
            <Link
              href="/resume.pdf"
              target="_blank"
              className="p-2 hover:text-foreground hover:bg-muted rounded-full transition-all"
              aria-label="Resume"
            >
              <FileText className="w-5 h-5" />
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="flex flex-col items-center text-center mb-10 space-y-6"
        >
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-border shadow-2xl bg-card">
            <Image
              src="/me.png"
              alt="Nihar Memoji"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Hey, I&apos;m Nihar <span className="animate-wave inline-block origin-bottom-right">👋</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl sm:max-w-3xl mx-auto">
              Master&apos;s in Software Engineering Student at San José State University
            </p>
            <div className="pt-2">
              <Badge variant="outline" className="px-3 py-1 text-sm border-border text-muted-foreground">
                ✨ AI Portfolio
              </Badge>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
          className="w-full max-w-3xl mx-auto flex-1 flex flex-col mb-10 sm:mb-12 min-h-[100px]"
        >
          <div className="w-full">
            <HomeChatInput />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            {(["experience", "projects", "skills", "education"] as const).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`text-base sm:text-xl md:text-3xl font-semibold font-mono uppercase tracking-[0.2em] sm:tracking-[0.28em] transition-all ${
                  activeCategory === category
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.toUpperCase()}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={spring}
              className="max-w-3xl mx-auto w-full"
            >
              <Card className="bg-card/70 border-border/60 backdrop-blur-md">
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-[55vh] sm:max-h-[60vh] min-h-[36vh] sm:min-h-[40vh] overflow-y-auto">
                  {activeList.length === 0 && (
                    <div className="text-sm text-muted-foreground">No entries yet.</div>
                  )}
                  {activeList.map((item: any) => (
                    <motion.button
                      key={item.id || item.school}
                      layout
                      whileHover={{ scale: 1.01 }}
                      onClick={() => openTerminal(item)}
                      className="w-full text-left rounded-xl border border-border/60 bg-background/60 px-3 py-2 sm:px-4 sm:py-3 hover:border-primary/60 hover:bg-muted/40 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm sm:text-base font-semibold break-words">
                            {item.title || item.school}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {item.subtitle || "Select for details"}
                          </div>
                        </div>
                        <Terminal className="h-4 w-4 text-primary" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </motion.section>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && closeTerminal()}>
        <DialogContent
          showCloseButton={false}
          className="!fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 relative overflow-hidden bg-black text-green-400 border border-green-500/40 w-[92vw] h-[82vh] sm:w-[85vw] sm:h-[80vh] lg:w-[80vw] lg:h-[80vh] max-w-none sm:max-w-none shadow-[0_0_40px_rgba(34,197,94,0.3)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_10%,rgba(34,197,94,0.15),transparent_55%)] before:opacity-70 before:pointer-events-none font-mono p-0"
        >
          <div className="relative z-10 flex h-full flex-col p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-green-500/30">
              <div className="flex items-center gap-2 text-green-200">
                <Terminal className="h-4 w-4" />
                <DialogTitle className="text-sm font-mono uppercase tracking-widest text-green-200">
                  {terminalHeader}
                </DialogTitle>
              </div>
              <button
                onClick={closeTerminal}
                className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-green-200 hover:text-white"
              >
                <X className="h-4 w-4" /> Exit
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-2 text-xs sm:text-sm break-words">
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
                      {selectedItem.date && (
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring, delay: 0.08 }}
                          className="sr-only"
                        >
                          <span className="text-green-300">DATES:</span> {selectedItem.date}
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

                  {selectedItem.stack && selectedItem.kind === "experience" && (
                    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.08 }}>
                      <span className="text-green-300">STACK:</span> {selectedItem.stack.join(", ")}
                    </motion.div>
                  )}

                  {selectedItem.stack && selectedItem.kind === "projects" && (
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
                      {(selectedItem.logs || []).map((log: string, index: number) => (
                        <motion.div
                          key={`${selectedItem.title || selectedItem.school}-${index}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...spring, delay: 0.14 + index * 0.05 }}
                        >
                          &gt; {log}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  <div className="mt-6 space-y-2">
                    <div className="text-green-300 text-xs">COMMANDS:</div>
                    <div className="space-y-1 text-xs">
                      {selectedItem.kind === "projects" && selectedItem.repo && (
                        <div
                          data-cursor="block"
                          onClick={() => setTerminalSelection("github")}
                          className={`cursor-pointer flex items-center gap-2 ${
                            terminalSelection === "github" ? "text-white" : "text-green-200/80"
                          }`}
                        >
                          <span className="text-green-400">&gt;</span>
                          <span>github</span>
                        {terminalSelection === "github" && (
                          <span className="ml-1 inline-block animate-pulse text-green-400">▋</span>
                        )}
                        </div>
                      )}
                      <div
                        data-cursor="block"
                        onClick={() => setTerminalSelection("exit")}
                        className={`cursor-pointer flex items-center gap-2 ${
                          terminalSelection === "exit" ? "text-white" : "text-green-200/80"
                        }`}
                      >
                        <span className="text-green-400">&gt;</span>
                        <span>exit</span>
                        {terminalSelection === "exit" && (
                          <span className="ml-1 inline-block animate-pulse text-green-400">▋</span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-green-200/70">
                      Use arrow keys to move, Enter to run.
                    </div>
                    {terminalMessages.length > 0 && (
                      <div className="mt-3 space-y-1 text-green-200/80 text-xs">
                        {terminalMessages.map((msg, index) => (
                          <div key={`terminal-msg-${index}`}>{msg}</div>
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
    </main>
  );
}
