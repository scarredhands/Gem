import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

// Update the MODEL_NAME to the higher model you wish to use
const MODEL_NAME = "gemini-1.5-pro"; // Example: Replace with the actual name of the higher model

// Store your API KEY securely
const API_KEY = "AIzaSyD4d8bGQsvn4ldlvvXvfTA-N_WQwY6WqJs"; // Using an environment variable for security

async function runChat(prompt) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
      temperature: 0.75,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048, // Adjust according to the model's capabilities
  };

  const safetySettings = [
      {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
  ];

  const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
  });

  try {
      const result = await chat.sendMessage(prompt);
      console.log("API Response:", result); // Log the full response for debugging
      const response = result.response;

      if (response && response.text) {
          return response.text();
      } else {
          throw new Error("Invalid response structure");
      }
  } catch (error) {
      console.error("Error in runChat:", error);
      throw error; // Re-throw error after logging
  }
}

export default runChat;
