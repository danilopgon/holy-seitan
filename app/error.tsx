/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: Next.js requiere el componente Error. */
'use client'

export default function Error({error, reset}: { error: Error; reset: () => void }) {
    return (
        <main className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-mono font-semibold tracking-tight text-foreground mb-3">Algo fue mal</h1>
            <p className="text-sm text-muted-foreground mb-8">{error.message}</p>
            <button
                className="font-mono text-sm text-primary underline hover:text-primary/80 transition-colors"
                type="button"
                onClick={() => reset()}
            >
                Reintentar
            </button>
        </main>
    );
}
