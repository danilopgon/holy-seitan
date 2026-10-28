"use client"

import {useEffect, useState} from "react"
import {Monitor, Moon, Sun} from "lucide-react"
import {useTheme} from "next-themes"

const themes = [
    {value: "system", label: "Sistema", Icon: Monitor},
    {value: "light", label: "Claro", Icon: Sun},
    {value: "dark", label: "Oscuro", Icon: Moon},
] as const

const button =
    "inline-flex size-11 items-center justify-center rounded-sm text-muted-foreground hover:text-primary active:opacity-70 transition-[color,opacity] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

export function ThemeToggle() {
    const {theme, setTheme} = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    // The stored theme is only known on the client: keep the slot, skip the icon until then
    if (!mounted) return <span className={button} aria-hidden="true"/>

    const index = Math.max(0, themes.findIndex((t) => t.value === theme))
    const current = themes[index]
    const next = themes[(index + 1) % themes.length]

    return (
        <button
            type="button"
            onClick={() => setTheme(next.value)}
            className={button}
            aria-label={`Tema: ${current.label}. Cambiar a ${next.label.toLowerCase()}`}
            title={`Tema: ${current.label}`}
        >
            <current.Icon className="h-5 w-5" aria-hidden="true"/>
        </button>
    )
}
