"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Sparkles } from "lucide-react"

export function HomeChatInput() {
    const [input, setInput] = useState("")
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        // Redirect to /chat with the message as a query param
        const params = new URLSearchParams()
        params.set("q", input)
        router.push(`/chat?${params.toString()}`)
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl mx-auto relative group"
        >
            <div className="relative flex items-center">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything"
                    className="pl-6 pr-14 h-14 rounded-[32px] border-2 border-border/60 hover:border-border focus-visible:border-primary/60 bg-muted/50 hover:bg-muted/80 focus-visible:ring-0 focus-visible:bg-muted text-lg shadow-sm transition-all"
                />

                <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all disabled:opacity-0 disabled:scale-90"
                    disabled={!input.trim()}
                >
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </form>
    )
}
