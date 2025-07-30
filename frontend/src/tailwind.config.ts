import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // All your components/pages
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A1A1A',
        secondary: '#4A4A4A',
        background: '#F9FAFB',
        card: '#FFFFFF',
        accent: '#FF5555',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        md: '0 4px 8px rgba(0,0,0,0.05)',
        lg: '0 8px 16px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [forms],
};

export default config;
