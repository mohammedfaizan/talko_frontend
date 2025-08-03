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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set({ messages: res.data });
    } catch (error) {
      console.error(
        error.response?.data?.message || "Error in fetching messages"
      );
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
    if (!selectedUser || !socket) return;
    socket.off("newMessage");
    socket.on("newMessage", (newMessage) => {
      const isFromSelected =
        newMessage.fromClerkId === selectedUser.clerkUserId;
      const isDuplicate = get().messages.some(
        (msg) => msg._id === newMessage._id
      );
      if (isFromSelected && !isDuplicate) {
        set({ messages: [...get().messages, newMessage] });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = get().socket;
    if (socket) socket.off("newMessage");
  },
}));
