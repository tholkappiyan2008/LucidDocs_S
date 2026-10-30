/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ClearDoc primary design system palette
        'deep-teal': '#003135',
        'ocean-teal': '#024950',
        terracotta: '#964734',
        terra: '#964734',
        clay: '#964734',
        'bright-cyan': '#0FA4AF',
        'light-cyan': '#AFDDE5',
        aqua: {
          DEFAULT: '#0FA4AF',
          light: '#AFDDE5',
          deep: '#024950',
        },
        ink: {
          DEFAULT: '#003135',
          deep: '#003135',
          ocean: '#024950',
        },
        surface: '#F5F7F5',
        canvas: '#F5F7F5',
        brand: {
          teal: '#003135',
          ocean: '#024950',
          terracotta: '#964734',
          cyan: '#0FA4AF',
          cyanLight: '#AFDDE5',
          bg: '#F5F7F5',
          white: '#FFFFFF',
        },

        // ClearDoc luxury black & gold palette
        noir: '#08080A',      // page background — deep black
        coal: '#0C0C0E',      // deep surface (nav, footer, hero panels)
        graphite: '#141417',  // raised card / panel surface
        gold: {
          DEFAULT: '#C8A15E', // antique gold — primary accent & actions
          light: '#E6CE9B',   // champagne — hover & highlights
          deep: '#8A6E3B',    // bronze — hairlines & quiet accents
        },
        ivory: {
          DEFAULT: '#F5F1E8', // primary text on black
          dim: '#A49C8F',     // secondary / muted text
        },
        ember: '#C1584B',     // destructive + error states only
      },
      fontFamily: {
        // Aeonik (CoType Foundry) is a commercial licence; Manrope is the
        // documented metric fallback. Indic families keep Tamil/Telugu/Hindi
        // copy typographically consistent.
        sans: [
          'Aeonik',
          'Manrope',
          'Noto Sans Devanagari',
          'Noto Sans Tamil',
          'Noto Sans Telugu',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      maxWidth: {
        shell: '84rem',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.15' },
          '50%': { transform: 'translateY(420%)', opacity: '1' },
        },
        rise: {
          '0%': { transform: 'translateY(6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        sheen: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        scan: 'scan 5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        rise: 'rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        sheen: 'sheen 6s linear infinite',
      },
    },
  },
  plugins: [],
}
