import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  isEditor: boolean
  editToken: string | null

  checkEditToken: (token: string) => boolean
  setEditor: (value: boolean) => void
  logout: () => void
}

const EDIT_TOKEN = process.env.NEXT_PUBLIC_EDIT_TOKEN || "admin123"
console.log("[AuthStore] EDIT_TOKEN configured:", EDIT_TOKEN ? "SET" : "NOT SET")

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isEditor: false,
      editToken: null,

      checkEditToken: (token) => {
        console.log("[AuthStore] Checking token...")
        const isValid = token === EDIT_TOKEN
        console.log("[AuthStore] Token valid:", isValid)
        if (isValid) {
          set({ isEditor: true, editToken: token })
          console.log("[AuthStore] Editor mode enabled")
        }
        return isValid
      },

      setEditor: (value) => set({ isEditor: value }),

      logout: () => set({ isEditor: false, editToken: null }),
    }),
    {
      name: "org-mso-auth",
    }
  )
)
