import express from 'express';
import Chat from '../models/Chat.js'; // Note the added '.js' extension
const router = express.Router();
import mongoose from 'mongoose';
// Use a dynamic import to load the ES module
let runChat;

(async () => {
    runChat = await import('../../src/config/gemini.js'); // Adjust the import path if necessary
})();

// Endpoint for sending messages
router.post('/chat', async (req, res) => {
    const { userId, userMessage } = req.body;

    try {
        // Send message to Google Generative AI API
        const aiResponse = await runChat.default(userMessage); // Access default export if necessary

        // Create a new chat log entry
        const newChatLog = new Chat({
            userId,
            messages: [{ userMessage, aiResponse }],
        });

        // Save the chat log to the database
        await newChatLog.save();

        // Send response back to the client
        res.json({ userMessage, aiResponse });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

// Existing chat history endpoint...
router.get('/chat/history/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const chatHistory = await Chat.find({ userId }).sort({ timestamp: -1 });

        if (!chatHistory.length) {
            return res.status(404).json({ message: 'No chat history found' });
        }

        res.json(chatHistory);
    } catch (error) {
        console.error('Error retrieving chat history:', error);
        res.status(500).json({ error: 'Failed to retrieve chat history' });
    }
});

export default router;

