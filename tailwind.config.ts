import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        citi: {
          blue: '#003B70',
          'blue-dark': '#002855',
          'blue-light': '#0066B3',
          red: '#D22630',
          gold: '#C8963C',
          'gray-50': '#F8F9FA',
          'gray-100': '#F1F3F4',
          'gray-200': '#E8EAED',
          'gray-300': '#DADCE0',
          'gray-400': '#BDC1C6',
          'gray-500': '#80868B',
          'gray-600': '#5F6368',
          'gray-700': '#3C4043',
          'gray-800': '#202124',
          green: '#1A8C4E',
          'green-light': '#E8F5EE',
          'red-light': '#FDE8E9',
          'blue-50': '#E8F0F9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)',
        'modal': '0 20px 60px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
export default config;