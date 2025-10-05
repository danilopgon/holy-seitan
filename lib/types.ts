export interface Recipe {
  id: string
  title: string
  slug: string
  description: string
  content: string // Markdown content
  emoji: string
  prepTime: number // in minutes
  cookTime: number // in minutes
  servings: number
  difficulty: "Fácil" | "Media" | "Difícil"
  tags: string[]
  author: string
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  isAdmin: boolean
}
