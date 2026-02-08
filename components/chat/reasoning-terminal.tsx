"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Terminal, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ReasoningTerminalProps {
    reasoning: string
    isThinking: boolean
}

export function ReasoningTerminal({ reasoning, isThinking }: ReasoningTerminalProps) {
    const [isOpen, setIsOpen] = useState(true)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen && (isThinking || reasoning)) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" })
        }
    }, [reasoning, isThinking, isOpen])

    if (!reasoning && !isThinking) return null

    return (
        <div className="w-full mb-4 border border-primary/30 rounded-md bg-card/80 backdrop-blur-md overflow-hidden font-mono text-xs">
            <div
                className="flex items-center justify-between px-3 py-2 bg-blue-500/10 border-b border-blue-500/20 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-blue-400">
                    <Cpu className={`h-3 w-3 ${isThinking ? "animate-pulse" : ""}`} />
                    <span className="uppercase tracking-wider font-semibold">
                        {isThinking ? "Processing..." : "Reasoning Complete"}
                    </span>
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-blue-400">
                    <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </Button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 max-h-48 overflow-y-auto text-primary/80 space-y-1">
                            <span className="opacity-50 select-none">$ </span>
                            <span className="whitespace-pre-wrap">{reasoning}</span>
                            {isThinking && (
                                <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse align-middle ml-1" />
                            )}
                            <div ref={bottomRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
