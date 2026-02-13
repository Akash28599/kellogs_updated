/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'kelloggs-red': '#F60945',
                'kelloggs-pink': '#FF4D6D',
                'brand-yellow': '#FFC700',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Poppins', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
