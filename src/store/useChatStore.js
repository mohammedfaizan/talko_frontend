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
      
      console.log('Fetching messages for user:', userId);
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
      
      console.log('Fetched messages:', res.data);
      
      const messages = Array.isArray(res?.data) 
        ? res.data.map(msg => {
            // Process image URL if it exists
            let imageUrl = null;
            if (msg.image) {
              // If it's already a URL string
              if (typeof msg.image === 'string') {
                imageUrl = msg.image.startsWith('http') 
                  ? msg.image 
                  : `https://talko-backend.onrender.com${msg.image.startsWith('/') ? '' : '/'}${msg.image}`;
              } 
              // If it's an object (from ImageKit), use the URL property
              else if (msg.image.url) {
                imageUrl = msg.image.url;
              }
              // If it's an object with a different structure, try to find the URL
              else if (msg.image.imageUrl) {
                imageUrl = msg.image.imageUrl;
              }
            }
            
            return {
              ...msg,
              image: imageUrl ? {
                url: imageUrl,
                // Include thumbnail if available
                thumbnailUrl: msg.image?.thumbnailUrl || msg.image?.thumbnails?.[0] || null
              } : null
            };
          })
        : [];
        
      console.log('Processed messages:', messages);
      set({ messages });
      return messages;
      
    } catch (error) {
      console.error("Error fetching messages:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      set({ messages: [] });
      throw error;
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessages: async (formData, token) => {
    const { selectedUser, messages } = get();
    if (!selectedUser?.clerkUserId) {
      console.error('No selected user');
      throw new Error('No user selected');
    }

    try {
      console.log('Sending message to:', selectedUser.clerkUserId);
      
      const response = await axios.post(
        `https://talko-backend.onrender.com/api/messages/send/${selectedUser.clerkUserId}`,
        formData,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        }
      );

      console.log('Message sent successfully:', response.data);
      
      // Process the response to ensure proper message format
      const newMessage = response.data;
      
      // If the message has an image, make sure it's in the correct format
      if (newMessage.image) {
        // If it's already a URL string, use it as is
        if (typeof newMessage.image === 'string') {
          if (!newMessage.image.startsWith('http')) {
            newMessage.image = `https://talko-backend.onrender.com${newMessage.image.startsWith('/') ? '' : '/'}${newMessage.image}`;
          }
        } 
        // If it's an object (from ImageKit), extract the URL
        else if (newMessage.image.url) {
          newMessage.image = newMessage.image.url;
        }
      }

      // Add the new message to the current messages
      const updatedMessages = [...messages, newMessage].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      set({ messages: updatedMessages });
      return newMessage;
      
    } catch (error) {
      console.error('Error sending message:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      throw error;
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
