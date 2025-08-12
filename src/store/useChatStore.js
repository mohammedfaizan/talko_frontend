import { create } from "zustand";
import axios from "axios";
import { io } from "socket.io-client";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  socket: null,
  onlineUsers: [],

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getUsers: async (token) => {
    set({ isUsersLoading: true });
    try {
      const res = await axios.get(
        `https://talko-backend.onrender.com/api/users/getAll`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      set({ users: res.data });
    } catch (error) {
      console.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId, token) => {
    set({ isMessagesLoading: true });
    try {
      if (!userId) {
        console.error("getMessages called with undefined userId");
        return;
      }
      const res = await axios.get(
        `https://talko-backend.onrender.com/api/messages/${userId}`,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      // Process messages to ensure proper image URLs
      const messages = Array.isArray(res?.data) 
        ? res.data.map(msg => {
            // Debug log for each message
            console.log('Processing message:', msg);
            
            // Handle image URL
            let imageUrl = null;
            if (msg.image) {
              // Check if the image URL is already absolute
              imageUrl = msg.image.startsWith('http') 
                ? msg.image 
                : `https://talko-backend.onrender.com${msg.image.startsWith('/') ? '' : '/'}${msg.image}`;
              
              console.log('Processed image URL:', { original: msg.image, processed: imageUrl });
            }
            
            return {
              ...msg,
              image: imageUrl
            };
          })
        : [];
        
      console.log('Processed messages:', messages);
      set({ messages });
    } catch (error) {
      console.error(
        "Error fetching messages:", 
        error.response?.data?.message || error.message
      );
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessages: async (messageData, token) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axios.post(
        `https://talko-backend.onrender.com/api/messages/send/${selectedUser.clerkUserId}`,
        messageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newMessage = res.data;
      set({ messages: [...messages, newMessage] });
      return newMessage;
    } catch (error) {
      console.error(error.response?.data?.message || "Failed to send message");
    }
  },

  initializeSocket: (userId) => {
    if (get().socket) return get().socket;
    const socket = io("https://talko-backend.onrender.com", {
      query: { userId: userId },
    });

    socket.on("connect", () => console.log("Connected to the socket server"));
    socket.on("disconnect", () => console.log("Disconnected"));
    socket.on("getOnlineUsers", (users) => {
      set({ onlineUsers: users });
    });

    set({ socket });
    return socket;
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, socket } = get();
    if (!selectedUser?.clerkUserId || !socket) {
      console.warn("Cannot subscribe to messages: missing selectedUser or socket");
      return;
    }
    
    socket.off("newMessage");
    
    socket.on("newMessage", (newMessage) => {
      try {
        if (!newMessage?._id) {
          console.warn("Received invalid message:", newMessage);
          return;
        }
        
        // Process image URL for new messages
        const processedMessage = {
          ...newMessage,
          image: newMessage.image 
            ? newMessage.image.startsWith('http')
              ? newMessage.image
              : `https://talko-backend.onrender.com/${newMessage.image}`
            : null
        };
        
        const { messages } = get();
        const isFromSelected = processedMessage.fromClerkId === selectedUser.clerkUserId;
        const isDuplicate = messages.some(msg => msg._id === processedMessage._id);
        
        if (isFromSelected && !isDuplicate) {
          set({ 
            messages: [...messages, processedMessage].sort((a, b) => 
              new Date(a.createdAt) - new Date(b.createdAt)
            )
          });
        }
      } catch (error) {
        console.error("Error processing new message:", error);
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = get().socket;
    if (socket) socket.off("newMessage");
  },
}));
