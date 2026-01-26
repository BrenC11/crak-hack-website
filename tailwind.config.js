/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050608",
        ice: "#dfe9ff",
        hud: "#3fc2ff",
        ember: "#8bb7ff",
        hack: "#ff2f3e",
        emberHack: "#ff6b73"
      },
      boxShadow: {
        glow: "0 0 30px rgba(63, 194, 255, 0.18)",
        glowStrong: "0 0 60px rgba(63, 194, 255, 0.28)",
        hackGlow: "0 0 35px rgba(255, 47, 62, 0.24)"
      },
      keyframes: {
        hudPulse: {
          "0%, 100%": { opacity: 0.2 },
          "50%": { opacity: 0.6 }
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        scan: {
          "0%": { transform: "translateY(-10%)" },
          "100%": { transform: "translateY(10%)" }
        }
      },
      animation: {
        hudPulse: "hudPulse 4s ease-in-out infinite",
        rise: "rise 1.2s ease-out forwards",
        scan: "scan 12s ease-in-out infinite alternate"
      }
    }
  },
  plugins: []
};
