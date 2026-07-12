import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { io } from "socket.io-client";
import Feather from "@expo/vector-icons/Feather";

const SCREEN_WIDTH = Dimensions.get("window").width;
const DEFAULT_BACKEND_URL = Platform.OS === "android" ? "http://10.0.2.2:5001" : "http://localhost:5001";

const ROOMS = [
  { id: "general", name: "General", desc: "Global general chat for everyone" },
  { id: "random", name: "Random", desc: "Random thoughts, memes, and jokes" },
  { id: "tech", name: "Tech Talk", desc: "Programming, gadgets, and system designs" },
  { id: "gaming", name: "Gaming", desc: "Co-op gaming, strategies, and reviews" }
];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [room, setRoom] = useState("general");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [connected, setConnected] = useState(false);
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);

  // Form states
  const [tempUsername, setTempUsername] = useState("");
  const [tempRoom, setTempRoom] = useState("general");
  const [tempBackendUrl, setTempBackendUrl] = useState(DEFAULT_BACKEND_URL);
  
  // Custom picker modal
  const [isRoomSelectOpen, setIsRoomSelectOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Drawer Animation
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-280)).current;

  // Pulse animation for empty state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  // Load saved credentials
  useEffect(() => {
    const initApp = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("chat_username");
        const storedBackendUrl = await AsyncStorage.getItem("chat_backend_url");
        
        if (storedUsername) {
          setUsername(storedUsername);
          setTempUsername(storedUsername);
          setIsLoggedIn(true);
        }
        if (storedBackendUrl) {
          setBackendUrl(storedBackendUrl);
          setTempBackendUrl(storedBackendUrl);
        }
      } catch (e) {
        console.error("Failed to load initial data", e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Pulse animation controller
  useEffect(() => {
    if (messages.length === 0 && isLoggedIn) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [messages, isLoggedIn]);

  // Drawer Animations
  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: -280,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerOpen(false);
    });
  };

  // Manage API Socket connection
  useEffect(() => {
    if (!isLoggedIn || !username) return;

    // Fetch message history
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/messages?room=${room}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      }
    };

    fetchHistory();

    // Connect socket
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

  const handleJoin = async () => {
    const trimmed = tempUsername.trim();
    if (!trimmed) return;

    try {
      await AsyncStorage.setItem("chat_username", trimmed);
      await AsyncStorage.setItem("chat_backend_url", tempBackendUrl);
      
      setUsername(trimmed);
      setBackendUrl(tempBackendUrl);
      setRoom(tempRoom);
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
      closeDrawer();
    } catch (e) {
      console.error("Failed to remove credentials", e);
    }
  };

  const handleSendMessage = () => {
    const trimmedMsg = inputText.trim();
    if (!trimmedMsg) return;

    if (socketRef.current && connected) {
      socketRef.current.emit("sendMessage", {
        sender: username,
        text: trimmedMsg,
        room: room
      });
    } else {
      // REST API fallback
      fetch(`${backendUrl}/api/messages`, {
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.joinContainer}>
          <StatusBar style="light" />
          <View style={styles.joinCard}>
            <View style={styles.joinHeader}>
              <Text style={styles.joinTitle}>ChatterApp</Text>
              <Text style={styles.joinSubtitle}>
                Enter your nickname and choose a room to join the conversation
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Nickname</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Satoshi"
                placeholderTextColor="#94a3b8"
                value={tempUsername}
                onChangeText={setTempUsername}
                maxLength={15}
                autoCorrect={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Choose Room</Text>
              <TouchableOpacity style={styles.roomSelectBtn} onPress={() => setIsRoomSelectOpen(true)}>
                <Text style={styles.roomSelectText}>
                  {ROOMS.find(r => r.id === tempRoom)?.name || "Select Room"}
                </Text>
                <Feather name="chevron-down" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Custom dropdown picker modal */}
            <Modal visible={isRoomSelectOpen} transparent={true} animationType="fade">
              <TouchableWithoutFeedback onPress={() => setIsRoomSelectOpen(false)}>
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Choose Room</Text>
                      <TouchableOpacity onPress={() => setIsRoomSelectOpen(false)}>
                        <Feather name="x" size={20} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                    {ROOMS.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.modalRoomItem, tempRoom === r.id && styles.modalRoomItemActive]}
                        onPress={() => {
                          setTempRoom(r.id);
                          setIsRoomSelectOpen(false);
                        }}
                      >
                        <Text style={styles.modalRoomHash}>#</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.modalRoomName, tempRoom === r.id && styles.modalRoomNameActive]}>
                            {r.name}
                          </Text>
                          <Text style={styles.modalRoomDesc}>{r.desc}</Text>
                        </View>
                        {tempRoom === r.id && <Feather name="check" size={16} color="#8b5cf6" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            {/* Advanced Toggle */}
            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <Feather name="settings" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
              <Text style={styles.advancedToggleText}>
                {showAdvanced ? "Hide Server Settings" : "Advanced Server Settings"}
              </Text>
            </TouchableOpacity>

            {showAdvanced && (
              <View style={styles.advancedContainer}>
                <Text style={styles.inputLabel}>Backend Server URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder={DEFAULT_BACKEND_URL}
                  placeholderTextColor="#475569"
                  value={tempBackendUrl}
                  onChangeText={setTempBackendUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.helperText}>
                  Android Emulator default: http://10.0.2.2:5001{"\n"}
                  Physical device: use your host computer's local IP (e.g. http://192.168.1.15:5001)
                </Text>
              </View>
            )}

            <TouchableOpacity onPress={handleJoin} activeOpacity={0.8} style={{ marginTop: 10 }}>
              <LinearGradient
                colors={["#8b5cf6", "#ec4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.joinButton}
              >
                <Text style={styles.joinButtonText}>Join Chatroom</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Main Chat Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={openDrawer}>
            <Feather name="menu" size={22} color="#f3f4f6" />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerHash}>#</Text>
              <Text style={styles.headerTitle}>{activeRoomInfo.name}</Text>
            </View>
            <Text style={styles.headerDesc} numberOfLines={1}>
              {activeRoomInfo.desc}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.statusDot, connected ? styles.statusOnline : styles.statusOffline]} />
          <Text style={styles.statusText}>{connected ? "Online" : "Connecting"}</Text>
        </View>
      </View>

      {/* Sidebar Drawer Component */}
      {isDrawerOpen && (
        <View style={styles.drawerOverlayContainer}>
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <View style={styles.drawerDimmedBackground} />
          </TouchableWithoutFeedback>
          <Animated.View style={[styles.drawerContent, { transform: [{ translateX: slideAnim }] }]}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerBrand}>
                <Feather name="message-square" size={22} color="#8b5cf6" style={styles.brandIcon} />
                <Text style={styles.brandName}>ChatterApp</Text>
              </View>
              <TouchableOpacity onPress={closeDrawer}>
                <Feather name="x" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Room List Section */}
            <View style={styles.drawerSection}>
              <Text style={styles.sectionTitle}>Rooms</Text>
              {ROOMS.map((r) => {
                const isActive = room === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.roomItem, isActive && styles.roomItemActive]}
                    onPress={() => {
                      setRoom(r.id);
                      closeDrawer();
                    }}
                  >
                    <Text style={[styles.roomHashIcon, isActive && styles.roomTextActive]}>#</Text>
                    <Text style={[styles.roomNameText, isActive && styles.roomTextActive]}>
                      {r.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Drawer Footer / User Profile */}
            <View style={styles.drawerFooter}>
              <View style={styles.userProfile}>
                <LinearGradient
                  colors={["#8b5cf6", "#ec4899"]}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {username.substring(0, 2).toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={styles.userDetails}>
                  <Text style={styles.usernameDisplay} numberOfLines={1}>
                    {username}
                  </Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusMiniDot, connected ? styles.statusOnline : styles.statusOffline]} />
                    <Text style={styles.statusMiniText}>{connected ? "Online" : "Connecting..."}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Feather name="log-out" size={16} color="#94a3b8" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Message Stream */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.chatArea}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }], opacity: 0.6 }}>
                <Feather name="activity" size={48} color="#8b5cf6" />
              </Animated.View>
              <Text style={styles.emptyTextTitle}>No messages in #{activeRoomInfo.name} yet.</Text>
              <Text style={styles.emptyTextSubtitle}>Be the first to say hi!</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id || item.timestamp}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => {
                const isSelf = item.sender === username;
                return (
                  <View style={[styles.messageWrapper, isSelf ? styles.messageSelf : styles.messageOther]}>
                    {!isSelf && <Text style={styles.messageSender}>{item.sender}</Text>}
                    
                    {isSelf ? (
                      <LinearGradient
                        colors={["#8b5cf6", "#7c3aed"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bubbleSelf}
                      >
                        <Text style={styles.messageText}>{item.text}</Text>
                        <Text style={styles.messageTimeSelf}>{formatTime(item.timestamp)}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.bubbleOther}>
                        <Text style={styles.messageText}>{item.text}</Text>
                        <Text style={styles.messageTimeOther}>{formatTime(item.timestamp)}</Text>
                      </View>
                    )}
                  </View>
                );
              }}
            />
          )}

          {/* Chat Input Field */}
          <View style={styles.inputArea}>
            <View style={styles.inputForm}>
              <TextInput
                style={styles.chatInput}
                placeholder={`Message #${activeRoomInfo.name}...`}
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={setInputText}
                maxLength={500}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                <Feather name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0f1d",
  },
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
  // Join Login Screen
  joinContainer: {
    flex: 1,
    backgroundColor: "#0a0f1d",
    justifyContent: "center",
    padding: 24,
  },
  joinCard: {
    backgroundColor: "rgba(15, 22, 42, 0.75)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  joinHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  joinTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  joinSubtitle: {
    color: "#94a3b8",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(10, 15, 30, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    color: "#ffffff",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  roomSelectBtn: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 15, 30, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  roomSelectText: {
    color: "#ffffff",
    fontSize: 16,
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 4,
  },
  advancedToggleText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },
  advancedContainer: {
    backgroundColor: "rgba(10, 15, 30, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  helperText: {
    fontSize: 11,
    color: "#64748b",
    lineHeight: 16,
    marginTop: 8,
  },
  joinButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  joinButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Modal Selector styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  modalRoomItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  modalRoomItemActive: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  modalRoomHash: {
    color: "#8b5cf6",
    fontSize: 20,
    fontWeight: "700",
    marginRight: 12,
  },
  modalRoomName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: 2,
  },
  modalRoomNameActive: {
    color: "#ffffff",
  },
  modalRoomDesc: {
    fontSize: 12,
    color: "#94a3b8",
  },
  // Header bar
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === "android" ? 44 : 14, // spacing for android statusbar
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIconBtn: {
    padding: 6,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerHash: {
    color: "#8b5cf6",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 4,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerDesc: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusOnline: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusOffline: {
    backgroundColor: "#ef4444",
  },
  statusText: {
    color: "#f3f4f6",
    fontSize: 12,
    fontWeight: "500",
  },
  // Custom Sidebar Drawer
  drawerOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  drawerDimmedBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  drawerContent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 280,
    backgroundColor: "#0a0f1d",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: Platform.OS === "android" ? 44 : 20,
    display: "flex",
    flexDirection: "column",
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  drawerBrand: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    marginRight: 8,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  drawerSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  roomItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  roomItemActive: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderLeftWidth: 3,
    borderLeftColor: "#8b5cf6",
  },
  roomHashIcon: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },
  roomNameText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#94a3b8",
  },
  roomTextActive: {
    color: "#ffffff",
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(10, 15, 30, 0.3)",
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  usernameDisplay: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusMiniText: {
    color: "#94a3b8",
    fontSize: 11,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    paddingVertical: 8,
  },
  logoutText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  // Chat viewport
  chatArea: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.3)",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTextTitle: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
  emptyTextSubtitle: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    maxWidth: "75%",
    marginBottom: 16,
  },
  messageSelf: {
    alignSelf: "flex-end",
  },
  messageOther: {
    alignSelf: "flex-start",
  },
  messageSender: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
    paddingLeft: 4,
  },
  bubbleSelf: {
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "rgba(30, 41, 59, 0.6)",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageText: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
  },
  messageTimeSelf: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    textAlign: "right",
    marginTop: 4,
  },
  messageTimeOther: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 4,
  },
  // Bottom Input
  inputArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(10, 15, 30, 0.3)",
  },
  inputForm: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "rgba(15, 22, 42, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    color: "#ffffff",
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: "#8b5cf6",
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8b5cf6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
});
