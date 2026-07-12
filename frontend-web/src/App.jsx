import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { Send, MessageSquare, LogOut, Hash, User, Activity } from "lucide-react";

const BACKEND_URL = "http://localhost:5001";

const ROOMS = [
    { id: "general", name: "General", desc: "Global general chat for everyone" },
    { id: "random", name: "Random", desc: "Random thoughts, memes, and jokes" },
    { id: "tech", name: "Tech Talk", desc: "Programming, gadgets, and system designs" },
    { id: "gaming", name: "Gaming", desc: "Co-op gaming, strategies, and reviews" }
];

function App() {
    const [username, setUsername] = useState(() => localStorage.getItem("chat_username") || "");
    const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("chat_username"));
    const [room, setRoom] = useState("general");
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [connected, setConnected] = useState(false);

    // Form state for join screen
    const [tempUsername, setTempUsername] = useState(username);
    const [tempRoom, setTempRoom] = useState(room);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom on new messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isLoggedIn) {
            scrollToBottom();
        }
    }, [messages, isLoggedIn]);

    // Manage socket connection and message history
    useEffect(() => {
        if (!isLoggedIn || !username) return;

        // Fetch initial room message history via REST API
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/messages?room=${room}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };

        fetchHistory();

        // Connect to Socket.io server
        socketRef.current = io(BACKEND_URL);

        socketRef.current.on("connect", () => {
            setConnected(true);
            socketRef.current.emit("joinRoom", room);
        });

        socketRef.current.on("disconnect", () => {
            setConnected(false);
        });

        socketRef.current.on("message", (msg) => {
            if (msg.room === room) {
                setMessages((prev) => {
                    // Prevent duplicate messages
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        // Handle socket room updates
        socketRef.current.emit("joinRoom", room);

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [isLoggedIn, room, username]);

    const handleJoin = (e) => {
        e.preventDefault();
        const trimmed = tempUsername.trim();
        if (!trimmed) return;

        localStorage.setItem("chat_username", trimmed);
        setUsername(trimmed);
        setRoom(tempRoom);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("chat_username");
        setUsername("");
        setIsLoggedIn(false);
        setMessages([]);
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const trimmedMsg = inputText.trim();
        if (!trimmedMsg) return;

        if (socketRef.current && connected) {
            socketRef.current.emit("sendMessage", {
                sender: username,
                text: trimmedMsg,
                room: room
            });
        } else {
            // Fallback to REST API if Socket is disconnected
            fetch(`${BACKEND_URL}/api/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sender: username, text: trimmedMsg, room: room })
            }).catch(err => console.error("REST send error:", err));
        }

        setInputText("");
    };

    const formatTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } catch (e) {
            return "";
        }
    };

    const activeRoomInfo = ROOMS.find(r => r.id === room) || ROOMS[0];

    if (!isLoggedIn) {
        return (
            <div className="join-container glass">
                <div className="join-header">
                    <h1>ChatterApp</h1>
                    <p>Enter your nickname and choose a room to join the conversation</p>
                </div>
                <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div className="form-group">
                        <label htmlFor="username">Nickname</label>
                        <input
                            id="username"
                            type="text"
                            className="input-field"
                            placeholder="e.g. Satoshi"
                            value={tempUsername}
                            onChange={(e) => setTempUsername(e.target.value)}
                            required
                            maxLength={15}
                            autoComplete="off"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="room">Choose Room</label>
                        <select
                            id="room"
                            className="input-field room-select"
                            value={tempRoom}
                            onChange={(e) => setTempRoom(e.target.value)}
                        >
                            {ROOMS.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="join-button">
                        Join Chatroom
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="chat-dashboard glass">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <MessageSquare size={24} className="brand-icon" />
                    <span className="brand-name">ChatterApp</span>
                </div>
                <div className="sidebar-content">
                    <div>
                        <h3 className="section-title">Rooms</h3>
                        <div className="room-list">
                            {ROOMS.map((r) => (
                                <div
                                    key={r.id}
                                    className={`room-item ${room === r.id ? "active" : ""}`}
                                    onClick={() => setRoom(r.id)}
                                >
                                    <span className="room-hash">#</span>
                                    <span>{r.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="avatar">
                            {username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="user-details">
                            <span className="username-display">{username}</span>
                            <div className="status-indicator">
                                <span className={`status-dot ${connected ? "online" : ""}`}></span>
                                <span>{connected ? "Online" : "Connecting..."}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-logout" aria-label="Log Out">
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-window">
                <div className="chat-header">
                    <div className="chat-header-info">
                        <Hash size={20} className="room-hash" />
                        <div>
                            <h2 className="chat-room-title">{activeRoomInfo.name}</h2>
                            <p className="chat-room-desc">{activeRoomInfo.desc}</p>
                        </div>
                    </div>
                </div>

                <div className="message-list">
                    {messages.length === 0 ? (
                        <div className="empty-chat">
                            <Activity size={48} className="empty-chat-icon animate-pulse" />
                            <p>No messages in #{activeRoomInfo.name} yet.<br />Be the first to say hi!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isSelf = msg.sender === username;
                            return (
                                <div key={msg.id} className={`message-wrapper ${isSelf ? "self" : "other"}`}>
                                    <div className="message-meta">
                                        {!isSelf && <span style={{ fontWeight: "600" }}>{msg.sender}</span>}
                                    </div>
                                    <div className="message-bubble">
                                        <p>{msg.text}</p>
                                        <span className="message-time">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-area">
                    <form onSubmit={handleSendMessage} className="chat-input-form">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder={`Message #${activeRoomInfo.name}...`}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            maxLength={500}
                            autoFocus
                        />
                        <button type="submit" className="btn-send" aria-label="Send Message">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default App;
