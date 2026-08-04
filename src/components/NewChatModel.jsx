import React, { useState } from "react";
import { searchUsers, startConversation } from "../api/chatApi";

const NewChatModal = ({ onClose, onConversationCreated }) => {
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) return;

    try {
      setLoading(true);
      const result = await searchUsers(email);
      setUsers(result);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (user) => {
    try {
      const conversation = await startConversation(user._id);

    await onConversationCreated(conversation);

      onClose();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-[#0C0F1A] rounded-xl p-6 w-[420px] border border-white/10">

        <h2 className="text-xl font-semibold mb-4 text-white">
          Start New Chat
        </h2>

        <div className="flex gap-2">

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Search by email..."
            className="flex-1 rounded-lg bg-[#181C2A] px-3 py-2 text-white"
          />

          <button
            onClick={handleSearch}
            className="bg-[#635BFF] px-4 rounded-lg"
          >
            Search
          </button>

        </div>

        {loading && (
          <p className="text-gray-400 mt-3">
            Searching...
          </p>
        )}

        <div className="mt-5 space-y-3">

          {users.map((user) => (

            <div
              key={user._id}
              className="flex justify-between items-center bg-[#181C2A] rounded-lg p-3"
            >

              <div>
                <p className="text-white">
                  {user.name}
                </p>

                <p className="text-xs text-gray-400">
                  {user.email}
                </p>
              </div>

              <button
                onClick={() => handleStartChat(user)}
                className="bg-green-600 px-3 py-1 rounded"
              >
                Chat
              </button>

            </div>

          ))}

        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full border border-white/10 rounded-lg py-2"
        >
          Close
        </button>

      </div>
    </div>
  );
};

export default NewChatModal;