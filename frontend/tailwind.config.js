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
        canvas: '#fbfbfd',
        surface: '#ffffff',
        subtle: '#f5f5f7',
        'subtle-hover': '#ebebef',
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0071e3',
          600: '#0062c4',
          700: '#004fa1',
        },
        present: {
          DEFAULT: '#0071e3',
          light: '#e8f2fe',
          border: '#b8d9fc'
        },
        late: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7',
          border: '#fde68a'
        },
        absent: {
          DEFAULT: '#9ca3af',
          light: '#f3f4f6',
          border: '#e5e7eb'
        },
        apple: {
          bg: '#fbfbfd',
          surface: '#ffffff',
          card: '#ffffff',
          border: '#e5e7eb',
          subtle: '#f5f5f7',
          text: '#1d1d1f',
          muted: '#86868b',
          blue: '#0071e3',
          blueHover: '#0062c4',
        }
      },
      boxShadow: {
        'apple-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'apple-card': '0 2px 10px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'apple-card-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'apple-dropdown': '0 12px 36px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
