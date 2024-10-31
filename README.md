# AI Chat Application

A Next.js AI chat application that allows users to have conversations with an AI assistant powered by OpenAI's GPT models.

## Features

- Real-time chat interface with AI
- Multiple chat sessions with editable titles
- Sidebar for managing chat sessions
- Message streaming for responsive AI replies
- Local storage for persisting chat history

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up your OpenAI API key in your environment variables
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Customization

You can customize the AI model and system prompt in the `streamMessage` function in `actions/stream-message.ts`.
