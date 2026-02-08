"use client"

import { useSearchParams } from "next/navigation"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Button } from "@/components/ui/button" // Assuming you have a button component
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"

function ChatPageContent() {
    const searchParams = useSearchParams()
    const initialQuery = searchParams.get("q") || undefined

    return (
        <main className="flex flex-col h-screen bg-background text-foreground selection:bg-muted overflow-hidden">
            {/* Minimal Header */}
            <header className="flex items-center p-4 border-b border-border/60 bg-card/70 backdrop-blur-md z-10 shrink-0">
                <Link href="/" passHref>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Portfolio
                    </Button>
                </Link>
            </header>

            {/* Full Screen Chat Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                <ChatInterface initialMessage={initialQuery} isFullScreen={true} />
            </div>
        </main>
    )
}

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>}>
            <ChatPageContent />
        </Suspense>
    )
}
