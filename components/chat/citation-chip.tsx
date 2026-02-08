"use client"

import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

interface CitationChipProps {
    label: string
    onClick?: () => void
}

export function CitationChip({ label, onClick }: CitationChipProps) {
    return (
        <Badge
            variant="outline"
            className="cursor-pointer hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-colors gap-1 inline-flex items-center my-0.5 mx-1"
            onClick={onClick}
        >
            <span className="text-[10px]">SRC</span>
            {label}
            <ExternalLink className="h-2 w-2 opacity-50" />
        </Badge>
    )
}
