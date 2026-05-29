import { useLangStore } from '../store/langStore'
import { useT } from '../i18n'

export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLangStore()
  const t = useT()
  return (
    <button
      onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
      className={`flex items-center gap-1.5 text-sm font-semibold border border-gray-200 rounded-full px-3 py-1.5 bg-white shadow-sm ${className}`}
    >
      <span>{lang === 'fr' ? '🇲🇦' : '🇫🇷'}</span>
      <span>{t('lang_switch')}</span>
    </button>
  )
}
