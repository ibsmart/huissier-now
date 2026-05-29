import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Lang = 'fr' | 'ar'

interface LangStore {
  lang: Lang
  setLang: (l: Lang) => void
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: 'fr',
      setLang: (lang) => {
        set({ lang })
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
      },
    }),
    { name: 'lang' }
  )
)
