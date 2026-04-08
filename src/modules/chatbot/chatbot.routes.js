import { Router } from "express";
import { postChatbotMessage } from "./chatbot.controller.js";

const chatbotRouter = Router();

chatbotRouter.post("/", postChatbotMessage);

export { chatbotRouter };
