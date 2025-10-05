import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-mono font-bold text-foreground mb-4">Receta No Encontrada</h1>
        <p className="text-muted-foreground mb-8">La receta que buscas no existe.</p>
        <Link href="/">
          <Button className="font-mono">Volver a Recetas</Button>
        </Link>
      </main>
    </div>
  )
}
