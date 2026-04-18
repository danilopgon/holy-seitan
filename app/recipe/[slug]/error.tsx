/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: Next.js requiere el componente Error. */
'use client';

import {Button} from "@/components/ui/button";

export default function Error({error, reset}: { error: Error; reset: () => void }) {
    const isDev = process.env.NODE_ENV === 'development'
    return (
        <main className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-mono font-semibold tracking-tight text-foreground mb-3">No se pudo cargar la receta</h1>
            <p className="text-sm text-muted-foreground mb-8">
                {isDev ? error.message : "Ha ocurrido un error inesperado"}
            </p>
            <Button type="button" onClick={reset} className="font-mono">
                Reintentar
            </Button>
        </main>
    );
}
