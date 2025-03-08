# Phonara - Voice Transcription App

A minimal viable product (MVP) for a voice transcription web app using Next.js with App Router, TailwindCSS, and ShadCN UI components. The app records voice, sends audio to the backend, and displays the transcription using Google Gemini 2.0 AI.

## Features

- **Voice Recording**: Record audio directly from your browser
- **Real-time Transcription**: Process audio using Google Gemini 2.0 AI
- **Modern UI**: Built with TailwindCSS and ShadCN UI components
- **Responsive Design**: Works on desktop and mobile devices
- **Low Latency**: Uses Edge functions for faster processing

## Tech Stack

- **Frontend**: Next.js (App Router), TailwindCSS, ShadCN UI, WebRTC
- **Backend**: Next.js API routes (Edge functions)
- **Speech Processing**: Google Gemini 2.0 (via Google AI API)
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Google AI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/phonara.git
   cd phonara
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add your Google AI API key:
   ```
   GOOGLE_AI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. Click the "Start Recording" button to begin recording your voice.
2. Speak clearly into your microphone.
3. Click "Stop Recording" when you're finished.
4. The app will process your audio and display the transcription.

## Future Enhancements

The codebase is structured to easily add the following features in the future:

- Audio playback
- Chat history
- Exporting transcripts
- User authentication
- Database storage

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Google Gemini AI](https://ai.google.dev/)
