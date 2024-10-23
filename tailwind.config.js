/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ejs}",
  
  './views/**/*.{html,ejs}', // Assurez-vous d'ajouter le chemin vers vos fichiers EJS


],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        // ... add more fonts as needed
      }

    },
  },
  plugins: [],
}