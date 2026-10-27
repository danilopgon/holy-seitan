import {Analytics} from "@vercel/analytics/next"
import {GeistMono} from "geist/font/mono"
import {GeistSans} from "geist/font/sans"
import type {Metadata} from "next"
import {Noto_Emoji} from "next/font/google"
import type React from "react"
import {Suspense} from "react"
import "./globals.css"
import {Footer} from "@/components/footer";
import {Header} from "@/components/header";
import {RecipesProvider} from "@/lib/providers/recipes-provider";

const notoEmoji = Noto_Emoji({subsets: ["emoji"], weight: "variable", variable: "--font-noto-emoji"})

export const metadata: Metadata = {
    title: "Holy Seitan — Recetario Vegano de María y Dani",
    description: "Colección colaborativa de recetas veganas escritas en Markdown, ilustradas con emojis y construidas con Next.js y Supabase.",

}


export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="es">
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${notoEmoji.variable}`}>
        <Suspense fallback={null}>
            <div className="min-h-screen bg-background">
                <Header/>
                <RecipesProvider>{children}</RecipesProvider>
                <Footer/>
            </div>
        </Suspense>
        <Analytics/>
        </body>
        </html>
    )
}
