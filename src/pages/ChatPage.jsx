import React, { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { fetchConversations, fetchMessages, sendMessageApi } from "../api/chatApi"
import NewChatModal from "../components/NewChatModel";
import { socket } from "../socket"
import { useRef } from "react"

const ChatPage = () => {

  const { user } = useAuth()

  useEffect(() => {

    if (!user) return;

    socket.auth = {
      userId: user._id,
    };

    socket.connect();

    return () => socket.disconnect();

  }, [user]);

  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState("")
  const [typingUser, setTypingUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loadingConvo, setLoadingConvo] = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [openChatOnMobile, setOpenChatOnMobile] = useState(false)
  const messagesEndRef = useRef(null)
  const typingTimeout = useRef(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [initializing, setInitializing] = useState(true);


  const loadConversations = async () => {
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch (err) {
      console.log("Failed to load conversations");
    }

    setLoadingConvo(false);
  };

  useEffect(() => {

    const init = async () => {
      try {
        const data = await fetchConversations();

        setConversations(data);
        setLoadingConvo(false);

        const savedId = localStorage.getItem("selectedConversation");

        if (savedId) {
          const convo = data.find(c => c._id === savedId);

          if (convo) {

            setSelectedConversation(convo);
            setOpenChatOnMobile(true);

            socket.emit("joinRoom", convo._id);

            const data = await fetchMessages(convo._id);

            setMessages(data);

            socket.emit("markAsRead", {
              conversationId: convo._id,
              userId: user._id,
            });

          } else {
            localStorage.removeItem("selectedConversation");
          }
        }
      } finally {
        setInitializing(false);
      }
    };

    init();

  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const openConversation = async (convo) => {
    setSelectedConversation(convo)
    localStorage.setItem("selectedConversation", convo._id);
    setOpenChatOnMobile(true)

    socket.emit("joinRoom", convo._id)

    setLoadingMsg(true)

    try {
      const data = await fetchMessages(convo._id)
      setMessages(data)
      socket.emit("markAsRead", {
        conversationId: convo._id,
        userId: user._id,
      });
    } catch (err) {
      console.log("Failed to load messages")
    }

    setLoadingMsg(false)
  }


  const partnerUser = (c) => {
    return c.participants.find((p) => p._id !== user._id)
  }


  const handleSend = async (e) => {
    e.preventDefault();

    if (!selectedConversation || !messageText.trim()) return;

    try {
      await sendMessageApi(
        selectedConversation._id,
        messageText
      );

      setMessageText("");
    } catch (err) {
      console.log(err);
    }
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) {
      return "last seen unavailaible"
    }

    const date = new Date(dateString)
    const now = new Date()

    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })

    if (isToday) {
      return `last seen today at ${time}`
    }
    return `last seen on ${date.toLocaleDateString()} at ${time}`
  }



  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected:", socket.id)
    })

    return () => socket.off("connect")
  }, [])


  useEffect(() => {

    socket.on("receiveMessage", (msg) => {

      setMessages(prev => [...prev, msg]);

      if (
        selectedConversation &&
        msg.conversationId === selectedConversation._id
      ) {

        socket.emit("markAsRead", {
          conversationId: selectedConversation._id,
          userId: user._id,
        });

      }

    });

    return () => socket.off("receiveMessage");

  }, [selectedConversation, user]);


  useEffect(() => {
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users)
    })

    return () => socket.off("onlineUsers")
  }, [])

  useEffect(() => {

    socket.on("userTyping", ({ conversationId, userName }) => {

      if (
        selectedConversation &&
        selectedConversation._id === conversationId
      ) {
        setTypingUser(userName);
      }

    });

    socket.on("userStopTyping", ({ conversationId }) => {

      if (
        selectedConversation &&
        selectedConversation._id === conversationId
      ) {
        setTypingUser("");
      }

    });

    return () => {
      socket.off("userTyping");
      socket.off("userStopTyping");
    };

  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    socket.on("delivered", ({ messageId }) => {
      setMessages(prev =>
        prev.map(m =>
          m._id === messageId ? { ...m, delivered: true } : m
        )
      );
    });

    return () => socket.off("delivered");
  }, []);

  useEffect(() => {
    socket.on("messagesRead", ({ conversationId }) => {
      if (!selectedConversation || selectedConversation._id !== conversationId) return;

      setMessages(prev =>
        prev.map(m => ({ ...m, read: true }))
      );
    });

    return () => socket.off("messagesRead");
  }, [selectedConversation]);

  // 👇 ADD THIS HERE
  if (initializing) {
    return (
      <div className="min-h-screen bg-[#05060A] flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  // Existing return
  return (
    <div className="min-h-screen bg-[#05060A] text-white flex">

      <div className={`${openChatOnMobile ? "hidden md:flex" : "flex"} w-full md:w-80 border-r border-white/10 flex-col`}>

        <div className="px-4 py-3 bg-[#0C0F1A]">

          <h2 className="text-lg font-semibold">
            PulseChat
          </h2>

          <p className="text-xs text-gray-400">
            Real-time messaging
          </p>

          <button
            onClick={() => setShowNewChat(true)}
            className="mt-3 w-full bg-[#635BFF] rounded-lg py-2 text-sm hover:bg-[#5148d9]"
          >
            + New Chat
          </button>

        </div>

        <div className="flex-1 overflow-y-auto">

          {loadingConvo && (
            <p className="p-3 text-sm text-gray-400">Loading…</p>
          )}

          {!loadingConvo && conversations.length === 0 && (
            <p className="p-3 text-sm text-gray-400">No chats found</p>
          )}

          {conversations.map((conv) => {
            const partner = partnerUser(conv)

            return (
              <button key={conv._id} onClick={() => openConversation(conv)} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5">

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#181C2A] flex items-center justify-center">
                    {partner?.name?.[0]}
                  </div>

                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#05060A] ${onlineUsers.includes(partner?._id) ? "bg-green-400" : "bg-gray-500"}`} />

                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{partner?.name}</p>
                </div>

              </button>
            )

          })}

        </div>
      </div>



      <div
        className={`${openChatOnMobile ? "flex" : "hidden md:flex"} flex-1 flex-col h-screen overflow-hidden`}
      >

        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select chat to view conversation
          </div>
        ) : (
          <>

            <div className="sticky top-0 z-20 px-4 py-3 border-b border-white/10 bg-[#0C0F1A] flex items-center gap-3">

              <button onClick={() => setOpenChatOnMobile(false)} className="md:hidden mr-2 text-lg">
                ←
              </button>

              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#181C2A] flex items-center justify-center">
                  {partnerUser(selectedConversation)?.name?.[0]}
                </div>

                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0C0F1A] ${onlineUsers.includes(partnerUser(selectedConversation)?._id) ? "bg-green-400" : "bg-gray-500"}`} />

              </div>

              <div>
                <p className="text-sm font-medium">
                  {partnerUser(selectedConversation)?.name}
                </p>

                <p className="text-[11px] text-gray-400">
                  {onlineUsers.includes(partnerUser(selectedConversation)?._id) ? "Online" : formatLastSeen(partnerUser(selectedConversation)?.lastSeen)}
                </p>
              </div>

            </div>

            {typingUser && (
              <div className="px-4 py-2 text-xs italic text-green-400">
                {typingUser} is typing...
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#05060A]">

              {loadingMsg && (
                <p className="text-gray-400 text-sm">Loading…</p>
              )}

              {!loadingMsg && messages.map((msg) => (
                <div key={msg._id} className={`flex ${msg.sender === user._id ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm shadow ${msg.sender === user._id ? "bg-[#635BFF] text-white rounded-br-sm" : "bg-[#181C2A] text-gray-100 rounded-bl-sm"}`}>
                    <p>{msg.text}</p>
                    <p className="text-[10px] text-gray-300 mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {msg.sender === user._id && (
                      <p className="text-[11px] mt-0.5 text-right"
                        style={{ color: msg.read ? "#4F9EFF" : "#ccc" }}>
                        {msg.read ? "✓✓" : msg.delivered ? "✓✓" : "✓"}
                      </p>
                    )}


                  </div>
                </div>
              ))}

              <div ref={messagesEndRef}></div>

            </div>



            <form
              onSubmit={handleSend}
              className="sticky bottom-0 z-20 p-3 border-t border-white/10 flex items-center gap-2 bg-[#05060A]"
            >

              <input
                type="text"
                value={messageText}
                onChange={(e) => {

                  setMessageText(e.target.value);

                  if (!selectedConversation) return;

                  socket.emit("typing", {
                    conversationId: selectedConversation._id,
                    userName: user.name,
                  });

                  clearTimeout(typingTimeout.current);

                  typingTimeout.current = setTimeout(() => {

                    socket.emit("stopTyping", {
                      conversationId: selectedConversation._id,
                    });

                  }, 1000);

                }}
                placeholder="Type a message…"
                className="flex-1 rounded-full bg-[#181C2A] border border-white/10 px-4 py-2 text-sm"
              />

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-[#635BFF]"
              >
                ➤
              </button>

            </form>

          </>
        )}

      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onConversationCreated={async () => {
            await loadConversations();
          }}
        />
      )}

    </div>
  )
}

export default ChatPage
