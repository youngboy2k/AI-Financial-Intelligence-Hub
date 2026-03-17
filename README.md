# AI Financial Intelligence Hub

A real-time financial dashboard powered by Gemini AI with Google Search grounding. This application provides up-to-the-minute data on global exchange rates, oil prices, and major stock indices.

## Features

- **Real-time Data**: Fetches the latest financial indicators using Gemini 3 Flash and Google Search.
- **Multi-language Support**: Seamlessly switch between English and Korean.
- **Stale-While-Revalidate Caching**: Instant UI updates using local storage with background data refreshing.
- **Drag-and-Drop Interface**: Customize your dashboard by reordering cards.
- **Responsive Design**: Optimized for mobile, tablet, and desktop views.
- **Accessibility**: Built with ARIA labels and keyboard navigation support.
- **Error Resilience**: Includes retry logic for API calls and a global error boundary.

## Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Vite 6
- **Styling**: Tailwind CSS 4
- **Animations**: Motion (formerly Framer Motion)
- **Icons**: Lucide React
- **AI**: Google Gemini SDK (@google/genai) using Gemini 3 Flash
- **Data Visualization**: Recharts
- **Content Rendering**: React Markdown
- **Drag & Drop**: @dnd-kit

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`
3. Set up your environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key.
4. Run the development server: `npm run dev`

## Project Structure

- `src/App.tsx`: Main application logic and layout.
- `src/services/geminiService.ts`: Gemini AI integration and data fetching.
- `src/components/FinanceCard.tsx`: Reusable card component for financial metrics.
- `src/constants.ts`: Translations and global constants.
- `src/index.css`: Global styles and Tailwind configuration.

## License

MIT
