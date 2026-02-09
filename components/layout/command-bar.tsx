"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
    Briefcase,
    Code2,
    FileText,
    Github,
    GraduationCap,
    Linkedin,
    Mail,
    MessageSquare,
    Moon,
    Sparkles,
    Sun,
    Terminal,
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"

export function CommandBar() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const router = useRouter()
    const { theme, setTheme } = useTheme()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((o) => !o)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const scrollTo = (id: string) => {
        setOpen(false)
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    }

    const navigate = (href: string, external = false) => {
        setOpen(false)
        if (external) {
            window.open(href, "_blank")
        } else {
            router.push(href)
        }
    }

    const askAI = () => {
        setOpen(false)
        if (query.trim()) {
            const params = new URLSearchParams()
            params.set("q", query)
            router.push(`/chat?${params.toString()}`)
        } else {
            router.push("/chat")
        }
    }

    return (
        <>
            <div className="fixed bottom-4 right-4 z-50 text-muted-foreground text-xs hidden md:block backdrop-blur-md bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
                Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"><span className="text-xs">⌘</span>K</kbd> to navigate
            </div>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <div className="bg-background/80 backdrop-blur-xl border-border">
                    <CommandInput
                        placeholder="Search or ask my AI..."
                        className="font-mono"
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList className="font-sans">
                        <CommandEmpty>
                            <button
                                onClick={askAI}
                                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Sparkles className="w-4 h-4 text-primary" />
                                Ask AI: &ldquo;{query}&rdquo;
                            </button>
                        </CommandEmpty>

                        <CommandGroup heading="Sections">
                            <CommandItem onSelect={() => scrollTo("experience")}>
                                <Briefcase className="mr-2 h-4 w-4" />
                                Experience
                            </CommandItem>
                            <CommandItem onSelect={() => scrollTo("projects")}>
                                <Code2 className="mr-2 h-4 w-4" />
                                Projects
                            </CommandItem>
                            <CommandItem onSelect={() => scrollTo("skills")}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Skills
                            </CommandItem>
                            <CommandItem onSelect={() => scrollTo("education")}>
                                <GraduationCap className="mr-2 h-4 w-4" />
                                Education
                            </CommandItem>
                            <CommandItem onSelect={() => scrollTo("chat")}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                AI Chat
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="Quick Ask">
                            <CommandItem onSelect={() => navigate("/chat?q=Tell+me+about+yourself")}>
                                <Terminal className="mr-2 h-4 w-4" />
                                Tell me about yourself
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/chat?q=What+are+your+top+projects%3F")}>
                                <Terminal className="mr-2 h-4 w-4" />
                                What are your top projects?
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("/chat?q=Summarize+your+experience")}>
                                <Terminal className="mr-2 h-4 w-4" />
                                Summarize your experience
                            </CommandItem>
                        </CommandGroup>

                        <CommandSeparator />

                        <CommandGroup heading="Actions">
                            <CommandItem onSelect={() => navigate("/resume.pdf", true)}>
                                <FileText className="mr-2 h-4 w-4" />
                                View Resume
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("https://github.com/Nihar4", true)}>
                                <Github className="mr-2 h-4 w-4" />
                                GitHub
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("https://www.linkedin.com/in/niharpatel4", true)}>
                                <Linkedin className="mr-2 h-4 w-4" />
                                LinkedIn
                            </CommandItem>
                            <CommandItem onSelect={() => navigate("mailto:niharpatel718@gmail.com")}>
                                <Mail className="mr-2 h-4 w-4" />
                                Email
                            </CommandItem>
                            <CommandItem onSelect={() => { setOpen(false); setTheme(theme === "dark" ? "light" : "dark") }}>
                                {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                                Toggle {theme === "dark" ? "Light" : "Dark"} Mode
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </div>
            </CommandDialog>
        </>
    )
}
