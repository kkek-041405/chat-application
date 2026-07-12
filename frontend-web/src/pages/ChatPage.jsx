import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Send, MessageSquare, LogOut, Hash, Activity } from "lucide-react";
import { BACKEND_URL, ROOMS } from "../config/constants";

export default function ChatPage() {
    const navigate = useNavigate();
    const { roomId = "general" } = useParams();

    const [username, setUsername] = useState(() => localStorage.getItem("chat_username") || "");
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [connected, setConnected] = useState(false);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Redirect to home/join if there's no username set
    useEffect(() => {
        if (!username) {
            navigate("/", { replace: true });
        }
    }, [username, navigate]);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        if (!username) return;

        // Fetch history via REST API
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/api/messages?room=${roomId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            }
        };

        fetchHistory();

        // Connect client socket
        socketRef.current = io(BACKEND_URL);

        socketRef.current.on("connect", () => {
            setConnected(true);
            socketRef.current.emit("joinRoom", roomId);
        });

        socketRef.current.on("disconnect", () => {
            setConnected(false);
        });

        socketRef.current.on("message", (msg) => {
            if (msg.room === roomId) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        });

        socketRef.current.emit("joinRoom", roomId);

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [roomId, username]);

    const handleLogout = () => {
        localStorage.removeItem("chat_username");
        setUsername("");
        setMessages([]);
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        navigate("/", { replace: true });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const trimmedMsg = inputText.trim();
        if (!trimmedMsg) return;

        if (socketRef.current && connected) {
            socketRef.current.emit("sendMessage", {
                sender: username,
                text: trimmedMsg,
                room: roomId
            });
        } else {
            // REST API fallback
            fetch(`${BACKEND_URL}/api/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sender: username, text: trimmedMsg, room: roomId })
            }).catch(err => console.error("REST send error:", err));
        }

        setInputText("");
    };

    const formatTime = (isoString) => {
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return "";

            // Convert to IST (UTC + 5.5 hours)
            const istTimeMs = date.getTime() + (1 * 60 * 60 * 1000);
            const istDate = new Date(istTimeMs);

            const hours = istDate.getUTCHours();
            const minutes = istDate.getUTCMinutes();
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
            return `${displayHours}:${displayMinutes} ${ampm}`;
        } catch (e) {
            return "";
        }
    };

    const activeRoomInfo = ROOMS.find(r => r.id === roomId) || ROOMS[0];

    if (!username) {
        return null;
    }

    return (
        <div className="chat-dashboard glass">
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
                                    className={`room-item ${roomId === r.id ? "active" : ""}`}
                                    onClick={() => navigate(`/chat/${r.id}`)}
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
                    <button onClick={handleLogout} className="btn-logout" aria-label="Sign Out">
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>

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
