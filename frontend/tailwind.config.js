/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#6366f1", // Indigo 500
                secondary: "#a855f7",
                background: "#0f172a", // Darker slate
                surface: "#1e293b", // Slate 800
                dark: {
                    bg: "#121212",
                    card: "#1E1E1E",
                    border: "#333333"
                }
            }
        },
    },
    darkMode: 'class',
    plugins: [],
}
