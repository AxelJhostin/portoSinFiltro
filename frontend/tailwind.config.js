/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta reducida — menos saturación que el prototipo original
        brand: {
          yellow: '#D4A017',   // antes #FFD400 — más ámbar, menos neón
          red:    '#B83232',   // antes #E11900 — más oscuro, menos gritón
          green:  '#0E7A45',   // igual, es institucional
          amber:  '#C87D00',   // tono tierra para alertas
        },
        surface: {
          base:  '#F7F6F2',    // fondo principal — casi blanco cálido
          card:  '#FFFFFF',    // tarjetas
          muted: '#EBEBEB',    // bordes, separadores
        },
        ink: {
          DEFAULT: '#1A1A1A',  // texto principal
          soft:    '#555555',  // texto secundario
          faint:   '#999999',  // placeholders, metadatos
        },
      },
      fontFamily: {
        headline: ['Anton', 'sans-serif'],
        body:     ['Archivo', 'sans-serif'],
        mono:     ['"Space Mono"', 'monospace'],
      },
      borderRadius: {
        card: '6px',
      },
    },
  },
  plugins: [],
};
