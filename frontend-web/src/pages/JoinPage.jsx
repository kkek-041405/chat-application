import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROOMS } from "../config/constants";

export default function JoinPage() {
    const navigate = useNavigate();
    const [nickname, setNickname] = useState("");
    const [selectedRoom, setSelectedRoom] = useState("general");

    useEffect(() => {
        const savedUser = localStorage.getItem("chat_username");
        if (savedUser) {
            navigate("/chat/general", { replace: true });
        }
    }, [navigate]);

    const handleJoin = (e) => {
        e.preventDefault();
        const trimmed = nickname.trim();
        if (!trimmed) return;

        localStorage.setItem("chat_username", trimmed);
        navigate(`/chat/${selectedRoom}`);
    };

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
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
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
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
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
