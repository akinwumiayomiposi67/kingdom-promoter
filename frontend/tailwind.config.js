/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a3c6e',
        accent: '#f59e0b',
      },
    },
  },
  plugins: [],
};
