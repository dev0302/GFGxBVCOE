/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
        'alfa': ['"Alfa Slab One"', 'serif'],
        'audiowide': ['Audiowide', 'sans-serif'],
      },
      colors: {
        primary: '#6c5ce7',
        secondary: '#a29bfe',
        dark: '#1e272e',
        darker: '#0f1519',
        light: '#f5f6fa',
        danger: '#ff7675',
        success: '#55efc4',

        richblack: {
          5: "#F1F2FF",
          25: "#DBDDEA",
          100: "#AFB2BF",
          200: "#999DAA",
          700: "#2C333F",
          800: "#161D29",
          900: "#000814",
        },
        blue: {
          100: "#47A5C5",
        },
        pink: {
          200: "#EF476F",
        },
        yellow: {
          50: "#FFD60A",
        },
      },
    }
  },
  plugins: [],
}