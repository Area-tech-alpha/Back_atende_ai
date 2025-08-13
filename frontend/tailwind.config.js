/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Semântica para Dark Mode
        'background': '#18181b', // Cor de fundo principal (Zinc 950)
        'surface': '#27272a',    // Cor para cards, sidebars, etc. (Zinc 900)
        'muted': '#3f3f46',      // Para hovers e elementos interativos sutis (Zinc 800)
        'border': '#52525b',     // Para bordas (Zinc 700)

        'text-primary': '#fafafa',   // Texto principal, títulos (Zinc 50)
        'text-secondary': '#a1a1aa', // Texto secundário, parágrafos (Zinc 400)
        
        // Cor de Destaque (Accent)
        primary: {
          DEFAULT: '#EAB308', // Amarelo (Yellow 500) - Um pouco mais rico que o anterior
          dark: '#CA8A04',   // Para hovers no botão principal (Yellow 600)
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        // Sombra com a cor primária para um efeito de brilho
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