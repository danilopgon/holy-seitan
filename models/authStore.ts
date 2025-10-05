export type AuthStore = {
    user: { email: string; isAdmin: boolean } | null
    login: (email: string, password: string) => Promise<boolean>
    logout: () => void
    isAuthenticated: () => boolean
}