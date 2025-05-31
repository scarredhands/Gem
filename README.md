# Gem - Your Personal AI Chat Assistant (Gemini Clone)

<!-- Optional: Add your project logo/banner here -->
<!-- ![Gem Project Banner/Logo](path/to/your/image.png) -->
<!-- For now, a placeholder image: -->
<p align="center">
  <img src="https://placehold.co/600x300?text=Gem+AI+Assistant" alt="Gem Project Banner">
</p>

**Gem** is a modern, responsive web application that serves as a clone of Google's Gemini, leveraging the powerful **Gemini 1.5 Pro** model to provide an intelligent and interactive chat experience. It features user authentication, image input capabilities, speech recognition, and more, all built with a robust MERN-like stack.

---

## Table of Contents

1.  [Overview](#overview)
2.  [Key Features](#key-features)
3.  [Tech Stack](#tech-stack)
4.  [Prerequisites](#prerequisites)
5.  [Getting Started](#getting-started)
    *   [Environment Setup](#environment-setup)
    *   [Server (Backend) Setup](#server-backend-setup)
    *   [Client (Frontend) Setup](#client-frontend-setup)
6.  [Usage](#usage)
7.  [Project Structure (Optional)](#project-structure-optional)
8.  [Contributing](#contributing)
9.  [License](#license)
10. [Acknowledgements](#acknowledgements)
11. [Contact](#contact)

---

## Overview

Gem aims to replicate the core functionalities of advanced AI chat assistants like Google Gemini. Users can engage in text-based conversations, provide image inputs for analysis or context, and interact using speech-to-text. The application ensures secure access through JWT-based authentication and stores user data and chat history in a MongoDB database.

---

## Key Features

*   **AI-Powered Chat:** Utilizes the **Google Gemini 1.5 Pro** model for intelligent and context-aware responses.
*   **Image Input:** Users can upload images to be processed and discussed with the AI.
*   **User Authentication:** Secure registration and login functionality using **JSON Web Tokens (JWT)**.
*   **Speech Recognition:** Integrated Webkit Speech Recognition for voice input.
*   **Speech Synthesis:** Reads out AI responses for an enhanced interactive experience.
*   **Copy Functionality:** Easily copy AI-generated responses to the clipboard.
*   **Responsive Design:** User-friendly interface adaptable to various screen sizes.
*   **MongoDB Integration:** User data, chat history (if implemented), and other application data are stored in a NoSQL MongoDB database.
*   **Real-time Interaction (Basic):** Display of AI responses with a typing effect.

---

## Tech Stack

**Frontend:**
*   React.js
*   React Router DOM (for navigation)
*   Context API (for state management)
*   CSS (for styling)
*   Webkit Speech Recognition API
*   Web Speech API (SpeechSynthesis)

**Backend:**
*   Node.js
*   Express.js (for API routing and middleware)
*   MongoDB (with Mongoose ODM for database interaction)
*   JSON Web Tokens (JWT) (for authentication)
*   Bcrypt.js (for password hashing)
*   Multer (for handling image uploads)
*   `@google/generative-ai` SDK (for interacting with the Gemini API)
*   `cors` (for Cross-Origin Resource Sharing)
*   `dotenv` (for environment variable management)

**Database:**
*   MongoDB (NoSQL database)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:
*   [Node.js](https://nodejs.org/) (v14.x or later recommended)
*   [npm](https://www.npmjs.com/) (Node Package Manager, comes with Node.js) or [Yarn](https://yarnpkg.com/)
*   [MongoDB](https://www.mongodb.com/try/download/community) installed and running, or a MongoDB Atlas account.
*   A Google API Key with access to the Gemini API (Generative Language API).

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### 1. Environment Setup

*   **Clone the repository:**
    ```
    git clone [URL_OF_YOUR_REPOSITORY]
    cd [YOUR_PROJECT_DIRECTORY_NAME]
    ```

*   **Google API Key:**
    You will need a Google API Key enabled for the Generative Language API (Gemini).
    1.  Create a Google Cloud Project (if you don't have one).
    2.  Enable the "Generative Language API" for your project.
    3.  Create an API key under "APIs & Services" > "Credentials".
    4.  **Important:** Restrict your API key for security (e.g., to specific APIs or IP addresses) if deploying.

### 2. Server (Backend) Setup

1.  **Navigate to the server directory:**
    ```
    cd server
    ```

2.  **Install dependencies:**
    ```
    npm install
    ```
    (This will install `express`, `bcrypt`, `jsonwebtoken`, `mongoose`, `dotenv`, `cors`, `multer`, `@google/generative-ai`, etc.)

3.  **Create a `.env` file** in the `server` directory with the following content:
    ```
    PORT=3000
    MONGODB_URI=your_mongodb_connection_string # Replace with your MongoDB connection string
    GOOGLE_API_KEY=your_google_gemini_api_key   # Replace with your API key
    JWT_SECRET=your_strong_jwt_secret           # Replace with a strong, random secret key
    ```
    *   `MONGODB_URI`: Example: `mongodb://localhost:27017/gem_db` or your Atlas connection string.
    *   `JWT_SECRET`: Generate a strong random string for this.

4.  **Run the server:**
    ```
    node index.js
    ```
    The server should now be running, typically on `http://localhost:3000`. You should see console logs indicating the server has started and MongoDB has connected.

### 3. Client (Frontend) Setup

1.  **Navigate to the client directory** (from the root project directory):
    ```
    cd client 
    # Or whatever your client-side folder is named (e.g., gemini-clone-ui)
    ```

2.  **Install dependencies:**
    ```
    npm install
    ```
    (This will install React, and other frontend packages.)

3.  **Install React Router DOM (if not already a dependency in `package.json`):**
    ```
    npm install react-router-dom
    ```

4.  **Run the client development server:**
    ```
    npm run dev
    ```
    This will typically start the React development server, often on `http://localhost:5173` (for Vite) or `http://localhost:3000` (for Create React App - ensure it doesn't conflict with the backend port if so, and adjust backend CORS accordingly).

Your application should now be accessible in your web browser!

---

## Usage

1.  **Register:** Create a new user account.
2.  **Login:** Access your account.
3.  **Chat:** Type your prompts into the input field.
4.  **Image Input:** Click the gallery icon to upload an image. The AI will consider the image along with your text prompt (if provided).
5.  **Voice Input:** Click the microphone icon to use speech-to-text.
6.  **Copy Response:** Use the copy button to copy the AI's generated text.
7.  **New Chat:** Start a fresh conversation.

---


---

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:
1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

Please ensure your code adheres to standard coding practices and includes relevant tests if applicable.

---

## License

This project is licensed under the [MIT License](LICENSE.txt) - see the `LICENSE.txt` file for details (or choose another license if you prefer).

---

## Acknowledgements

*   Google for the Gemini API.
*   The developers of the various open-source libraries used in this project.
*   My dear friends who helped me in the frontend of this project :)


