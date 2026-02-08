"use client"

import { motion } from "framer-motion"

export function ActiveStatus() {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-md border border-border/50 shadow-sm w-fit">
            <div className="relative flex h-2.5 w-2.5">
                <motion.span
                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"
                ></motion.span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
            </div>
            <span className="text-xs font-medium text-foreground/80 font-mono">
                Open to work: 2026 Internships
            </span>
        </div>
    )
}
