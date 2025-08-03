import React from "react";
import { SignOutButton, UserProfile, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import Modal from "../ReuseableComponents/Modal";
import DarkMode from "../Landing/DarkMode";
import styles from "../Styles/AuthenticatedHeader.module.css";

// const dummyUser = {
//   firstName: "John",
//   imageUrl: "https://i.pravatar.cc/100?img=6",
// };

const AuthenticatedHeader = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        {/* Logo + App Name */}
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="Logo" className={styles.logoImage} />
          <span className={styles.appName}>Talko</span>
        </div>

        {/* Right controls */}
        <div className={styles.controls}>
          <div className={styles.userInfo}>
            {user?.imageUrl && (
              <div className="avatar">
                <div className={styles.avatar}>
                  <img
                    src={user.imageUrl}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
            )}
            <span className={styles.userName}>{user?.firstName || "User"}</span>
          </div>

          <button
            className={styles.editBtn}
            onClick={() => document.getElementById("edit_profile").showModal()}
          >
            Edit Profile
          </button>
          <Modal id="edit_profile">
            <UserProfile />
          </Modal>

          <DarkMode />

          <div>
            <SignOutButton
              signOutCallback={() => navigate("/")}
              className={styles.logoutBtn}
            >
              Logout
            </SignOutButton>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;
