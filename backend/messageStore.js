import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Message from "./models/Message.js";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "messages.json");

// Ensure local fallback store is initialized
function initializeLocalStore() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify([]));
        }
    } catch (error) {
        console.error("Failed to initialize local fallback store:", error);
    }
}

initializeLocalStore();

function loadLocalMessages() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, "utf-8");
            return JSON.parse(data || "[]");
        }
    } catch (error) {
        console.error("Error reading local fallback messages, returning empty array:", error);
    }
    return [];
}

function saveLocalMessages(messages) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));
    } catch (error) {
        console.error("Error saving local fallback messages:", error);
    }
}

function isDbConnected() {
    return mongoose.connection.readyState === 1;
}

/**
 * Retrieve the latest messages for a room, sorted chronologically.
 * @param {string} room 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getMessages(room = "general", limit = 100) {
    if (isDbConnected()) {
        try {
            const messages = await Message.find({ room })
                .sort({ timestamp: -1 })
                .limit(limit);

            return messages.reverse().map((msg) => ({
                id: msg._id.toString(),
                sender: msg.sender,
                text: msg.text,
                room: msg.room,
                timestamp: msg.timestamp.toISOString()
            }));
        } catch (error) {
            console.error("Error retrieving messages from database, falling back to local store:", error);
        }
    }

    // Fallback: File-based persistence
    console.log(`[Backup Store] Fetching history for room: ${room}`);
    const messages = loadLocalMessages();
    const filtered = messages.filter((msg) => msg.room === room);
    return filtered.slice(-limit);
}

/**
 * Save a new message.
 * @param {Object} messageData 
 * @returns {Promise<Object>}
 */
export async function saveMessage({ sender, text, room = "general" }) {
    if (!sender || !text) {
        throw new Error("Sender and text are required fields");
    }

    if (isDbConnected()) {
        try {
            const message = new Message({ sender, text, room });
            await message.save();
            return {
                id: message._id.toString(),
                sender: message.sender,
                text: message.text,
                room: message.room,
                timestamp: message.timestamp.toISOString()
            };
        } catch (error) {
            console.error("Error saving message to database, falling back to local store:", error);
        }
    }

    // Fallback: File-based persistence
    console.log(`[Backup Store] Saving message for room: ${room}`);
    const messages = loadLocalMessages();
    const newMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender,
        text,
        room,
        timestamp: new Date().toISOString()
    };

    messages.push(newMessage);
    saveLocalMessages(messages);
    return newMessage;
}
