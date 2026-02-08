"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface BentoGridProps {
    children: ReactNode
    className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    )
}

export function BentoGridItem({
    className,
    children,
    colSpan = 1
}: {
    className?: string,
    children: ReactNode,
    colSpan?: number
}) {
    return (
        <div className={cn(
            "row-span-1 rounded-xl group/bento transition duration-200 shadow-input dark:shadow-none bg-background border border-sidebar-border justify-between flex flex-col space-y-4",
            colSpan === 2 ? "md:col-span-2" : "md:col-span-1",
            className
        )}>
            {children}
        </div>
    )
}
