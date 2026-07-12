import React, { useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";
import JoinScreen from "./src/screens/JoinScreen";
import ChatScreen from "./src/screens/ChatScreen";
import { fetchHistory, sendMessageRest } from "./src/services/api";
import { DEFAULT_BACKEND_URL } from "./src/config/constants";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [room, setRoom] = useState("general");
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);

  const socketRef = useRef(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("chat_username");
        const storedBackendUrl = await AsyncStorage.getItem("chat_backend_url");

        if (storedUsername) {
          setUsername(storedUsername);
          setIsLoggedIn(true);
        }
        if (storedBackendUrl) {
          setBackendUrl(storedBackendUrl);
        }
      } catch (e) {
        console.error("Failed to load initial data", e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !username) return;

    const loadHistory = async () => {
      try {
        const data = await fetchHistory(backendUrl, room);
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    loadHistory();

    socketRef.current = io(backendUrl);

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
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isLoggedIn, room, username, backendUrl]);

  const handleJoin = async (newUsername, newRoom, newBackendUrl) => {
    try {
      await AsyncStorage.setItem("chat_username", newUsername);
      await AsyncStorage.setItem("chat_backend_url", newBackendUrl);

      setUsername(newUsername);
      setBackendUrl(newBackendUrl);
      setRoom(newRoom);
      setIsLoggedIn(true);
    } catch (e) {
      console.error("Failed to save credentials", e);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("chat_username");
      setUsername("");
      setIsLoggedIn(false);
      setMessages([]);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    } catch (e) {
      console.error("Failed to remove credentials", e);
    }
  };

  const handleSendMessage = (text) => {
    if (socketRef.current && connected) {
      socketRef.current.emit("sendMessage", {
        sender: username,
        text: text,
        room: room,
      });
    } else {
      sendMessageRest(backendUrl, username, text, room).catch((err) =>
        console.error("REST send error:", err)
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Initializing ChatterApp...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <JoinScreen
        initialUsername={username}
        initialRoom={room}
        initialBackendUrl={backendUrl}
        onJoin={handleJoin}
      />
    );
  }

  return (
    <ChatScreen
      username={username}
      room={room}
      messages={messages}
      connected={connected}
      onSendMessage={handleSendMessage}
      onSelectRoom={setRoom}
      onLogout={handleLogout}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0a0f1d",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#f3f4f6",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
});
