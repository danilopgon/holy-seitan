"use client"

import ReactMarkdown from "react-markdown"
import {cn} from "@/lib/utils"

interface MarkdownRendererProps {
    content: string
    className?: string
}

export function MarkdownRenderer({content, className}: MarkdownRendererProps) {
    return (
        <div className={cn("prose prose-neutral dark:prose-invert max-w-none", className)}>
            <ReactMarkdown
                components={{
                    h1: ({children}) => (
                        <h1 className="text-3xl font-mono font-bold text-foreground mb-4 mt-8 first:mt-0">{children}</h1>
                    ),
                    h2: ({children}) => <h2
                        className="text-2xl font-mono font-bold text-foreground mb-3 mt-6">{children}</h2>,
                    h3: ({children}) => <h3
                        className="text-xl font-mono font-bold text-foreground mb-2 mt-4">{children}</h3>,
                    p: ({children}) => <p className="text-foreground leading-relaxed mb-4">{children}</p>,
                    ul: ({children}) => <ul
                        className="list-disc list-inside space-y-2 mb-4 text-foreground">{children}</ul>,
                    ol: ({children}) => <ol
                        className="list-decimal list-inside space-y-2 mb-4 text-foreground">{children}</ol>,
                    li: ({children}) => <li className="leading-relaxed">{children}</li>,
                    strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
                    em: ({children}) => <em className="italic">{children}</em>,
                    code: ({children}) => (
                        <code
                            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">{children}</code>
                    ),
                    blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                            {children}
                        </blockquote>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}
