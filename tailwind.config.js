/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050608",
        ice: "#dfe9ff",
        hud: "#45d9ff",
        ember: "#8bb7ff"
      },
      boxShadow: {
        glow: "0 0 30px rgba(69, 217, 255, 0.18)",
        glowStrong: "0 0 60px rgba(69, 217, 255, 0.28)"
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
