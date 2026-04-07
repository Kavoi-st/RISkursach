/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        primaryDark: '#1d4ed8',
        accent: '#10b981'
      }
    }
  },
  plugins: []
};

