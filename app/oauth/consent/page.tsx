import type {Metadata} from "next"
import {OAuthConsent} from "@/components/oauth-consent"

export const metadata: Metadata = {title: "Conectar aplicación — Holy Seitan", robots: {index: false}}

export default async function ConsentPage({searchParams}: { searchParams: Promise<{ authorization_id?: string }> }) {
    const {authorization_id} = await searchParams

    return (
        <main className="container mx-auto flex items-center justify-center px-4 py-16">
            <OAuthConsent authorizationId={authorization_id}/>
        </main>
    )
}
