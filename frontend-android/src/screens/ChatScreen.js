import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import Sidebar from "../components/Sidebar";
import { ROOMS } from "../config/constants";

export default function ChatScreen({
  username,
  room,
  messages,
  connected,
  onSendMessage,
  onSelectRoom,
  onLogout,
}) {
  const [inputText, setInputText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const slideAnim = useRef(new Animated.Value(-280)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef(null);

  const activeRoomInfo = ROOMS.find((r) => r.id === room) || ROOMS[0];

  useEffect(() => {
    if (messages.length === 0) {
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
  }, [messages, pulseAnim]);

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

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText("");
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${displayHours}:${displayMinutes} ${ampm}`;
    } catch (e) {
      return "";
    }
  };

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
          <View
            style={[
              styles.statusDot,
              connected ? styles.statusOnline : styles.statusOffline,
            ]}
          />
          <Text style={styles.statusText}>
            {connected ? "Online" : "Connecting"}
          </Text>
        </View>
      </View>

      {/* Sidebar Drawer Component */}
      <Sidebar
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        slideAnim={slideAnim}
        room={room}
        onSelectRoom={onSelectRoom}
        username={username}
        connected={connected}
        onLogout={onLogout}
      />

      {/* Message Stream */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.chatArea}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Animated.View
                style={{ transform: [{ scale: pulseAnim }], opacity: 0.6 }}
              >
                <Feather name="activity" size={48} color="#8b5cf6" />
              </Animated.View>
              <Text style={styles.emptyTextTitle}>
                No messages in #{activeRoomInfo.name} yet.
              </Text>
              <Text style={styles.emptyTextSubtitle}>
                Be the first to say hi!
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id || item.timestamp}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              onLayout={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => {
                const isSelf = item.sender === username;
                return (
                  <View
                    style={[
                      styles.messageWrapper,
                      isSelf ? styles.messageSelf : styles.messageOther,
                    ]}
                  >
                    {!isSelf && (
                      <Text style={styles.messageSender}>{item.sender}</Text>
                    )}

                    {isSelf ? (
                      <LinearGradient
                        colors={["#8b5cf6", "#7c3aed"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bubbleSelf}
                      >
                        <Text style={styles.messageText}>{item.text}</Text>
                        <Text style={styles.messageTimeSelf}>
                          {formatTime(item.timestamp)}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.bubbleOther}>
                        <Text style={styles.messageText}>{item.text}</Text>
                        <Text style={styles.messageTimeOther}>
                          {formatTime(item.timestamp)}
                        </Text>
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
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === "android" ? 44 : 14,
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
