"use client"

import {useId, useState} from "react"
import {useWakeLock, type WakeLockStatus} from "@/hooks/use-wake-lock"
import {cn} from "@/lib/utils"

const messages: Partial<Record<WakeLockStatus, string>> = {
    unsupported: "Este navegador no permite mantener la pantalla encendida.",
    pending: "Activando…",
    on: "La pantalla no se apagará mientras tengas abierta la receta.",
    error: "No se ha podido mantener la pantalla encendida. Prueba de nuevo.",
}

// A native switch: Radix's hidden form input renders differently on server and client here
export function WakeLockToggle() {
    const id = useId()
    const [enabled, setEnabled] = useState(false)
    const status = useWakeLock(enabled)
    const unsupported = status === "unsupported"
    const checked = enabled && !unsupported

    return (
        <div className="flex flex-col gap-1">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-describedby={`${id}-status`}
                disabled={unsupported}
                onClick={() => setEnabled((v) => !v)}
                className="group flex min-h-11 items-center gap-3 rounded-sm text-left font-mono text-sm whitespace-nowrap active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        "inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors",
                        checked ? "bg-primary" : "bg-input",
                    )}
                >
                    <span
                        className={cn(
                            "block size-4 rounded-full bg-background shadow-xs transition-transform",
                            checked ? "translate-x-4" : "translate-x-0.5",
                        )}
                    />
                </span>
                Mantener pantalla encendida
            </button>
            <p id={`${id}-status`} className="text-sm text-muted-foreground" aria-live="polite">
                {enabled || unsupported ? messages[status] : null}
            </p>
        </div>
    )
}
