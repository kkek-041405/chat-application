import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import RoomSelectModal from "../components/RoomSelectModal";
import { ROOMS, DEFAULT_BACKEND_URL } from "../config/constants";

export default function JoinScreen({
  initialUsername = "",
  initialRoom = "general",
  initialBackendUrl = DEFAULT_BACKEND_URL,
  onJoin,
}) {
  const [tempUsername, setTempUsername] = useState(initialUsername);
  const [tempRoom, setTempRoom] = useState(initialRoom);
  const [tempBackendUrl, setTempBackendUrl] = useState(initialBackendUrl);

  const [isRoomSelectOpen, setIsRoomSelectOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleJoinPress = () => {
    const trimmed = tempUsername.trim();
    if (!trimmed) return;
    onJoin(trimmed, tempRoom, tempBackendUrl);
  };

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

          {/* Nickname Input */}
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

          {/* Room Selection Button */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Choose Room</Text>
            <TouchableOpacity
              style={styles.roomSelectBtn}
              onPress={() => setIsRoomSelectOpen(true)}
            >
              <Text style={styles.roomSelectText}>
                {ROOMS.find((r) => r.id === tempRoom)?.name || "Select Room"}
              </Text>
              <Feather name="chevron-down" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Room Select Modal */}
          <RoomSelectModal
            visible={isRoomSelectOpen}
            onClose={() => setIsRoomSelectOpen(false)}
            selectedRoom={tempRoom}
            onSelectRoom={setTempRoom}
          />

          {/* Advanced Server Settings Toggle */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Feather
              name="settings"
              size={14}
              color="#94a3b8"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? "Hide Server Settings" : "Advanced Server Settings"}
            </Text>
          </TouchableOpacity>

          {/* Advanced Server Settings Input */}
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
                Android Emulator default: http://10.0.2.2:5000{"\n"}
                Physical device: use your host computer's local IP (e.g.
                http://192.168.1.15:5000)
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleJoinPress}
            activeOpacity={0.8}
            style={{ marginTop: 10 }}
          >
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

const styles = StyleSheet.create({
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
});
