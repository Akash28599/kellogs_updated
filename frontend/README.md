# Kellogg's Mother's Day Campaign - Frontend

A beautiful React frontend for the Mother's Day superhero face-swap campaign.

## Features

- **Theme Selection**: Choose from 5 different superhero mom themes
- **Drag & Drop Upload**: Easy image upload with preview
- **Real-time Progress**: Step-by-step progress indicator
- **Animated UI**: Beautiful animations with Framer Motion
- **Responsive Design**: Works on all device sizes
- **Download Results**: Download the generated superhero image

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

```bash
npm install
```

## Running the App

### Development
```bash
npm run dev
```

The app will run on `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## Themes Available

1. **Captain Early Riser** - Time Champion (Morning routine hero)
2. **The Juggling Genius** - Multi-Tasker (Master of many missions)
3. **Kitchen Commander** - MasterChef (Culinary crusader)
4. **Professor Patience** - Homework Hero (Guardian of good grades)
5. **Dream Defender** - Bedtime Guardian (Protector of peaceful nights)

## Project Structure

```
├── src/
│   ├── App.jsx        # Main application component
│   ├── App.css        # App-specific styles
│   ├── index.css      # Global styles and design system
│   └── main.jsx       # React entry point
├── index.html         # HTML template with SEO
├── vite.config.js     # Vite configuration
└── package.json
```

## Design System

The app uses a custom design system with:
- **Kellogg's Brand Colors**: Red (#E31937), Gold (#FFB81C)
- **Glassmorphism**: Modern glass-like UI effects
- **Gradient Backgrounds**: Dynamic animated backgrounds
- **Micro-animations**: Smooth transitions and hover effects

## Dependencies

- **React 18**: UI library
- **Vite**: Build tool
- **Framer Motion**: Animations
- **React Dropzone**: File upload
- **React Icons**: Icon library
- **Axios**: HTTP client

## Environment

The frontend expects the backend to run on `http://localhost:5000`. 
To change this, update the `API_URL` constant in `App.jsx`.

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## License

Proprietary - Kellogg's internal use only
