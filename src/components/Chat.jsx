import { MessageSquare, X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import moment from "moment";
import styles from "../Styles/Chat.module.css";
import MessageInput from "./MessageInput";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useChatStore } from "../store/useChatStore";

const Chat = () => {
  const messageEndRef = useRef(null);
  const { getToken } = useAuth();
  const { user } = useUser();
  const {
    messages,
    selectedUser,
    setSelectedUser,
    getMessages,
    initializeSocket, // fixed typo
    disconnectSocket,
    subscribeToMessages,
    unsubscribeFromMessages,
    onlineUsers,
  } = useChatStore();

  const setupSocket = useCallback(async () => {
    try {
      const token = await getToken({ template: "myjwt" });
      if (token) {
        initializeSocket(token); // use token, not user.id
      }
    } catch (error) {
      console.error("Failed to setup socket:", error);
    }
  }, [getToken, initializeSocket]);

  useEffect(() => {
    setupSocket();
    return () => disconnectSocket();
  }, [setupSocket, disconnectSocket]);

  const fetchMessages = useCallback(async () => {
    try {
      const token = await getToken({ template: "myjwt" });
      if (token && selectedUser) {
        await getMessages(selectedUser.clerkUserId, token);
        subscribeToMessages();
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  }, [selectedUser, getMessages, getToken, subscribeToMessages]);

  useEffect(() => {
    if (selectedUser) fetchMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser, fetchMessages, unsubscribeFromMessages]);

  useEffect(() => {
    console.log('Current messages:', messages);
  }, [messages]);

  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!selectedUser) return <div>Select a user to start chatting</div>;

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className={styles.avatarContainer}>
              <img
                src={selectedUser.profileImage || "/avatar.png"}
                alt={selectedUser.firstName}
                className="w-full h-full object-cover rounded-full"
              />
              {onlineUsers.includes(selectedUser.clerkUserId) && (
                <span className={styles.onlineIndicator} />
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm md:text-base">
                {selectedUser.firstName}
              </h3>
              <p className="text-xs text-base-content/70">
                {onlineUsers.includes(selectedUser.clerkUserId)
                  ? "Online"
                  : "Offline"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedUser(null)}
            className="btn btn-sm btn-ghost"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      {/* Message Area */}
      <div className={styles.messagesArea}>
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div
              key={message._id}
              className={`chat ${
                message.fromClerkId === user.id ? "chat-end" : "chat-start"
              }`}
              ref={index === messages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className={styles.chatImage}>
                  <img
                    src={
                      message.fromClerkId === user.id
                        ? user.imageUrl || "/avatar.png"
                        : selectedUser.profileImage || "/avatar.png"
                    }
                    alt="profile pic"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <div className={styles.chatHeaderText}>
                <time className={styles.chatTimestamp}>
                  {moment(message.createdAt).fromNow()}
                </time>
              </div>
              <div className={styles.chatBubble}>
                {message.image && (
                  <div className="relative">
                    <img
                      src={typeof message.image === 'object' ? message.image.url : message.image}
                      alt="Attachment"
                      className="max-w-full sm:max-w-xs md:max-w-sm rounded-md mb-2"
                      loading="lazy"
                      onError={(e) => {
                        console.error('Failed to load image:', message.image, e);
                        console.log('Message object:', message);
                        e.target.style.display = 'none';
                      }}
                    />
                    {/* Show thumbnail if available */}
                    {message.image.thumbnailUrl && (
                      <img
                        src={message.image.thumbnailUrl}
                        alt="Thumbnail"
                        className="hidden" // Hide by default, used as fallback
                        onError={(e) => {
                          // If thumbnail fails, it will be hidden
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                )}
                {message.text && <p className="break-words">{message.text}</p>}
              </div>
              {index === messages.length - 1 && <div id="message-end" />}
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className="flex gap-4 mb-4">
              <div className="relative">
                <div className={styles.emptyIcon}>
                  <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
              </div>
            </div>
            <h2 className={styles.emptyTitle}>Start your Conversation</h2>
          </div>
        )}
      </div>
      <div className={styles.messageInputContainer}>
        <MessageInput />
      </div>
    </div>
  );
};

export default Chat;
