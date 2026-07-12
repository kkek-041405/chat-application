import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import JoinPage from "./pages/JoinPage";
import ChatPage from "./pages/ChatPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<JoinPage />} />
                <Route path="/join" element={<Navigate to="/" replace />} />
                <Route path="/chat" element={<Navigate to="/chat/general" replace />} />
                <Route path="/chat/:roomId" element={<ChatPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
