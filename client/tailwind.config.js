/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: '#25D366',
        secondary: '#128C7E',
        'whatsapp-green': '#00A884',
        'dark-green': '#1F8B74',
        'light-green': '#34B7F1',
        
        // Background & Surface
        background: '#0B141A',
        card: '#202C33',
        'input-bg': '#2A3942',
        'header-bg': '#1F2C33',
        'border-color': '#2A3942',
        
        // Text Colors
        text: '#E9EDEF',
        'text-secondary': '#AEBAC1',
        
        // Message Bubbles
        'bubble-sent': '#005C4B',
        'bubble-received': '#202C33',
        
        // Status Colors
        'status-online': '#25D366',
        'status-away': '#FFD700',
        'status-offline': '#AEBAC1',
      },
      borderRadius: {
        '12': '12px',
        '16': '16px',
        '20': '20px',
      },
      spacing: {
        '8': '8px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'typing': 'typing 1s infinite',
        'bounce': 'bounce 0.3s',
        'slideDown': 'slideDown 0.2s ease-out',
        'slideUp': 'slideUp 0.2s ease-out',
        'scaleIn': 'scaleIn 0.15s ease-out',
        'fadeIn': 'fadeIn 0.2s ease-out',
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        typing: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
          '100%': { transform: 'translateY(0px)' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'dropdown': '0 4px 12px rgba(0, 0, 0, 0.5)',
        'modal': '0 8px 24px rgba(0, 0, 0, 0.6)',
      },
      backdropBlur: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
      },
    },
  },
  plugins: [],
}