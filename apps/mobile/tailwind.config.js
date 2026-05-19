/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit_400Regular'],
      },
      colors: {
        // Civic Research Hub brand colors matching web theme
        background: '#000000',
        foreground: '#FAFAFA', // oklch(0.98 0 0)

        card: {
          DEFAULT: '#1F1F1F', // oklch(0.12 0 0)
          foreground: '#FAFAFA',
        },

        primary: {
          DEFAULT: '#F11A23', // oklch(0.56 0.24 25) - hot red
          foreground: '#FAFAFA',
        },

        secondary: {
          DEFAULT: '#2E2E2E', // oklch(0.18 0 0)
          foreground: '#FAFAFA',
        },

        muted: {
          DEFAULT: '#282828', // oklch(0.16 0 0)
          foreground: '#999999', // oklch(0.6 0 0)
        },

        accent: {
          DEFAULT: '#F11A23',
          foreground: '#FAFAFA',
        },

        destructive: {
          DEFAULT: '#DC2626', // red-600
          foreground: '#FAFAFA',
        },

        border: '#383838', // oklch(0.22 0 0)
        input: '#2E2E2E', // oklch(0.18 0 0)
        ring: '#F11A23',

        // Status colors
        online: '#B8E986', // oklch(0.72 0.2 145)

        // Category colors matching web
        category: {
          bars: '#A855F7', // purple
          adult: '#EF4444', // red
          fitness: '#22C55E', // green
          events: '#EAB308', // yellow
          health: '#3B82F6', // blue
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
