import type React from "react"
import {Suspense} from "react"
import type {Metadata} from "next"
import {GeistSans} from "geist/font/sans"
import {GeistMono} from "geist/font/mono"
import {Analytics} from "@vercel/analytics/next"
import "./globals.css"
import {Header} from "@/components/header";
import {Footer} from "@/components/footer";

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
        <html lang="en">
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
            <div className="min-h-screen bg-background">
                <Header/>
                {children}
                <Footer/>
            </div>
        </Suspense>
        <Analytics/>
        </body>
        </html>
    )
}
