import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { ROOMS } from "../config/constants";

export default function RoomSelectModal({
  visible,
  onClose,
  selectedRoom,
  onSelectRoom,
}) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Room</Text>
                <TouchableOpacity onPress={onClose}>
                  <Feather name="x" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              {ROOMS.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.modalRoomItem,
                    selectedRoom === r.id && styles.modalRoomItemActive,
                  ]}
                  onPress={() => {
                    onSelectRoom(r.id);
                    onClose();
                  }}
                >
                  <Text style={styles.modalRoomHash}>#</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.modalRoomName,
                        selectedRoom === r.id && styles.modalRoomNameActive,
                      ]}
                    >
                      {r.name}
                    </Text>
                    <Text style={styles.modalRoomDesc}>{r.desc}</Text>
                  </View>
                  {selectedRoom === r.id && (
                    <Feather name="check" size={16} color="#8b5cf6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
});
