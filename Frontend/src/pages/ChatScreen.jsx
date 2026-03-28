import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../socket/context/SocketContext";
import api from "../services/api";

// ============ EMOJI PICKER COMPONENT ============
const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😚', '😙', '😗', '🥲', '😋', '😛',
    '😜', '🤪', '😌', '😑', '😐', '😏', '😒', '🙁',
    '☹️', '😬', '🤐', '😌', '😔', '😪', '🤤', '😴',
    '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🤥', '🤫',
    '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶',
    '🙄', '😏', '😣', '😥', '😌', '😔', '😪', '🥱',
    '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️',
    '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖',
    '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿',
    '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤',
    '🤍', '🤎', '💔', '💕', '💞', '💓', '💗', '💖',
    '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💥', '👍',
    '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪',
    '🎉', '🎊', '🎈', '🎀', '🎁', '🎂', '🎄', '⛄'
  ];

  const emojiGridRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiGridRef.current && !emojiGridRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={emojiGridRef}
      className="absolute bottom-20 left-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3 grid grid-cols-8 gap-2 w-80 max-h-64 overflow-y-auto z-50"
    >
      {emojis.map((emoji, idx) => (
        <button
          key={idx}
          onClick={() => {
            onEmojiSelect(emoji);
            onClose();
          }}
          className="text-2xl hover:bg-gray-100 dark:hover:bg-white/10 p-2 rounded-lg transition cursor-pointer"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

// ============ ATTACHMENT PANEL COMPONENT ============
const AttachmentPanel = ({ onClose, onFileSelect }) => {
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect({ file, type });
      onClose();
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute bottom-20 left-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-4 w-48 z-50"
    >
      <div className="space-y-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition text-left"
        >
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">Photo</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'image')}
            className="hidden"
          />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition text-left"
        >
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Video</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange(e, 'video')}
            className="hidden"
          />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition text-left"
        >
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">Document</span>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => handleFileChange(e, 'file')}
            className="hidden"
          />
        </button>
      </div>
    </div>
  );
};

// ============ THREE DOT MENU COMPONENT ============
const ThreeDotMenu = ({ onClose, onViewProfile, onMute, onClear, onBlock, onDelete }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute top-16 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50 w-48"
    >
      <button
        onClick={() => { onViewProfile(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left text-sm text-gray-900 dark:text-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        View Profile
      </button>

      <button
        onClick={() => { onMute(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left text-sm text-gray-900 dark:text-white border-t border-gray-200 dark:border-white/10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3v3h-3v-3zm0-8h3v3h-3V5zm0 4h3v3h-3V9zM5 5h3v3H5V5zm0 4h3v3H5V9zm0 4h3v3H5v-3zm8-12h3v3h-3V1zm0 4h3v3h-3V5zm0 4h3v3h-3V9z" />
        </svg>
        Mute Chat
      </button>

      <button
        onClick={() => { onClear(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left text-sm text-gray-900 dark:text-white border-t border-gray-200 dark:border-white/10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Clear Chat
      </button>

      <button
        onClick={() => { onBlock(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left text-sm text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-white/10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        Block User
      </button>

      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left text-sm text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-white/10"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete Chat
      </button>
    </div>
  );
};

// ============ CALL MODAL COMPONENT ============
const CallModal = ({ type, userName, onAccept, onReject, isIncoming }) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!isIncoming) {
      const timer = setInterval(() => setDuration(d => d + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [isIncoming]);

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-96 shadow-2xl text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          {type === 'video' ? (
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          )}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isIncoming ? `${userName} is calling...` : `Calling ${userName}...`}
        </h3>

        {!isIncoming && (
          <p className="text-gray-500 dark:text-gray-400 mb-6">{formatDuration(duration)}</p>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition shadow-lg"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.707 6.707a1 1 0 0 0 0 1.414L10.586 12l-3.879 3.879a1 1 0 1 0 1.414 1.414L12 13.414l3.879 3.879a1 1 0 0 0 1.414-1.414L13.414 12l3.879-3.879a1 1 0 0 0-1.414-1.414L12 10.586 8.121 6.707a1 1 0 0 0-1.414 0z" />
            </svg>
          </button>

          {isIncoming && (
            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition shadow-lg"
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ HELPER FUNCTIONS ============
const formatMessageTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatConversationTime = (date) => {
  if (!date) return "";

  const messageDate = new Date(date);
  const now = new Date();

  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return "yesterday";

  return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatLastSeen = (date) => {
  if (!date) return "never";

  const lastSeenDate = new Date(date);
  const now = new Date();

  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Active now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  
  return lastSeenDate.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ============ MAIN COMPONENT ============
export default function ChatScreen({ className = '' }) {
  // -------- STATE MANAGEMENT --------
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastSeenData, setLastSeenData] = useState({});
  
  // UI STATE
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [mutedChats, setMutedChats] = useState(new Set());
  const [uploadingFile, setUploadingFile] = useState(false);

  // REFS
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const messageDedupeRef = useRef(new Set());

  // CONTEXT
  const { user: currentUser } = useAuth();
  const { socket, isConnected } = useSocket();

  // MEMOIZED VALUES
  const selectedConversation = useMemo(
    () => Array.isArray(conversations)
      ? conversations.find(c => c._id === selectedConvId)
      : null,
    [conversations, selectedConvId]
  );

  // -------- INITIAL DATA LOAD --------
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/messages/conversations");
        if (res.data.success) {
          const data = res.data.data;
          if (Array.isArray(data)) {
            setConversations(data);
          } else {
            setConversations(data.conversations || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      }
    };

    fetchConversations();
  }, []);

  // -------- AUTO SCROLL --------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // -------- LOAD MESSAGES --------
  const loadMessages = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const res = await api.get(`/messages/chat/${userId}`);
      if (res.data.success) {
        const newMessages = res.data.data.messages || [];
        setMessages(newMessages);
        messageDedupeRef.current = new Set(newMessages.map(m => m._id));
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);

  // -------- SOCKET: ONLINE/OFFLINE STATUS FIX --------
  useEffect(() => {
    if (!socket) return;

    // 🔴 FIX: Listen to "online-users" event correctly
    const handleOnlineUsers = (users) => {
      console.log("✅ Online users received:", users); // Debug log
      // Convert to strings for consistent comparison
      const normalizedUsers = (users || []).map(u => String(u));
      setOnlineUsers(normalizedUsers);
    };

    socket.on("online-users", handleOnlineUsers);

    // Handle reconnection to refresh online status
    socket.on("connect", () => {
      console.log("✅ Socket reconnected, refreshing online status");
    });

    return () => {
      socket.off("online-users", handleOnlineUsers);
      socket.off("connect");
    };
  }, [socket]);

  // -------- SOCKET: TYPING INDICATORS --------
  useEffect(() => {
    if (!socket) return;

    socket.on("userTyping", (data) => {
      if (data.from === selectedUser?._id) {
        setIsTyping(true);
      }
    });

    socket.on("userStopTyping", (data) => {
      if (data.from === selectedUser?._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off("userTyping");
      socket.off("userStopTyping");
    };
  }, [socket, selectedUser]);

  // -------- SOCKET: NEW MESSAGES --------
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (data) => {
      const message = data.message;

      // 🟢 IMPROVEMENT: Avoid duplicate messages
      if (messageDedupeRef.current.has(message._id)) return;
      messageDedupeRef.current.add(message._id);

      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });

      setConversations(prev => {
        const updated = prev.map(conv => {
          const otherUser = conv.participants?.find(
            p => String(p._id) !== String(currentUser._id)
          );

          if (!otherUser) return conv;

          const isThisConversation =
            String(otherUser._id) === String(message.sender) ||
            String(otherUser._id) === String(message.receiver);

          if (!isThisConversation) return conv;

          return {
            ...conv,
            lastMessage: message,
            updatedAt: message.createdAt,
            unread:
              message.sender === currentUser._id
                ? conv.unread
                : conv._id === selectedConvId
                ? 0
                : (conv.unread || 0) + 1
          };
        });

        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return updated;
      });
    });

    // 🟢 IMPROVEMENT: Message status updates
    socket.on("message:delivered", (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId 
          ? { ...m, status: 'delivered' }
          : m
      ));
    });

    socket.on("message:read", (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId 
          ? { ...m, status: 'read' }
          : m
      ));
    });

    return () => {
      socket.off("newMessage");
      socket.off("message:delivered");
      socket.off("message:read");
    };
  }, [socket, selectedConvId, currentUser._id]);

  // -------- SOCKET: LAST SEEN --------
  useEffect(() => {
    if (!socket) return;

    socket.on("user:lastSeen", (data) => {
      setLastSeenData(prev => ({
        ...prev,
        [data.userId]: data.timestamp
      }));
    });

    return () => socket.off("user:lastSeen");
  }, [socket]);

  // -------- SOCKET: INCOMING CALLS --------
  useEffect(() => {
    if (!socket) return;

    socket.on("call:incoming", (data) => {
      setIncomingCall(data);
    });

    socket.on("call:end", () => {
      setActiveCall(null);
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:end");
    };
  }, [socket]);

  // -------- HANDLE SEND MESSAGE --------
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;
    if (!selectedUser?._id) return;

    try {
      const res = await api.post("/messages", {
        receiverId: selectedUser._id,
        receiverModel: "User",
        subject: "Chat Message",
        content: newMessage
      });

      if (res.data.success) {
        const message = res.data.data.message;
        messageDedupeRef.current.add(message._id);
        setMessages(prev => [...prev, message]);

        if (socket && isConnected) {
          socket.emit("message:send", message);
          socket.emit("stopTyping", { to: selectedUser._id });
        }

        setNewMessage("");
      }
    } catch (err) {
      console.error("Send message error:", err.response?.data || err);
    }
  }, [newMessage, selectedUser, socket, isConnected]);

  // -------- HANDLE FILE UPLOAD --------
  const handleFileUpload = useCallback(async ({ file, type }) => {
    if (!selectedUser?._id) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiverId', selectedUser._id);
      formData.append('type', type);

      const res = await api.post("/messages/upload", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const message = res.data.data.message;
        messageDedupeRef.current.add(message._id);
        setMessages(prev => [...prev, message]);

        if (socket && isConnected) {
          socket.emit("message:send", message);
        }
      }
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setUploadingFile(false);
    }
  }, [selectedUser, socket, isConnected]);

  // -------- HANDLE EMOJI INSERT --------
  const handleEmojiSelect = useCallback((emoji) => {
    setNewMessage(prev => prev + emoji);
  }, []);

  // -------- HANDLE CALLS --------
  const handleStartCall = useCallback((type) => {
    if (!selectedUser?._id) return;

    setActiveCall({
      type,
      userId: selectedUser._id,
      userName: selectedUser.name,
      startTime: new Date()
    });

    socket?.emit("call:start", {
      to: selectedUser._id,
      type
    });
  }, [selectedUser, socket]);

  const handleAcceptCall = useCallback(() => {
    socket?.emit("call:accept", { from: incomingCall?.senderId });
    setActiveCall({
      type: incomingCall?.type,
      userId: incomingCall?.senderId,
      userName: incomingCall?.senderName,
      startTime: new Date(),
      isIncoming: false
    });
    setIncomingCall(null);
  }, [incomingCall, socket]);

  const handleRejectCall = useCallback(() => {
    socket?.emit("call:reject", { from: incomingCall?.senderId });
    setIncomingCall(null);
  }, [incomingCall, socket]);

  // -------- HANDLE THREE DOT MENU --------
  const handleMenuAction = useCallback((action) => {
    switch (action) {
      case 'viewProfile':
        console.log("View profile:", selectedUser?.name);
        // Implement navigation to profile
        break;
      case 'mute':
        setMutedChats(prev => new Set([...prev, selectedConvId]));
        console.log("Muted chat:", selectedConvId);
        break;
      case 'clear':
        if (window.confirm('Clear all messages in this chat?')) {
          setMessages([]);
          socket?.emit("chat:clear", { conversationId: selectedConvId });
        }
        break;
      case 'block':
        if (window.confirm(`Block ${selectedUser?.name}?`)) {
          socket?.emit("user:block", { userId: selectedUser?._id });
          console.log("Blocked user:", selectedUser?._id);
        }
        break;
      case 'delete':
        if (window.confirm('Delete this chat?')) {
          setConversations(prev => prev.filter(c => c._id !== selectedConvId));
          setSelectedConvId(null);
          setSelectedUser(null);
          socket?.emit("chat:delete", { conversationId: selectedConvId });
        }
        break;
    }
  }, [selectedConvId, selectedUser, socket]);

  // -------- HANDLE KEY DOWN --------
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // -------- HANDLE TYPING --------
  const handleTyping = useCallback((e) => {
    setNewMessage(e.target.value);

    if (!socket || !selectedUser) return;

    socket.emit("typing", { to: selectedUser._id });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", { to: selectedUser._id });
    }, 1000);
  }, [socket, selectedUser]);

  // -------- SELECT CONVERSATION --------
  const handleSelectConversation = useCallback((conv) => {
    const otherUser = conv.participants?.find(
      p => String(p._id) !== String(currentUser._id)
    );

    if (!otherUser) return;

    setSelectedConvId(conv._id);
    setSelectedUser({
      _id: otherUser._id,
      name: otherUser.name,
      avatar: otherUser.avatar
    });

    loadMessages(otherUser._id);

    setConversations(prev =>
      prev.map(c =>
        c._id === conv._id
          ? { ...c, unread: 0 }
          : c
      )
    );
  }, [currentUser._id, loadMessages]);

  // -------- HELPER FUNCTIONS --------
  const getAvatarUrl = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`;
  };

  // 🔴 FIX: Correct online status comparison using String conversion
  const isUserOnline = (userId) => {
    const normalizedId = String(userId);
    const online = onlineUsers.some(u => String(u) === normalizedId);
    console.log(`Checking ${normalizedId}: ${online}`, { userId, normalizedId, onlineUsers });
    return online;
  };

  // -------- RENDER CHAT AREA --------
  const renderChatArea = () => {
    const otherUser = selectedConversation?.participants?.find(
      p => String(p._id) !== String(currentUser._id)
    );

    if (!selectedConversation) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center animate-pulse">
              <svg
                className="w-12 h-12 text-indigo-400/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-display font-bold mb-2 text-gray-900 dark:text-white">
              Select a conversation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose a chat from the sidebar to start messaging
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <img
              src={otherUser?.avatar || getAvatarUrl(otherUser?.name || "User")}
              alt={otherUser?.name}
              className="w-10 h-10 rounded-full object-cover"
            />

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {otherUser?.name || "User"}
              </h3>

              <div className="flex items-center gap-1 text-xs">
                <span
                  className={`w-2 h-2 rounded-full transition ${
                    isUserOnline(otherUser?._id)
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                />

                <span className="text-gray-600 dark:text-gray-400">
                  {isUserOnline(otherUser?._id) 
                    ? "Online" 
                    : `Last seen ${formatLastSeen(lastSeenData[otherUser?._id])}`
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* CALL BUTTON */}
            <button
              onClick={() => handleStartCall('audio')}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition text-gray-700 dark:text-gray-300"
              title="Voice call"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </button>

            {/* VIDEO CALL BUTTON */}
            <button
              onClick={() => handleStartCall('video')}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition text-gray-700 dark:text-gray-300"
              title="Video call"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>

            {/* THREE DOT MENU */}
            <div className="relative">
              <button
                onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition text-gray-700 dark:text-gray-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {showThreeDotMenu && (
                <ThreeDotMenu
                  onClose={() => setShowThreeDotMenu(false)}
                  onViewProfile={() => handleMenuAction('viewProfile')}
                  onMute={() => handleMenuAction('mute')}
                  onClear={() => handleMenuAction('clear')}
                  onBlock={() => handleMenuAction('block')}
                  onDelete={() => handleMenuAction('delete')}
                />
              )}
            </div>
          </div>
        </div>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Array.isArray(messages) && messages.map((msg, idx) => {
            const isMe = msg.sender === currentUser._id || msg.sender?._id === currentUser._id;
            const showStatus = isMe && idx === messages.length - 1;

            return (
              <div
                key={msg._id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`
                    max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl
                    ${
                      isMe
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-bl-none'
                    }
                  `}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                      isMe ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <span>{formatMessageTime(new Date(msg.createdAt))}</span>
                    {isMe && (
                      <span className={msg.status === 'read' ? 'text-indigo-300' : ''}>
                        {msg.status === 'sent' && '✓'}
                        {msg.status === 'delivered' && '✓✓'}
                        {msg.status === 'read' && '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* TYPING INDICATOR */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-400 px-4 pb-2">
              <span>{selectedUser?.name} is typing</span>
              <span className="flex gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-300"></span>
              </span>
            </div>
          )}

          {/* UPLOADING INDICATOR */}
          {uploadingFile && (
            <div className="flex items-center gap-2 text-xs text-indigo-500 px-4 pb-2">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Uploading file...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="sticky bottom-0 p-4 border-t border-gray-200 dark:border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {/* EMOJI BUTTON */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition text-gray-700 dark:text-gray-300"
                title="Emoji"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {showEmojiPicker && (
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}
            </div>

            {/* ATTACHMENT BUTTON */}
            <div className="relative">
              <button
                onClick={() => setShowAttachmentPanel(!showAttachmentPanel)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition text-gray-700 dark:text-gray-300"
                title="Attachment"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>

              {showAttachmentPanel && (
                <AttachmentPanel
                  onClose={() => setShowAttachmentPanel(false)}
                  onFileSelect={handleFileUpload}
                />
              )}
            </div>

            {/* INPUT FIELD */}
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={uploadingFile}
              className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-5 py-3 focus:outline-none focus:border-indigo-500 transition text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
            />

            {/* SEND BUTTON */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !selectedUser || uploadingFile}
              className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 transition disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </>
    );
  };

  // -------- MAIN RENDER --------
  return (
    <div className={`h-[calc(100vh-80px)] mt-20 bg-white dark:bg-[#0a0a0a] text-black dark:text-white flex overflow-hidden relative ${className}`}>
      {/* BACKGROUND GRADIENT */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 pointer-events-none" />

      {/* SIDEBAR */}
      <div
        className={`
          fixed lg:relative z-30 w-80 md:w-96 h-full
          bg-white/80 dark:bg-black/80 backdrop-blur-xl border-r border-gray-200 dark:border-white/10
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* SEARCH */}
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 transition text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* CONVERSATIONS LIST */}
        <div className="overflow-y-auto h-[calc(100%-5rem)]">
          {conversations.map((conv) => {
            const otherUser = conv.participants?.find(
              p => String(p._id) !== String(currentUser._id)
            );

            if (!otherUser) return null;

            return (
              <button
                key={conv._id}
                onClick={() => handleSelectConversation(conv)}
                className={`
                  w-full flex items-start gap-3 p-4 hover:bg-gray-100 dark:hover:bg-white/5 transition
                  ${
                    selectedConvId === conv._id
                      ? 'bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border-l-2 border-indigo-500'
                      : ''
                  }
                  ${mutedChats.has(conv._id) ? 'opacity-50' : ''}
                `}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={otherUser?.avatar || getAvatarUrl(otherUser?.name || "User")}
                    alt={otherUser?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  {/* ONLINE INDICATOR */}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white transition ${
                      isUserOnline(otherUser?._id)
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-400"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-medium truncate text-gray-900 dark:text-white">
                      {otherUser?.name || "User"}
                    </h4>

                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {formatConversationTime(conv.lastMessageTime || conv.updatedAt)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate text-left">
                    {typeof conv.lastMessage === "string"
                      ? conv.lastMessage
                      : conv.lastMessage?.content || "No messages yet"}
                  </p>
                </div>

                {/* UNREAD BADGE */}
                {conv.unread > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-xs flex items-center justify-center text-white">
                    {conv.unread}
                  </span>
                )}

                {/* MUTED INDICATOR */}
                {mutedChats.has(conv._id) && (
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.829.793-.792zM6.707 6.707a2 2 0 010 2.828l-.793.793-2.828-2.829.793-.792a2 2 0 012.828 0zm9.172 9.172a2 2 0 110 2.828l-.793.793 2.828 2.828.793-.793a2 2 0 010-2.828z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative">{renderChatArea()}</div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* INCOMING CALL MODAL */}
      {incomingCall && (
        <CallModal
          type={incomingCall.type}
          userName={incomingCall.senderName}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          isIncoming={true}
        />
      )}

      {/* ACTIVE CALL MODAL */}
      {activeCall && (
        <CallModal
          type={activeCall.type}
          userName={activeCall.userName}
          onAccept={() => {}}
          onReject={() => setActiveCall(null)}
          isIncoming={activeCall.isIncoming}
        />
      )}
    </div>
  );
}