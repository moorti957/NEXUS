import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../socket/context/SocketContext';
import api from '../../services/api';
import Button from '../common/Button';

const getAvatarUrl = (name) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`;
};

export default function ChatModal({ user, onClose }) {
  const { user: currentUser } = useAuth();// current logged-in user
  const { socket, isConnected } = useSocket();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch message history

useEffect(() => {
  if (!socket || !currentUser?._id) return;

  console.log("Joining room:", currentUser._id);

  socket.emit("join-user", currentUser._id);

}, [socket?.id, currentUser?._id]);

  useEffect(() => {
    if (!user?._id) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/chat/${user._id}`);
        if (res.data.success) {
          setMessages(res.data.data.messages);
        }
      } catch (error) {
        console.error('Failed to load messages', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user]);


  

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
  if (!socket || !user?._id) return;

  const handleReceiveMessage = (data) => {
    const message = data.message;

    const senderId =
      typeof message.sender === "object"
        ? message.sender._id
        : message.sender;

    const receiverId =
      typeof message.receiver === "object"
        ? message.receiver._id
        : message.receiver;

    if (
      (senderId === user._id && receiverId === currentUser._id) ||
      (receiverId === user._id && senderId === currentUser._id)
    ) {
     setMessages((prev) => {
  const exists = prev.some((m) => m._id === message._id);
  if (exists) return prev;
  return [...prev, message];
});
    }
  };

  const handleTyping = (data) => {
    if (data.userId === user._id) {
      setTypingUsers((prev) => ({
        ...prev,
        [data.userId]: data.isTyping,
      }));
    }
  };

  socket.on("newMessage", handleReceiveMessage);
  socket.on("typing:indicator", handleTyping);

  return () => {
    socket.off("newMessage", handleReceiveMessage);
    socket.off("typing:indicator", handleTyping);
  };

}, [socket, user, currentUser]);

  // Send message
  const sendMessage = async () => {
  if (!newMessage.trim()) return;

  try {

    const res = await api.post("/messages", {
      receiverId: user._id,
      receiverModel: "User",
      subject: "Chat Message",
      content: newMessage
    });

 if (res.data.success) {

  const message = res.data.data.message;

  // local UI update
  setMessages((prev) => {
    const exists = prev.some((m) => m._id === message._id);
    if (exists) return prev;
    return [...prev, message];
  });

  // realtime socket
  if (socket && isConnected) {
    socket.emit("message:send", message);
  }

  setNewMessage("");
}

  } catch (error) {
    console.error("Send message failed", error);
  }
};

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket) return;

    socket.emit('typing:start', { userId: user._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { userId: user._id });
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 mt-16 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-[#1a1a22] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar || getAvatarUrl(user.name)}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-medium text-white">{user.name}</h3>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-3 bg-[#13131a]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => {
             const isOwn =
  msg.sender === currentUser._id ||
  msg.sender?._id === currentUser._id;
              return (
                <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                        : 'bg-white/10 text-gray-200'
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          {/* Typing indicator */}
          {typingUsers[user._id] && (
            <div className="text-sm text-gray-400 italic">typing...</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-[#1a1a22]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-full bg-white/5 border border-white/10 focus:border-indigo-500 focus:outline-none transition text-white placeholder-gray-500"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full disabled:opacity-50"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}