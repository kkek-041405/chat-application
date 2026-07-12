import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { saveMessage, getMessages } from "./messageStore.js";
import dns from 'dns'
dotenv.config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());


const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB successfully!"))
    .catch((error) => console.error("MongoDB connection error:", error));

app.post("/api/messages", async (req, res) => {
    try {
        const { sender, text, room } = req.body;

        if (!sender || !text) {
            return res.status(400).json({ error: "Sender and text are required fields." });
        }

        const newMessage = await saveMessage({ sender, text, room });

        io.to(newMessage.room).emit("message", newMessage);

        return res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in POST /api/messages:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/api/messages", async (req, res) => {
    try {
        const { room = "general", limit = 100 } = req.query;
        const messages = await getMessages(room, parseInt(limit, 10));
        return res.status(200).json(messages);
    } catch (error) {
        console.error("Error in GET /api/messages:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("joinRoom", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on("sendMessage", async (messageData) => {
        try {
            const { sender, text, room = "general" } = messageData;

            if (!sender || !text) {
                socket.emit("error", { message: "Sender and text are required" });
                return;
            }

            const newMessage = await saveMessage({ sender, text, room });

            io.to(newMessage.room).emit("message", newMessage);
        } catch (error) {
            console.error("Socket sendMessage error:", error);
            socket.emit("error", { message: "Failed to process message" });
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


export default server;