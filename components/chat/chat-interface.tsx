"use client"

import { useChat } from "ai/react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, Sparkles, User, FileText, Briefcase, ChevronDown, ChevronUp, Layers, Mail, MoreHorizontal, MessageSquare } from "lucide-react"
import { MessageBubble } from "./message-bubble"
import { ReasoningTerminal } from "./reasoning-terminal"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { visitorHeaders } from "@/lib/visitor"

export function ChatInterface({ initialMessage, isFullScreen = false }: { initialMessage?: string, isFullScreen?: boolean }) {
    // Store reasoning logs keyed by the *assistant's* message ID (or index if ID is unstable)
    const [reasoningHistory, setReasoningHistory] = useState<Record<string, string>>({})
    const [showSuggestions, setShowSuggestions] = useState(true)

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { messages, input, handleInputChange, handleSubmit, isLoading, data, append, setInput } = useChat({
        api: "/api/chat",
        headers: visitorHeaders(),
        // We don't use initialMessages for the trigger because it doesn't auto-submit.
        // We handle that via useEffect below.
        initialMessages: [],
        onFinish: (message) => {
            // When a message finishes, we might want to ensure its reasoning is saved.
            // However, `data` update happens during stream. 
            // We rely on the `useEffect` on `data` to keep `reasoningHistory` up to date.
        },
        onError: (err) => {
            console.error("Chat Error:", err);
            setErrorMsg(err.message);
        }
    })

    const hasInitialized = useRef(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Auto-trigger initial message
    useEffect(() => {
        if (initialMessage && !hasInitialized.current) {
            hasInitialized.current = true
            append({ role: 'user', content: initialMessage })
        }
    }, [initialMessage, append])

    // Parse reasoning from message content
    useEffect(() => {
        // We scan the last message (if assistant) for <think> tags
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
            const content = lastMsg.content;
            const thinkMatch = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);

            if (thinkMatch) {
                const thought = thinkMatch[1];
                setCurrentThinking(thought);
                setReasoningHistory(prev => ({
                    ...prev,
                    [lastMsg.id]: thought
                }));
            }
        }
    }, [messages]);

    // Track the "current" thinking buffer for the active stream
    const [currentThinking, setCurrentThinking] = useState("")

    // Clear current thinking when loading stops
    useEffect(() => {
        if (!isLoading) {
            setCurrentThinking("");
        }
    }, [isLoading]);

    useEffect(() => {
        // Only scroll if we are not manually scrolling up, or if it's a new message
        // For now, let's keep it simple: Scroll to bottom on updates, but maybe use 'auto' behavior for thinking updates to reduce motion sickness
        if (isLoading) {
            scrollRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
        } else {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages, currentThinking, reasoningHistory, isLoading]);

    const suggestions = [
        { label: "Me", icon: User, prompt: "Tell me about yourself" },
        { label: "Resume", icon: FileText, prompt: "Summarize your resume" },
        { label: "Projects", icon: Briefcase, prompt: "Show me your projects" },
        { label: "Skills", icon: Layers, prompt: "What are your technical skills?" },
        { label: "Contact", icon: Mail, prompt: "How can I contact you?" },
    ]

    const handleSuggestionClick = (prompt: string) => {
        append({ role: 'user', content: prompt })
    }

    // ADJUSTED RETURN FOR FULL SCREEN
    return (
        <div className={`flex flex-col w-full mx-auto bg-background/50 backdrop-blur-xl relative overflow-hidden min-h-0 ${isFullScreen ? 'h-full rounded-none border-none shadow-none max-w-5xl' : 'h-[600px] max-w-2xl border border-border/50 rounded-xl shadow-2xl'}`}>

            {/* Minimal Header with Memoji */}
            <div className="absolute top-0 w-full p-4 z-50 flex justify-center pointer-events-none">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border/60 shadow-lg bg-card pointer-events-auto">
                    <Image
                        src="/me.png"
                        alt="Nihar"
                        fill
                        className="object-cover"
                        sizes="96px"
                        priority
                        unoptimized
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 p-4 pt-32">
                {/* ... messages ... */}
                {/* existing logic for messages map */}
                <div className="space-y-6 max-w-3xl mx-auto pb-4">
                    {/* Added max-w-3xl to keep text readable on wide screens */}

                    {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center text-center mt-8 space-y-4">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg bg-card">
                                <Image
                                    src="/me.png"
                                    alt="Nihar"
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold text-foreground">Chat with Nihar's AI</h3>
                                <p className="text-sm text-muted-foreground max-w-xs">
                                    Ask about my experience, projects, skills, or anything else.
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                                <MessageSquare className="w-3 h-3" />
                                <span>Powered by AI &middot; responses may take a moment</span>
                            </div>
                        </div>
                    )}

                    {messages.map(m => (
                        <div key={m.id}>
                            <MessageBubble role={m.role as any} content={m.content} />

                            {/* Render Reasoning if it exists for this assistant message */}
                            {m.role === 'assistant' && (reasoningHistory[m.id] || (isLoading && m.id === messages[messages.length - 1].id && currentThinking)) && (
                                <div className="mt-2 ml-4 max-w-[85%]">
                                    <details open={isLoading && m.id === messages[messages.length - 1].id} className="group">
                                        <summary className="list-none cursor-pointer flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100">
                                                <Sparkles className="w-3 h-3" />
                                                <span>
                                                    {isLoading && m.id === messages[messages.length - 1].id
                                                        ? "Developing thought process..."
                                                        : "View thought process"}
                                                </span>
                                            </div>
                                        </summary>
                                        <div className="mt-2">
                                            <ReasoningTerminal
                                                reasoning={reasoningHistory[m.id] || currentThinking}
                                                isThinking={isLoading && m.id === messages[messages.length - 1].id}
                                            />
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Pending Reasoning (before assistant message is created) */}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && currentThinking && (
                        <div className="mt-2 ml-4 max-w-[85%]">
                            <ReasoningTerminal
                                reasoning={currentThinking}
                                isThinking={true}
                            />
                        </div>
                    )}

                    {/* Loading State (if no thinking yet) */}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && !currentThinking && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-2xl rounded-tl-sm border border-border/50 px-5 py-4 shadow-sm">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                                    <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} className="h-1" />
                </div>
            </ScrollArea>

            <div className="p-4 bg-background/50 backdrop-blur-md shrink-0">
                <div className="max-w-3xl mx-auto space-y-4">

                    {/* Suggestions Chips */}
                    {!isLoading && messages.length === 0 && (
                        <div className="flex flex-col items-center gap-2 mb-2">
                            <button
                                onClick={() => setShowSuggestions(!showSuggestions)}
                                className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showSuggestions ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                                {showSuggestions ? "Hide quick questions" : "Show quick questions"}
                            </button>

                            {showSuggestions && (
                                <div className="flex flex-wrap justify-center gap-2">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s.label}
                                            onClick={() => handleSuggestionClick(s.prompt)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted border border-border/60 hover:border-border text-xs text-muted-foreground hover:text-foreground transition-all"
                                        >
                                            <s.icon className="w-3.5 h-3.5" />
                                            {s.label}
                                        </button>
                                    ))}
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted border border-border/60 hover:border-border text-xs text-muted-foreground hover:text-foreground transition-all">
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="relative group">
                        <div className="chat-input-glow rounded-[32px]">
                            <Input
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Ask me anything"
                                className="pl-6 pr-14 h-14 rounded-[32px] border-2 border-border/60 hover:border-border focus-visible:border-primary/60 bg-muted/50 hover:bg-muted/80 focus-visible:ring-0 focus-visible:bg-muted text-lg shadow-sm transition-all"
                            />
                        </div>
                        <Button
                            type="submit"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all disabled:opacity-0 disabled:scale-90"
                            disabled={isLoading || !input.trim()}
                        >
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
