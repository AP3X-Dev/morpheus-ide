// File: morpheus-ide-main/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#1e1e1e',
          sidebar: '#252526',
          active: '#37373d',
          border: '#3e3e3e',
          text: '#cccccc',
          icon: '#858585',
        },
      },
    },
  },
  plugins: [],
};
