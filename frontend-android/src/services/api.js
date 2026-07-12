export const fetchHistory = async (backendUrl, room) => {
  try {
    const res = await fetch(`${backendUrl}/api/messages?room=${room}`);
    if (res.ok) {
      return await res.json();
    }
    throw new Error(`Failed to fetch history: ${res.status}`);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    throw error;
  }
};

export const sendMessageRest = async (backendUrl, username, text, room) => {
  try {
    const res = await fetch(`${backendUrl}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: username, text, room })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error(`Failed to send message: ${res.status}`);
  } catch (error) {
    console.error("REST send error:", error);
    throw error;
  }
};
