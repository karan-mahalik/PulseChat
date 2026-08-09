import React, { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { fetchConversations, fetchMessages, sendMessageApi, editMessageApi, uploadAttachment, deleteMessageForMe, deleteMessageForEveryone, reactToMessage } from "../api/chatApi"
import NewChatModal from "../components/NewChatModel";
import { socket } from "../socket"
import { useRef } from "react"
import { useNavigate } from "react-router-dom";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

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
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Reaction UI
  const [reactionMessageId, setReactionMessageId] = useState(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null);


  const emojiPickerRef = useRef(null);
  const navigate = useNavigate();


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

  const startRecording = async () => {
    try {
      if (!selectedConversation) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        // Stop microphone
        stream.getTracks().forEach((track) => track.stop());

        // Create a file from recorded audio
        const audioFile = new File(
          [audioBlob],
          `voice-${Date.now()}.webm`,
          {
            type: audioBlob.type,
          }
        );

        try {
          await uploadAttachment(
            selectedConversation._id,
            audioFile
          );
        } catch (error) {
          console.log("Voice message upload failed:", error);
        }

        audioChunksRef.current = [];
      };

      mediaRecorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.log("Microphone permission/error:", error);
    }
  };


  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    clearInterval(recordingTimerRef.current);

    recordingTimerRef.current = null;
    mediaRecorderRef.current = null;

    setIsRecording(false);
    setRecordingTime(0);
  };


  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${secs}`;
  };


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

  const handleFileUpload = async (e) => {

    const file = e.target.files[0];

    if (!file || !selectedConversation) return;

    try {

      await uploadAttachment(
        selectedConversation._id,
        file
      );

    } catch (err) {

      console.log(err);

    }

    e.target.value = "";

  };

  const handleMessageMenu = (message) => {
    setSelectedMessage(message);
    setShowDeleteMenu(true);
  };

  const handleMessageContextMenu = (e, message) => {

    e.preventDefault();

    // Deleted messages cannot have reactions
    if (message.isDeleted) return;

    setReactionMessageId(message._id);
    setReactionPickerMessageId(null);

  };

  const handleReaction = async (messageId, emoji) => {

    try {

      await reactToMessage(
        messageId,
        emoji
      );

      setReactionMessageId(null);
      setReactionPickerMessageId(null);

    } catch (error) {

      console.log(
        "Reaction failed:",
        error
      );

    }

  };

  const handleMoreReaction = (messageId) => {
    setReactionMessageId(messageId);
    setReactionPickerMessageId(messageId);
  };



  const handleEditClick = () => {
    if (!selectedMessage) return;

    setEditingMessage(selectedMessage);
    setEditText(selectedMessage.text || "");
    setShowDeleteMenu(false);
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      await editMessageApi(
        editingMessage._id,
        editText.trim()
      );

      setMessages(prev =>
        prev.map(message =>
          message._id === editingMessage._id
            ? {
              ...message,
              text: editText.trim(),
              isEdited: true,
              editedAt: new Date()
            }
            : message
        )
      );

      setEditingMessage(null);
      setEditText("");
      setSelectedMessage(null);

    } catch (error) {
      console.log("Edit message failed:", error);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteMessage = async (type) => {
    if (!selectedMessage) return;

    try {
      if (type === "me") {
        await deleteMessageForMe(selectedMessage._id);
      } else {
        await deleteMessageForEveryone(selectedMessage._id);
      }

      setShowDeleteConfirm(false);
      setSelectedMessage(null);

    } catch (error) {
      console.log("Delete message failed:", error);
    }
  };


  const addEmoji = (emoji) => {
    setMessageText(prev => prev + emoji.native);
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
    const handleClickOutside = (e) => {

      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
        setReactionPickerMessageId(null);
      }

      if (!e.target.closest(".reaction-area")) {
        setReactionMessageId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  useEffect(() => {

    socket.on("receiveMessage", (msg) => {

      setMessages(prev => [...prev, msg]);

      if (
        selectedConversation &&
        msg.conversationId === selectedConversation._id &&
        msg.sender !== user._id
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

    const handleMessageDeletedForMe = ({ messageId }) => {

      setMessages((prev) =>
        prev.filter((message) => message._id !== messageId)
      );

    };

    const handleMessageDeletedForEveryone = ({ messageId }) => {

      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId
            ? {
              ...message,
              isDeleted: true,
              text: "",
              attachment: undefined,
            }
            : message
        )
      );

    };

    const handleMessageEdited = ({
      messageId,
      text,
      isEdited,
      editedAt
    }) => {

      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId
            ? {
              ...message,
              text,
              isEdited,
              editedAt
            }
            : message
        )
      );

    };

    socket.on(
      "messageDeletedForMe",
      handleMessageDeletedForMe
    );

    socket.on(
      "messageDeletedForEveryone",
      handleMessageDeletedForEveryone
    );

    socket.on(
      "messageEdited",
      handleMessageEdited
    );

    return () => {

      socket.off(
        "messageDeletedForMe",
        handleMessageDeletedForMe
      );

      socket.off(
        "messageDeletedForEveryone",
        handleMessageDeletedForEveryone
      );

      socket.off(
        "messageEdited",
        handleMessageEdited
      );

    };

  }, []);


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

  useEffect(() => {

    const handleReactionUpdated = ({
      messageId,
      reactions
    }) => {

      setMessages(prev =>
        prev.map(message =>
          message._id === messageId
            ? {
              ...message,
              reactions
            }
            : message
        )
      );

    };

    socket.on(
      "messageReactionUpdated",
      handleReactionUpdated
    );

    return () => {

      socket.off(
        "messageReactionUpdated",
        handleReactionUpdated
      );

    };

  }, []);

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

          <button
            onClick={() => navigate("/settings")}
            className="mt-2 w-full border border-white/10 rounded-lg py-2 text-sm text-gray-300 hover:bg-white/5 transition"
          >
            ⚙ Settings
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
        className={`${openChatOnMobile ? "flex" : "hidden md:flex"} relative flex-1 flex-col h-screen overflow-hidden`}
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
                <div
                  key={msg._id}
                  className={`group relative flex ${msg.sender === user._id
                    ? "justify-end"
                    : "justify-start"
                    }`}
                >
                  <div
                    onContextMenu={(e) => handleMessageContextMenu(e, msg)}
                    className={`relative max-w-xs px-3 py-2 rounded-2xl text-sm shadow ${msg.sender === user._id
                      ? "bg-[#635BFF] text-white rounded-br-sm"
                      : "bg-[#181C2A] text-gray-100 rounded-bl-sm"
                      }`}
                  >
                    {/* REACTION BAR */}
                    {reactionMessageId === msg._id &&
                      !msg.isDeleted && (
                        <div
                          className={`reaction-area absolute z-50 bottom-full mb-2 ${msg.sender === user._id ? "right-0" : "left-0"
                            }`}
                        >
                          <div className="flex items-center gap-1 bg-[#0C0F1A] border border-white/10 rounded-full px-2 py-1.5 shadow-2xl">

                            {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => {

                              const myReaction = msg.reactions?.find(
                                (reaction) =>
                                  reaction.user?.toString() === user._id?.toString()
                              );

                              const isSelected = myReaction?.emoji === emoji;

                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleReaction(msg._id, emoji)}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-white/10 hover:scale-110 transition ${isSelected
                                    ? "bg-white/10 scale-110"
                                    : ""
                                    }`}
                                >
                                  {emoji}
                                </button>
                              );

                            })}

                            <button
                              type="button"
                              onClick={() => handleMoreReaction(msg._id)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-lg text-gray-300 hover:bg-white/10 hover:scale-110 transition"
                            >
                              +
                            </button>

                          </div>

                          {reactionPickerMessageId === msg._id && (
                            <div
                              ref={emojiPickerRef}
                              className="absolute bottom-12 left-0 z-[60]"
                            >
                              <Picker
                                data={data}
                                onEmojiSelect={(emoji) =>
                                  handleReaction(msg._id, emoji.native)
                                }
                                theme="dark"
                                previewPosition="none"
                                skinTonePosition="none"
                              />
                            </div>
                          )}
                        </div>
                      )}

                    {/* THREE DOT MENU */}
                    {!msg.isDeleted && (
                      <button
                        type="button"
                        onClick={() => handleMessageMenu(msg)}
                        className="absolute -top-3 -right-2 w-7 h-7 rounded-full bg-[#101522] border border-white/10 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                        aria-label="Message options"
                      >
                        ⋮
                      </button>
                    )}

                    {/* MESSAGE CONTENT */}
                    {msg.isDeleted ? (
                      <p className="italic text-gray-400">
                        This message was deleted
                      </p>
                    ) : (
                      <>
                        {editingMessage?._id === msg._id ? (
                          <div className="min-w-[220px]">

                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              autoFocus
                              rows={3}
                              className="w-full bg-[#101522] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#635BFF] resize-none"
                            />

                            <div className="flex justify-end gap-2 mt-2">

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessage(null);
                                  setEditText("");
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-white/5"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                onClick={handleEditMessage}
                                disabled={!editText.trim()}
                                className="px-3 py-1.5 rounded-lg text-xs bg-[#635BFF] text-white disabled:opacity-50"
                              >
                                Save
                              </button>

                            </div>

                          </div>
                        ) : (
                          <>
                            {msg.text && (
                              <p
                                onContextMenu={(e) =>
                                  handleMessageContextMenu(e, msg)
                                }
                                className="cursor-context-menu select-text"
                              >
                                {msg.text}
                              </p>
                            )}

                            {msg.isEdited && (
                              <span className="text-[10px] text-gray-400 italic ml-1">
                                edited
                              </span>
                            )}
                          </>
                        )}

                        {/* ATTACHMENT */}
                        {msg.attachment && (() => {

                          const attachmentUrl = msg.attachment.url.startsWith("/uploads/")
                            ? msg.attachment.url
                            : `/uploads${msg.attachment.url}`;

                          const fullAttachmentUrl =
                            `http://localhost:5000${attachmentUrl}`;

                          return (
                            <div className="mt-2">

                              {/* IMAGE */}
                              {msg.attachment.fileType?.startsWith("image/") && (
                                <img
                                  src={fullAttachmentUrl}
                                  alt={msg.attachment.fileName}
                                  className="max-w-[250px] max-h-[300px] rounded-lg object-contain cursor-pointer"
                                  onClick={() =>
                                    window.open(fullAttachmentUrl, "_blank")
                                  }
                                />
                              )}

                              {/* VIDEO */}
                              {msg.attachment.fileType?.startsWith("video/") && (
                                <video
                                  src={fullAttachmentUrl}
                                  controls
                                  className="max-w-[300px] max-h-[300px] rounded-lg"
                                />
                              )}

                              {/* OTHER FILES - ZIP, PDF, DOC, HTML, ETC. */}
                              {!msg.attachment.fileType?.startsWith("image/") &&
                                !msg.attachment.fileType?.startsWith("video/") && (
                                  <a
                                    href={fullAttachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-[#101522] rounded-lg hover:bg-[#151b2b] transition"
                                  >
                                    <span className="text-2xl">📄</span>

                                    <div className="min-w-0">
                                      <p className="text-sm text-white truncate max-w-[180px]">
                                        {msg.attachment.fileName}
                                      </p>

                                      <p className="text-xs text-gray-400">
                                        {msg.attachment.size
                                          ? `${(
                                            msg.attachment.size /
                                            1024 /
                                            1024
                                          ).toFixed(2)} MB`
                                          : "File"}
                                      </p>
                                    </div>
                                  </a>
                                )}

                            </div>
                          );

                        })()}
                      </>
                    )}

                    {/* REACTIONS */}

                    {!msg.isDeleted &&
                      msg.reactions?.length > 0 && (

                        <div className="flex flex-wrap gap-1 mt-1">

                          {msg.reactions.map((reaction, index) => {

                            const isMyReaction =
                              reaction.user?.toString() ===
                              user._id?.toString();

                            return (
                              <button
                                key={`${reaction.user}-${index}`}
                                type="button"
                                onClick={() => {

                                  // Only your own reaction can be removed
                                  if (isMyReaction) {

                                    handleReaction(
                                      msg._id,
                                      reaction.emoji
                                    );

                                  }

                                }}
                                className={`text-sm bg-[#101522] border border-white/10 rounded-full px-2 py-0.5 shadow transition ${isMyReaction
                                  ? "hover:scale-105 cursor-pointer"
                                  : "cursor-default"
                                  }`}
                                title={
                                  isMyReaction
                                    ? "Remove reaction"
                                    : "Reaction"
                                }
                              >
                                {reaction.emoji}
                              </button>
                            );

                          })}

                        </div>
                      )}

                    {/* TIME */}
                    <p className="text-[10px] text-gray-300 mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    {/* READ STATUS */}
                    {msg.sender === user._id && (
                      <p
                        className="text-[11px] mt-0.5 text-right"
                        style={{
                          color: msg.read ? "#4F9EFF" : "#ccc"
                        }}
                      >
                        {msg.read
                          ? "✓✓"
                          : msg.delivered
                            ? "✓✓"
                            : "✓"}
                      </p>
                    )}

                    {/* EDIT / DELETE MENU */}
                    {selectedMessage?._id === msg._id &&
                      showDeleteMenu && (
                        <div className="absolute right-0 top-8 z-50 w-40 bg-[#0C0F1A] border border-white/10 rounded-xl shadow-2xl overflow-hidden">

                          {msg.sender === user._id &&
                            msg.text &&
                            !msg.isDeleted && (
                              <button
                                type="button"
                                onClick={handleEditClick}
                                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition"
                              >
                                Edit
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5 transition"
                          >
                            Delete
                          </button>

                        </div>
                      )}
                  </div>
                </div>
              ))}

            </div>



            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-20 left-4 z-50"
              >
                <Picker
                  data={data}
                  onEmojiSelect={addEmoji}
                  theme="dark"
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </div>
            )}

            <form
              onSubmit={handleSend}
              className="sticky bottom-0 z-20 p-3 border-t border-white/10 flex items-center gap-2 bg-[#05060A]"
            >

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />

              <div className="flex-1 relative flex items-center rounded-full bg-[#181C2A] border border-white/10">

                {/* MIC BUTTON */}
                <button
                  type="button"
                  onClick={
                    isRecording
                      ? stopRecording
                      : startRecording
                  }
                  className={`ml-2 w-9 h-9 flex items-center justify-center rounded-full transition ${isRecording
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                    }`}
                  title={
                    isRecording
                      ? "Stop recording"
                      : "Record voice message"
                  }
                >
                  {isRecording ? "■" : "🎤"}
                </button>

                {/* INPUT / RECORDING */}
                {isRecording ? (
                  <div className="flex-1 px-3 text-sm text-red-400">
                    Recording {formatRecordingTime(recordingTime)}
                  </div>
                ) : (
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
                    className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                  />
                )}

              </div>

              {/* EMOJI */}
              <button
                type="button"
                onClick={() =>
                  setShowEmojiPicker((prev) => !prev)
                }
                className="text-2xl px-2 hover:scale-110 transition"
              >
                😊
              </button>

              {/* ATTACHMENT */}
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="text-2xl px-2 text-gray-300 hover:text-white"
              >
                📎
              </button>

              {/* SEND */}
              {!isRecording && (
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-[#635BFF]"
                >
                  ➤
                </button>
              )}

            </form>

          </>
        )
        }

      </div >

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onConversationCreated={async () => {
            await loadConversations();
          }}
        />
      )}

      {
        showDeleteConfirm && selectedMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">

            <div className="w-[90%] max-w-sm bg-[#0C0F1A] border border-white/10 rounded-2xl p-5 shadow-2xl">

              <h3 className="text-lg font-semibold text-white">
                Delete message?
              </h3>

              <p className="text-sm text-gray-400 mt-2">
                Choose how you want to delete this message.
              </p>

              <div className="flex flex-col gap-2 mt-5">

                <button
                  type="button"
                  onClick={() => handleDeleteMessage("me")}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white transition"
                >
                  Delete for me
                </button>

                {selectedMessage.sender === user._id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage("everyone")}
                    className="w-full px-4 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-sm text-red-400 transition"
                  >
                    Delete for everyone
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedMessage(null);
                  }}
                  className="w-full px-4 py-3 rounded-lg text-sm text-gray-400 hover:bg-white/5 transition"
                >
                  Cancel
                </button>

              </div>

            </div>

          </div>
        )
      }

    </div >
  )
}

export default ChatPage
