const API_URL = 'http://localhost:5000'

export const fetchConversations = async () => {
  const res = await fetch(`${API_URL}/api/chat/conversations`, {
    credentials: 'include',
  })

  if (!res.ok) throw new Error("Failed to fetch conversations")

  const data = await res.json()
  return data.conversations
}

export const fetchMessages = async (conversationId) => {
  const res = await fetch(`${API_URL}/api/chat/messages/${conversationId}`, {
    credentials: 'include',
  })

  if (!res.ok) throw new Error("Failed to fetch messages")

  const data = await res.json()
  return data.messages
}

export const sendMessageApi = async (conversationId, text) => {
  const res = await fetch(`${API_URL}/api/chat/message`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    credentials: 'include',
    body: JSON.stringify({ conversationId, text })
  })

  if (!res.ok) throw new Error("Failed to send message")

  const data = await res.json()
  return data.message
}

// ================= NEW =================

export const searchUsers = async (email) => {
  const res = await fetch(
    `${API_URL}/api/users/search?email=${encodeURIComponent(email)}`,
    {
      credentials: "include",
    }
  )

  if (!res.ok) throw new Error("Search failed")

  const data = await res.json()

  return data.users
}

export const startConversation = async (userId) => {
  const res = await fetch(`${API_URL}/api/chat/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) throw new Error("Unable to start conversation")

  const data = await res.json()

  return data.conversation
}

export const uploadAttachment = async (
  conversationId,
  file,
  text = ""
) => {

  const formData = new FormData();

  formData.append("conversationId", conversationId);
  formData.append("text", text);
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/chat/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const data = await res.json();

  return data.message;
};