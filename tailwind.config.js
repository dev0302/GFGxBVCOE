/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', 'class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			montserrat: [
  				'Montserrat',
  				'sans-serif'
  			],
  			nunito: [
  				'Nunito',
  				'sans-serif'
  			],
  			alfa: [
  				'Alfa Slab One"',
  				'serif'
  			],
  			audiowide: [
  				'Audiowide',
  				'sans-serif'
  			],
			rounded: ["'M PLUS Rounded 1c'", "sans-serif"],
			changa: ["Changa", "sans-serif"],
  		},
  		colors: {
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			dark: '#1e272e',
  			darker: '#0f1519',
  			light: '#f5f6fa',
  			danger: '#ff7675',
  			success: '#55efc4',
  			richblack: {
  				'5': '#F1F2FF',
  				'25': '#DBDDEA',
  				'100': '#AFB2BF',
  				'200': '#999DAA',
  				'700': '#2C333F',
  				'800': '#161D29',
  				'900': '#000814'
  			},
  			blue: {
  				'100': '#47A5C5'
  			},
  			pink: {
  				'200': '#EF476F'
  			},
  			yellow: {
  				'50': '#FFD60A'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		animation: {
  			fadeIn: 'fadeIn 0.6s ease-out',
  			bounce: 'bounce 2s infinite ease-in-out',
  			shine: 'shine 2s linear infinite'
  		},
  		keyframes: {
  			fadeIn: {
  				from: {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				to: {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			bounce: {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-10px)'
  				}
  			},
  			shine: {
  				'0%': {
  					transform: 'translateX(-100%) rotate(25deg)'
  				},
  				'100%': {
  					transform: 'translateX(200%) rotate(25deg)'
  				}
  			},
  			typing: {
  				'0%, 100%': { transform: 'translateY(0)', opacity: '0.5' },
  				'50%': { transform: 'translateY(-2px)', opacity: '1' }
  			},
  			'loading-dots': {
  				'0%, 100%': { opacity: '0' },
  				'50%': { opacity: '1' }
  			},
  			wave: {
  				'0%, 100%': { transform: 'scaleY(1)' },
  				'50%': { transform: 'scaleY(0.6)' }
  			},
  			blink: {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0' }
  			},
  			'text-blink': {
  				'0%, 100%': { color: 'hsl(var(--primary))' },
  				'50%': { color: 'hsl(var(--muted-foreground))' }
  			},
  			'bounce-dots': {
  				'0%, 100%': { transform: 'scale(0.8)', opacity: '0.5' },
  				'50%': { transform: 'scale(1.2)', opacity: '1' }
  			},
  			'thin-pulse': {
  				'0%, 100%': { transform: 'scale(0.95)', opacity: '0.8' },
  				'50%': { transform: 'scale(1.05)', opacity: '0.4' }
  			},
  			'pulse-dot': {
  				'0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
  				'50%': { transform: 'scale(1.5)', opacity: '1' }
  			},
  			shimmer: {
  				'0%': { backgroundPosition: '200% 50%' },
  				'100%': { backgroundPosition: '-200% 50%' }
  			},
  			'wave-bars': {
  				'0%, 100%': { transform: 'scaleY(1)', opacity: '0.5' },
  				'50%': { transform: 'scaleY(0.6)', opacity: '1' }
  			},
  			'spinner-fade': {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' }
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}