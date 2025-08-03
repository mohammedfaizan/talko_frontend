import React from "react";
import styles from "../Styles/Message.module.css";
import Sidebar from "./Sidebar";
import NoChatSelected from "./NoChatSelected";
import Chat from "./Chat";
import { useChatStore } from "../store/useChatStore";
export default function MainLayout() {
  const { selectedUser } = useChatStore();
  return (
    <div className={styles.container}>
      <div className={styles.sidebarwrapper}>
        <Sidebar />
      </div>
      <div className={styles.chatWrapper}>
        {!selectedUser ? <NoChatSelected /> : <Chat />}
      </div>
    </div>
  );
}
