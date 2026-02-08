"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Terminal, ArrowUpRight } from "lucide-react"

interface ProjectCardProps {
    title: string
    description: string
    techStack: string[]
    category: string
    date: string
    className?: string
    logs?: string[]
}

const defaultLogs = [
    "> Initializing startup sequence...",
    "> Connected to Redis cluster",
    "> Verified database schema integrity",
    "> Loaded 14 API routes",
    "> Server listening on port 3000 🚀",
]

export function ProjectCard({
    title,
    description,
    techStack,
    category,
    date,
    className,
    logs,
}: ProjectCardProps) {
    const [isHovered, setIsHovered] = useState(false)
    const displayLogs = logs && logs.length > 0 ? logs : defaultLogs

    return (
        <motion.div
            layoutId={`card-${title}`}
            className={className}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Card className="h-full bg-card/70 backdrop-blur-xl border-border/60 hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden">
                {/* Hover Gradient Glow */}
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                                {date ? `${category} • ${date}` : category}
                            </span>
                            <CardTitle className="text-xl font-medium flex items-center gap-2 group-hover:text-primary transition-colors">
                                {title}
                                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardTitle>
                        </div>
                        <Terminal className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/80 transition-colors" />
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm line-clamp-3">
                        {description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {techStack.map((tech) => (
                            <Badge
                                key={tech}
                                variant="outline"
                                className="bg-transparent border-border/50 text-xs font-mono group-hover:border-primary/30 transition-colors"
                            >
                                {tech}
                            </Badge>
                        ))}
                    </div>

                    {/* Live Log Overlay on Hover */}
                    <AnimatePresence>
                        {isHovered && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute inset-0 bg-background/95 backdrop-blur-3xl p-6 flex flex-col justify-start font-mono text-xs text-emerald-600 dark:text-emerald-400/90 z-20"
                            >
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                                </div>
                                <div className="space-y-1 pt-8">
                                    {displayLogs.map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            {log}
                                        </motion.div>
                                    ))}
                                    <motion.div
                                        animate={{ opacity: [0, 1] }}
                                        transition={{ repeat: Infinity, duration: 0.8 }}
                                        className="h-3 w-1.5 bg-emerald-500 inline-block align-middle ml-1"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    )
}
