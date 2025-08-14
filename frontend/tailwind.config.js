/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- SEU TEMA CLARO (BRANCO E AMARELO) ---
        primary: {
          DEFAULT: '#FFD700', // Amarelo principal
          light: '#FFE44D',
          dark: '#FFC107',
        },
        secondary: {
          DEFAULT: '#FFFFFF', // Branco principal
          dark: '#F5F5F5',
          darker: '#E0E0E0',
        },
        accent: {
          DEFAULT: '#1A1A1A', // Preto para contraste
          light: '#2D2D2D',
        },
        
        // --- VARIÁVEIS PARA O FUTURO DARK MODE ---
        'background': '#18181b',
        'surface': '#27272a',
        'muted': '#3f3f46',
        'border': '#52525b',
        'text-primary': '#fafafa',
        'text-secondary': '#a1a1aa',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 15px rgba(255, 215, 0, 0.3)',
        'glow-primary': '0 0 15px rgba(234, 179, 8, 0.3)',
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        // ... seus keyframes podem continuar os mesmos
      },
    },
  },
  plugins: [],
};
