import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import { ROOMS } from "../config/constants";

export default function Sidebar({
  isOpen,
  onClose,
  slideAnim,
  room,
  onSelectRoom,
  username,
  connected,
  onLogout,
}) {
  if (!isOpen) return null;

  return (
    <View style={styles.drawerOverlayContainer}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.drawerDimmedBackground} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.drawerContent,
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        {/* Drawer Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.drawerBrand}>
            <Feather
              name="message-square"
              size={22}
              color="#8b5cf6"
              style={styles.brandIcon}
            />
            <Text style={styles.brandName}>ChatterApp</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
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
                  onSelectRoom(r.id);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.roomHashIcon,
                    isActive && styles.roomTextActive,
                  ]}
                >
                  #
                </Text>
                <Text
                  style={[
                    styles.roomNameText,
                    isActive && styles.roomTextActive,
                  ]}
                >
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
                {username ? username.substring(0, 2).toUpperCase() : ""}
              </Text>
            </LinearGradient>
            <View style={styles.userDetails}>
              <Text style={styles.usernameDisplay} numberOfLines={1}>
                {username}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusMiniDot,
                    connected ? styles.statusOnline : styles.statusOffline,
                  ]}
                />
                <Text style={styles.statusMiniText}>
                  {connected ? "Online" : "Connecting..."}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
            <Feather name="log-out" size={16} color="#94a3b8" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  statusOnline: {
    backgroundColor: "#10b981",
  },
  statusOffline: {
    backgroundColor: "#ef4444",
  },
});
