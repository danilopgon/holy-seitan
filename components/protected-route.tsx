"use client"

import {useRouter} from "next/navigation"
import {useEffect, useState} from "react"
import {supabaseBrowser} from "@/core/supabase-browser";

export function ProtectedRoute({children}: { children: React.ReactNode }) {
    const router = useRouter()
    const [ok, setOk] = useState(false)

    useEffect(() => {
        const supabase = supabaseBrowser()
        supabase.auth.getSession().then(({data}) => {
            if (!data.session) {
                router.replace("/login")
            } else {
                setOk(true)
            }
        })
    }, [router])

    if (!ok) return null
    return <>{children}</>
}
