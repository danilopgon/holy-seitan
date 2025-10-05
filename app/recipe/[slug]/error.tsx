/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: Next.js requiere el componente Error. */
'use client';

export default function Error({error, reset}: { error: Error; reset: () => void }) {
    return (
        <main className="p-6">
            <h1 className="text-xl font-semibold">No se pudo cargar la receta</h1>
            <p className="mt-2 opacity-80">{error.message}</p>
            <button className="mt-4 underline" type="button" onClick={() => reset()}>Reintentar</button>
        </main>
    );
}
