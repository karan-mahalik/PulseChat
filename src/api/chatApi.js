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

export const updateProfile = async (name, about) => {
  const res = await fetch(`${API_URL}/api/users/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      name,
      about,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to update profile");
  }

  return data.user;
};

export const changePassword = async (
  currentPassword,
  newPassword
) => {
  const res = await fetch(
    `${API_URL}/api/users/password`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to change password"
    );
  }

  return data;
};

// ================= MESSAGE DELETION =================

export const deleteMessageForMe = async (messageId) => {
  const res = await fetch(
    `${API_URL}/api/chat/message/${messageId}/me`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to delete message"
    );
  }

  return data;
};

export const deleteMessageForEveryone = async (messageId) => {
  const res = await fetch(
    `${API_URL}/api/chat/message/${messageId}/everyone`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to delete message"
    );
  }

  return data;
};

export const editMessageApi = async (messageId, text) => {
  const res = await fetch(
    `${API_URL}/api/chat/message/${messageId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        text,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to edit message"
    );
  }

  return data.message;
};

export const reactToMessage = async (messageId, emoji) => {
  const res = await fetch(
    `${API_URL}/api/chat/message/${messageId}/reaction`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        emoji,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to update reaction"
    );
  }

  return data.reactions;
};