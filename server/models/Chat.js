import mongoose from 'mongoose';

// Define the schema for chat logs
const ChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  messages: [
    {
      userMessage: String,
      aiResponse: String,
      timestamp: { type: Date, default: Date.now }, // Optional: Store timestamp of each message
    },
  ],
  timestamp: { type: Date, default: Date.now }, // Optional: Store timestamp of the chat session
});

// Create a Chat model based on the schema
const Chat = mongoose.model('Chat', ChatSchema);

export default Chat;
