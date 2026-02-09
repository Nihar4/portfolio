"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useState, type ReactNode } from "react"
import { Check, Copy, ExternalLink, Hash, Terminal, Briefcase, Code2, ChevronRight } from "lucide-react"

/* ── helpers ──────────────────────────────────────────── */

/** Detect if text looks like a project/experience heading the AI uses */
function isProjectHeading(text: string) {
    // Matches patterns like "**Project Name** — description" or bold-only lines
    return /^\*\*[^*]+\*\*/.test(text.trim())
}

/* ── code block with copy ─────────────────────────────── */
function CodeBlock({ children, language }: { children: string; language?: string }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = async () => {
        await navigator.clipboard.writeText(children)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <div className="my-3 rounded-lg border border-border/60 bg-[#1a1a2e] dark:bg-[#0d0d14] overflow-hidden text-[13px]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-mono">
                    <Terminal className="w-3 h-3" />
                    {language || "code"}
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors"
                >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre className="p-3 overflow-x-auto">
                <code className="text-green-300/90 font-mono text-xs leading-relaxed">{children}</code>
            </pre>
        </div>
    )
}

/* ── main component ───────────────────────────────────── */

interface MessageBubbleProps {
    role: "user" | "assistant" | "system" | "data" | "function" | "tool"
    content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
    const [copied, setCopied] = useState(false)

    if (role === "system" || role === "data" || role === "function" || role === "tool") return null

    const displayContent = content.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, "").trim();
    if (!displayContent) return null;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(displayContent)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    /* ── user bubble (unchanged) ─────── */
    if (role === "user") {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12, x: 12 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex w-full justify-end group"
            >
                <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed bg-primary text-primary-foreground rounded-tr-sm">
                    {displayContent}
                </div>
            </motion.div>
        )
    }

    /* ── assistant bubble (rich formatting) ─────── */
    return (
        <motion.div
            initial={{ opacity: 0, y: 12, x: -12 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex w-full justify-start group"
        >
            <div className="relative max-w-[85%] rounded-2xl px-5 py-4 text-sm shadow-sm leading-relaxed bg-muted text-foreground rounded-tl-sm border border-border/50">
                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    className="absolute -right-2 -top-2 p-1.5 rounded-full bg-card border border-border/60 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-muted hover:border-primary/40 z-10"
                    aria-label="Copy message"
                >
                    {copied ? (
                        <Check className="w-3 h-3 text-green-500" />
                    ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                </button>

                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        /* ── headings: accent bar + icon ─── */
                        h1: ({ children }) => (
                            <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
                                <div className="w-1 h-5 rounded-full bg-primary" />
                                <h3 className="text-sm font-bold text-foreground">{children}</h3>
                            </div>
                        ),
                        h2: ({ children }) => (
                            <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
                                <div className="w-1 h-4 rounded-full bg-primary/70" />
                                <h4 className="text-sm font-semibold text-foreground">{children}</h4>
                            </div>
                        ),
                        h3: ({ children }) => (
                            <div className="flex items-center gap-2 mt-3 mb-1.5">
                                <div className="w-0.5 h-3.5 rounded-full bg-primary/50" />
                                <h5 className="text-[13px] font-semibold text-foreground">{children}</h5>
                            </div>
                        ),

                        /* ── paragraphs ─── */
                        p: ({ children }) => (
                            <p className="mb-3 last:mb-0 text-[13.5px] leading-[1.7]">{children}</p>
                        ),

                        /* ── bold: subtle emphasis ─── */
                        strong: ({ children }) => (
                            <strong className="font-semibold text-foreground">{children}</strong>
                        ),

                        /* ── unordered list: custom dots ─── */
                        ul: ({ children }) => (
                            <ul className="mb-3 space-y-1.5 pl-1">{children}</ul>
                        ),

                        /* ── ordered list: styled numbers ─── */
                        ol: ({ children }) => (
                            <ol className="mb-3 space-y-1.5 pl-1 counter-reset-list">{children}</ol>
                        ),

                        /* ── list items: colored bullet ─── */
                        li: ({ children, ...props }) => {
                            const isOrdered = (props as any).ordered
                            const idx = (props as any).index
                            return (
                                <li className="flex items-start gap-2 text-[13.5px]">
                                    {isOrdered ? (
                                        <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
                                            {(idx ?? 0) + 1}
                                        </span>
                                    ) : (
                                        <ChevronRight className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-1" />
                                    )}
                                    <span className="flex-1">{children}</span>
                                </li>
                            )
                        },

                        /* ── horizontal rule: gradient divider ─── */
                        hr: () => (
                            <div className="my-4">
                                <div
                                    className="h-px w-full"
                                    style={{
                                        background: "linear-gradient(to right, transparent, var(--primary) 30%, var(--primary) 70%, transparent)",
                                        opacity: 0.25,
                                    }}
                                />
                            </div>
                        ),

                        /* ── code blocks: terminal style ─── */
                        pre: ({ children }) => {
                            // Extract language and code text from the nested <code>
                            const codeEl = (children as any)?.props
                            const className = codeEl?.className || ""
                            const lang = className.replace("language-", "")
                            const codeText = typeof codeEl?.children === "string"
                                ? codeEl.children
                                : String(codeEl?.children || "")
                            return <CodeBlock language={lang}>{codeText}</CodeBlock>
                        },

                        /* ── inline code ─── */
                        code: ({ children, className }) => {
                            // If it has a language class, it's a code block (handled by pre)
                            if (className) return <code className={className}>{children}</code>
                            return (
                                <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-mono text-[12px] border border-primary/10">
                                    {children}
                                </code>
                            )
                        },

                        /* ── links: pill chips ─── */
                        a: ({ href, children }) => (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[12px] font-medium border border-primary/20 hover:bg-primary/20 hover:border-primary/30 transition-colors no-underline mx-0.5"
                            >
                                {children}
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                        ),

                        /* ── blockquote ─── */
                        blockquote: ({ children }) => (
                            <blockquote className="my-3 pl-3 border-l-2 border-primary/40 text-muted-foreground italic text-[13px]">
                                {children}
                            </blockquote>
                        ),

                        /* ── table ─── */
                        table: ({ children }) => (
                            <div className="my-3 overflow-x-auto rounded-lg border border-border/60">
                                <table className="w-full text-[12.5px]">{children}</table>
                            </div>
                        ),
                        thead: ({ children }) => (
                            <thead className="bg-primary/5 border-b border-border/60">{children}</thead>
                        ),
                        th: ({ children }) => (
                            <th className="px-3 py-2 text-left font-semibold text-foreground">{children}</th>
                        ),
                        td: ({ children }) => (
                            <td className="px-3 py-2 border-t border-border/30">{children}</td>
                        ),
                    }}
                >
                    {displayContent}
                </ReactMarkdown>
            </div>
        </motion.div>
    )
}
