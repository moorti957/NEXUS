import { useEffect, useCallback, useRef, useState } from 'react';
import { useToast } from '../../components/common/Toast';

/**
 * Chat Events Handler
 * Manages all real-time chat functionality
 * @param {Object} socket - Socket instance
 * @param {Object} context - Chat context (conversationId, user, etc.)
 */
export const useChatEvents = (socket, context) => {
  const { showToast } = useToast();
  const {
    conversationId,
    currentUser,
    messages,
    setMessages,
    setTypingUsers,
    setUnreadCount
  } = context;

  const typingTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // ===========================================
  // CONVERSATION MANAGEMENT
  // ===========================================

  /**
   * Join conversation room
   */
  const joinConversation = useCallback((convId) => {
    if (!socket || !convId) return;

    socket.emit('chat:join', { conversationId: convId }, (response) => {
      if (response?.success) {
        console.log(`✅ Joined conversation: ${convId}`);
        setIsConnected(true);
        
        // Load conversation history
        loadConversationHistory(convId);
      } else {
        showToast('Failed to join conversation', 'error');
      }
    });
  }, [socket, showToast]);

  /**
   * Leave conversation room
   */
  const leaveConversation = useCallback((convId) => {
    if (!socket || !convId) return;

    socket.emit('chat:leave', { conversationId: convId });
    setIsConnected(false);
    console.log(`👋 Left conversation: ${convId}`);
  }, [socket]);

  /**
   * Load conversation history
   */
  const loadConversationHistory = useCallback(async (convId, page = 1) => {
    if (!socket || !convId) return;

    socket.emit('chat:history', { conversationId: convId, page }, (response) => {
      if (response?.success) {
        if (page === 1) {
          setMessages(response.messages);
        } else {
          setMessages(prev => [...prev, ...response.messages]);
        }
        
        // Mark messages as read
        const unreadIds = response.messages
          .filter(m => !m.isRead && m.receiver?._id === currentUser?._id)
          .map(m => m._id);

        if (unreadIds.length > 0) {
          markMessagesAsRead(convId, unreadIds);
        }
      }
    });
  }, [socket, setMessages, currentUser]);

  /**
   * Load more messages (pagination)
   */
  const loadMoreMessages = useCallback((page) => {
    if (conversationId) {
      loadConversationHistory(conversationId, page);
    }
  }, [conversationId, loadConversationHistory]);

  // ===========================================
  // MESSAGE HANDLING
  // ===========================================

  /**
   * Send a message
   */
  const sendMessage = useCallback((content, receiverId, attachments = [], replyTo = null) => {
    if (!socket || !conversationId || !content.trim()) return false;

    const messageData = {
      conversationId,
      content: content.trim(),
      receiverId,
      messageType: 'general',
      priority: 'normal',
      attachments,
      replyTo
    };

    socket.emit('chat:send', messageData, (response) => {
      if (response?.error) {
        showToast(response.error, 'error');
      }
    });

    return true;
  }, [socket, conversationId, showToast]);

  /**
   * Edit a message
   */
  const editMessage = useCallback((messageId, newContent) => {
    if (!socket || !conversationId || !newContent.trim()) return;

    socket.emit('chat:edit', {
      messageId,
      content: newContent.trim()
    }, (response) => {
      if (response?.error) {
        showToast(response.error, 'error');
      } else {
        showToast('Message edited', 'success');
      }
    });
  }, [socket, conversationId, showToast]);

  /**
   * Delete a message
   */
  const deleteMessage = useCallback((messageId) => {
    if (!socket || !conversationId) return;

    socket.emit('chat:delete', { messageId }, (response) => {
      if (response?.error) {
        showToast(response.error, 'error');
      } else {
        showToast('Message deleted', 'info');
      }
    });
  }, [socket, conversationId, showToast]);

  /**
   * Forward a message
   */
  const forwardMessage = useCallback((messageId, targetConversationId) => {
    if (!socket) return;

    socket.emit('chat:forward', {
      messageId,
      targetConversationId
    }, (response) => {
      if (response?.error) {
        showToast(response.error, 'error');
      } else {
        showToast('Message forwarded', 'success');
      }
    });
  }, [socket, showToast]);

  // ===========================================
  // READ RECEIPTS
  // ===========================================

  /**
   * Mark messages as read
   */
  const markMessagesAsRead = useCallback((convId, messageIds) => {
    if (!socket || !convId || !messageIds.length) return;

    socket.emit('chat:read', {
      conversationId: convId,
      messageIds
    });
  }, [socket]);

  /**
   * Mark all messages as read
   */
  const markAllAsRead = useCallback((convId) => {
    if (!socket || !convId) return;

    socket.emit('chat:read-all', { conversationId: convId });
  }, [socket]);

  // ===========================================
  // TYPING INDICATORS
  // ===========================================

  /**
   * Send typing indicator
   */
  const sendTyping = useCallback((isTyping) => {
    if (!socket || !conversationId) return;

    socket.emit('chat:typing', {
      conversationId,
      isTyping
    });

    // Clear timeout for stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('chat:typing', {
          conversationId,
          isTyping: false
        });
      }, 3000);
    }
  }, [socket, conversationId]);

  // ===========================================
  // REACTIONS
  // ===========================================

  /**
   * Add reaction to message
   */
  const addReaction = useCallback((messageId, emoji) => {
    if (!socket || !conversationId) return;

    socket.emit('chat:react', {
      messageId,
      emoji
    });
  }, [socket, conversationId]);

  /**
   * Remove reaction from message
   */
  const removeReaction = useCallback((messageId, emoji) => {
    if (!socket || !conversationId) return;

    socket.emit('chat:react', {
      messageId,
      emoji,
      remove: true
    });
  }, [socket, conversationId]);

  // ===========================================
  // MESSAGE PINNING
  // ===========================================

  /**
   * Pin/unpin message
   */
  const togglePinMessage = useCallback((messageId) => {
    if (!socket || !conversationId) return;

    socket.emit('chat:pin', { messageId });
  }, [socket, conversationId]);

  // ===========================================
  // SEARCH
  // ===========================================

  /**
   * Search messages
   */
  const searchMessages = useCallback((query, callback) => {
    if (!socket || !conversationId || !query) return;

    socket.emit('chat:search', {
      conversationId,
      query
    }, (response) => {
      if (callback) {
        callback(response.results || []);
      }
    });
  }, [socket, conversationId]);

  // ===========================================
  // ATTACHMENTS
  // ===========================================

  /**
   * Upload attachment
   */
  const uploadAttachment = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/messages/attachments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data.attachment;
      } else {
        showToast(data.message || 'Upload failed', 'error');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Upload failed', 'error');
      return null;
    }
  }, [showToast]);

  // ===========================================
  // SOCKET EVENT LISTENERS
  // ===========================================

  useEffect(() => {
    if (!socket || !conversationId) return;

    // New message handler
    const handleNewMessage = (data) => {
      const { message, conversationId: msgConvId } = data;

      if (msgConvId === conversationId) {
        setMessages(prev => [...prev, message]);

        // Mark as read if it's for current user
        if (message.receiver?._id === currentUser?._id) {
          markMessagesAsRead(conversationId, [message._id]);
        }

        // Play notification sound
        playNotificationSound();

        // Show toast if not current user's message
        if (message.sender?._id !== currentUser?._id) {
          showToast(
            `${message.sender?.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
            'info',
            { duration: 4000 }
          );
        }

        // Scroll to bottom
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('chat:scroll-to-bottom'));
        }, 100);
      }
    };

    // Message edited handler
    const handleMessageEdited = (data) => {
      const { messageId, content, editedAt } = data;

      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, content, edited: true, editedAt } 
            : msg
        )
      );

      showToast('Message edited', 'info');
    };

    // Message deleted handler
    const handleMessageDeleted = (data) => {
      const { messageId } = data;

      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      showToast('Message deleted', 'info');
    };

    // Read receipt handler
    const handleReadReceipt = (data) => {
      const { messageIds, readBy, readAt } = data;

      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg._id) 
            ? { ...msg, isRead: true, readAt } 
            : msg
        )
      );

      // Update unread count
      if (readBy === currentUser?._id) {
        setUnreadCount(prev => Math.max(0, prev - messageIds.length));
      }
    };

    // All read handler
    const handleAllRead = (data) => {
      const { conversationId: convId, count } = data;

      if (convId === conversationId) {
        setMessages(prev => 
          prev.map(msg => ({ ...msg, isRead: true }))
        );
        setUnreadCount(0);
      }
    };

    // Typing handler
    const handleTyping = (data) => {
      const { userId, name, isTyping, conversationId: convId } = data;

      if (convId === conversationId && userId !== currentUser?._id) {
        setTypingUsers(prev => ({
          ...prev,
          [userId]: isTyping ? name : null
        }));
      }
    };

    // Reaction handler
    const handleReaction = (data) => {
      const { messageId, reactions } = data;

      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      );
    };

    // Pin toggled handler
    const handlePinToggled = (data) => {
      const { messageId, isPinned } = data;

      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId ? { ...msg, isPinned } : msg
        )
      );

      showToast(isPinned ? 'Message pinned' : 'Message unpinned', 'success');
    };

    // Register event listeners
    socket.on('chat:message', handleNewMessage);
    socket.on('chat:message-edited', handleMessageEdited);
    socket.on('chat:message-deleted', handleMessageDeleted);
    socket.on('chat:read-receipt', handleReadReceipt);
    socket.on('chat:all-read', handleAllRead);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:reaction', handleReaction);
    socket.on('chat:pin-toggled', handlePinToggled);

    return () => {
      socket.off('chat:message', handleNewMessage);
      socket.off('chat:message-edited', handleMessageEdited);
      socket.off('chat:message-deleted', handleMessageDeleted);
      socket.off('chat:read-receipt', handleReadReceipt);
      socket.off('chat:all-read', handleAllRead);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:reaction', handleReaction);
      socket.off('chat:pin-toggled', handlePinToggled);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, conversationId, currentUser, setMessages, setTypingUsers, setUnreadCount, showToast]);

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  /**
   * Play notification sound
   */
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.log('Audio play failed:', error);
    }
  };

  /**
   * Format message time
   */
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  /**
   * Group messages by date
   */
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });

    return groups;
  };

  return {
    // Connection
    joinConversation,
    leaveConversation,
    isConnected,
    
    // Messages
    sendMessage,
    editMessage,
    deleteMessage,
    forwardMessage,
    loadMoreMessages,
    
    // Read receipts
    markMessagesAsRead,
    markAllAsRead,
    
    // Typing
    sendTyping,
    
    // Reactions
    addReaction,
    removeReaction,
    
    // Pinning
    togglePinMessage,
    
    // Search
    searchMessages,
    
    // Attachments
    uploadAttachment,
    
    // Utilities
    formatMessageTime,
    groupMessagesByDate
  };
};

// ===========================================
// CHAT CONTEXT PROVIDER
// ===========================================
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useChatEvents } from './chatEvents';

const ChatContext = createContext();

export const ChatProvider = ({ children, conversationId }) => {
  const { socket, currentUser } = useSocket();
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize chat events
  const chatEvents = useChatEvents(socket, {
    conversationId,
    currentUser,
    messages,
    setMessages,
    typingUsers,
    setTypingUsers,
    setUnreadCount
  });

  /**
   * Load more messages
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    const nextPage = currentPage + 1;
    
    await chatEvents.loadMoreMessages(nextPage);
    
    setCurrentPage(nextPage);
    setIsLoading(false);
  }, [currentPage, hasMore, isLoading, chatEvents]);

  /**
   * Send a message with attachments
   */
  const sendMessageWithAttachments = useCallback(async (content, receiverId, files = []) => {
    if (!content.trim() && files.length === 0) return;

    let attachments = [];
    
    if (files.length > 0) {
      for (const file of files) {
        const attachment = await chatEvents.uploadAttachment(file);
        if (attachment) {
          attachments.push(attachment);
        }
      }
    }

    chatEvents.sendMessage(content, receiverId, attachments);
  }, [chatEvents]);

  const value = {
    // State
    messages,
    typingUsers,
    unreadCount,
    isLoading,
    hasMore,
    currentPage,
    
    // Actions
    ...chatEvents,
    sendMessageWithAttachments,
    loadMore,
    
    // Conversation info
    conversationId
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};