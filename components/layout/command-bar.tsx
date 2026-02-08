"use client"

import * as React from "react"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
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
    CommandShortcut,
} from "@/components/ui/command"

export function CommandBar() {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    return (
        <>
            <div className="fixed bottom-4 right-4 z-50 text-muted-foreground text-xs hidden md:block backdrop-blur-md bg-background/50 px-3 py-1.5 rounded-full border border-border/50">
                Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"><span className="text-xs">⌘</span>K</kbd> to ask Digital Twin
            </div>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <div className="bg-background/80 backdrop-blur-xl border-border">
                    <CommandInput placeholder="Ask my digital twin about my experience..." className="font-mono" />
                    <CommandList className="font-sans">
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Suggestions">
                            <CommandItem>
                                <Terminal className="mr-2 h-4 w-4" />
                                <span>Tell me about the E-Commerce Backend</span>
                            </CommandItem>
                            <CommandItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>What is your experience with Node.js?</span>
                            </CommandItem>
                            <CommandItem>
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Show me your internship timeline</span>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Navigation">
                            <CommandItem onSelect={() => window.open("/resume.pdf", "_blank")}>
                                <User className="mr-2 h-4 w-4" />
                                <span>View Resume (PDF)</span>
                                <CommandShortcut>⌘R</CommandShortcut>
                            </CommandItem>
                            <CommandItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                                <CommandShortcut>⌘P</CommandShortcut>
                            </CommandItem>
                            <CommandItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                                <CommandShortcut>⌘S</CommandShortcut>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </div>
            </CommandDialog>
        </>
    )
}
