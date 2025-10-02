# MyNook - AI-Powered Interior Design

Transform your space with AI-powered interior design. MyNook is an intelligent design assistant that helps you visualize and create beautiful, personalized rooms using advanced artificial intelligence.

## Features

-   **Room Transformation**: Upload a photo of your room (Module 1) to see it redesigned.
-   **Inspiration Images**: Optionally provide style reference photos (Module 2) to guide the AI.
-   **Advanced Text Prompts**: Describe the desired interior style with detailed text prompts.
-   **Prompt Templates**: Get started quickly with a curated list of popular interior design styles.
-   **Batch Generation**: Generate multiple design concepts at once, each combining the room photo with a different inspiration image.
-   **Single Image Generation**: Use just a room photo and a prompt for a single, focused transformation.
-   **Interactive UI**: Modern, responsive interface with image previews, loading states, and error handling.
-   **Result Actions**: Download, regenerate, or view generated designs in full-screen.

## How It Works

1.  **Upload Your Room**: Add the photo of the room you want to transform. This is the main subject.
2.  **(Optional) Add Inspiration**: Add one or more photos that define the style, texture, or composition you're aiming for.
3.  **Describe the Style**: Write a detailed text prompt in the text area, or click on a pre-made style template to auto-fill it.
4.  **Generate**: Click the "Generate" button. The app will process your request, using the Gemini model to combine your room photo with your prompt (and each inspiration image if provided).
5.  **View Results**: Your new interior designs will appear on the right. You can click on them to view them larger, download them, or try generating them again.

## Tech Stack

-   **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
-   **AI**: [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Animation**: [Framer Motion](https://www.framer.com/motion/)

## Getting Started

To run this project locally, you will need to have Node.js installed and a Google Gemini API key.

### Prerequisites

-   Node.js and npm (or yarn).
-   A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Setup

1.  **Clone the repository** (or download the source code).

2.  **Install dependencies** by running the following command in the project's root directory:
    ```bash
    npm install
    ```

3.  **Set up your API Key**.
    The application loads the Gemini API key from the environment variable `process.env.API_KEY`. You will need to ensure this variable is set in your local development environment. One common way to do this is by using a `.env` file, but the method may vary depending on your development server setup.

4.  **Start the development server**:
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to the local address provided in your terminal (e.g., `http://localhost:5173`).

## File Structure

Here is an overview of the key files and directories in the project:

```
/
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable React components (Button, Icons, etc.)
│   ├── services/          # API calls to Gemini (geminiService.ts)
│   ├── utils/             # Helper functions (imageUtils.ts)
│   ├── App.tsx            # Main application component and layout
│   ├── index.tsx          # React entry point
│   ├── constants.ts       # Static data like prompt templates
│   └── types.ts           # TypeScript type definitions
├── index.html             # Main HTML file
└── README.md              # Project documentation
```