"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
    role: "user" | "assistant" | "system" | "data" | "function" | "tool"
    content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
    // Hide system, functional, and tool messages from the main chat bubble stream
    if (role === "system" || role === "data" || role === "function" || role === "tool") return null

    // Strip <think>...</think> blocks from display (supporting unclosed tags during stream)
    const displayContent = content.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, "").trim();

    // If content is empty after stripping (still thinking), hide bubble
    if (!displayContent) return null;

    return (
        <div className={cn(
            "flex w-full",
            role === "user" ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed",
                role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm border border-border/50"
            )}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ node, ...props }) => (
                            <h3 className="text-sm font-semibold mt-2 mb-2" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                            <h4 className="text-sm font-semibold mt-2 mb-2" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                            <p className="mb-3 last:mb-0" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                            <ul className="mb-3 pl-4 list-disc space-y-1" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                            <ol className="mb-3 pl-4 list-decimal space-y-1" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                            <li className="mb-1 last:mb-0" {...props} />
                        ),
                        pre: ({ node, ...props }) => (
                            <div className="overflow-auto w-full my-2 bg-muted/60 p-2 rounded-md border border-border/60">
                                <pre {...props} />
                            </div>
                        ),
                        code: ({ node, ...props }) => (
                            <code className="bg-muted/40 px-1 py-0.5 rounded font-mono text-xs" {...props} />
                        )
                    }}
                >
                    {displayContent}
                </ReactMarkdown>
            </div>
        </div>
    )
}
