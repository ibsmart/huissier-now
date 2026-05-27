/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Couleur primaire (or) ─────────────────────────────
        // Modifier ces 5 valeurs pour changer toute l'UI
        primary: {
          50:  '#FAF6EC',  // fond crème clair
          100: '#F0E0B0',  // bordure légère
          200: '#DFC06A',  // bordure visible / spinner
          500: '#C9A84C',  // or vif
          600: '#C9A84C',  // or vif (alias 600 = 500)
          700: '#A07828',  // or foncé (hover, active)
        },
        // ── Sémantique (ne pas changer) ───────────────────────
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
      },
      // ── Dégradés utilitaires ──────────────────────────────
      backgroundImage: {
        'grad-hero':   'linear-gradient(160deg, #080808 0%, #2A1A00 45%, #C9A84C 100%)',
        'grad-header': 'linear-gradient(135deg, #111111 0%, #2A1A00 50%, #A07828 100%)',
        'grad-btn':    'linear-gradient(135deg, #C9A84C 0%, #A07828 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      minHeight: {
        touch: '56px',
      },
    },
  },
  plugins: [],
}
