import React from "react";
import styles from "../Styles/Sidebar.module.css";
import { Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

// const users = [
//   {
//     _id: "1",
//     firstName: "Alice",
//     lastName: "Johnson",
//     profileImage: "https://i.pravatar.cc/150?img=1",
//     clerkUserId: "clerk_101",
//   },
//   {
//     _id: "2",
//     firstName: "Bob",
//     lastName: "Smith",
//     profileImage: "https://i.pravatar.cc/150?img=2",
//     clerkUserId: "clerk_102",
//   },
//   {
//     _id: "3",
//     firstName: "Charlie",
//     lastName: "Brown",
//     profileImage: "https://i.pravatar.cc/150?img=3",
//     clerkUserId: "clerk_103",
//   },
// ];

export default function Sidebar() {
  const { getToken } = useAuth();
  const { getUsers, users, selectedUser, setSelectedUser, onlineUsers } =
    useChatStore();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = await getToken({ template: "myjwt" });
      if (token) {
        await getUsers(token); // Assuming getUsers needs the token
      }
    };

    fetchUsers();
  }, [getToken, getUsers]); // Empty dependency array to run only once on mount
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Users className="w-5 h-5" />
          <span className="font-medium hidden lg:block">Friends</span>
        </div>
      </div>

      <div className={styles.userList}>
        {users.length > 0 ? (
          users.map((user) => (
            <button
              key={user._id}
              className={`${styles.userItem} ${
                selectedUser?._id === user._id ? styles.userItemActive : ""
              }`}
              aria-label={`Chat with ${user.firstName}`}
              onClick={() => setSelectedUser(user)}
            >
              <div className={styles.avatarContainer}>
                <div className={styles.avatarImageWrapper}>
                  <img src={user.profileImage} className={styles.avatarImage} />
                  {onlineUsers.includes(user.clerkUserId) && (
                    <span className={styles.onlineIndicator} />
                  )}
                </div>
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>
                  {user.firstName} {" " + user.lastName}
                </div>
                <div className={styles.userStatus}>
                  {onlineUsers.includes(user.clerkUserId)
                    ? "Online"
                    : "Offline"}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className={styles.noUsers}>
            <p>No users found</p>
          </div>
        )}
      </div>
    </aside>
  );
}
