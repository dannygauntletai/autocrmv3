/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: 'inherit',
              textDecoration: 'underline',
              fontWeight: '500',
            },
            code: {
              color: 'inherit',
              padding: '0.2em 0.4em',
              borderRadius: '3px',
              background: 'rgba(0, 0, 0, 0.1)',
            },
            'code::before': {
              content: 'none',
            },
            'code::after': {
              content: 'none',
            },
            pre: {
              color: 'inherit',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '6px',
              padding: '0.75em 1em',
            },
            hr: {
              borderColor: 'rgba(0, 0, 0, 0.1)',
              margin: '2em 0',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}