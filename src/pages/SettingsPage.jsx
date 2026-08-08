import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateProfile, changePassword } from "../api/chatApi";
import { useTheme } from "../ThemeContext";
import { socket } from "../socket";

const API_URL = "http://localhost:5000";

const SettingsPage = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [about, setAbout] = useState(user?.about || "");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileSuccess, setProfileSuccess] = useState("");
    const [showChangePassword, setShowChangePassword] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    const [showNotifications, setShowNotifications] = useState(false);
    const [messageNotifications, setMessageNotifications] = useState(() => {
        return localStorage.getItem("pulsechat_message_notifications") !== "false";
    });
    const [notificationSound, setNotificationSound] = useState(() => {
        return localStorage.getItem("pulsechat_notification_sound") !== "false";
    });

    const [showAppearance, setShowAppearance] = useState(false);
    const { theme, setTheme } = useTheme();

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        setProfileError("");
        setProfileSuccess("");

        if (!name.trim()) {
            setProfileError("Name is required");
            return;
        }

        try {
            setSavingProfile(true);

            const updatedUser = await updateProfile(
                name,
                about
            );

            setUser(updatedUser);

            setProfileSuccess("Profile updated successfully");

            setTimeout(() => {
                setShowEditProfile(false);
                setProfileSuccess("");
            }, 1000);

        } catch (error) {
            setProfileError(error.message);

        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        setPasswordError("");
        setPasswordSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("Please fill in all fields");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError(
                "New password must be at least 6 characters"
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(
                "New passwords do not match"
            );
            return;
        }

        try {
            setChangingPassword(true);

            await changePassword(
                currentPassword,
                newPassword
            );

            setPasswordSuccess(
                "Password changed successfully"
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                setShowChangePassword(false);
                setPasswordSuccess("");
            }, 1200);

        } catch (error) {
            setPasswordError(error.message);

        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });

            socket.disconnect();

            localStorage.removeItem("selectedConversation");

            setUser(null);
            navigate("/login");
        } catch (error) {
            console.log("Logout failed:", error);
        }
    };

    return (
        <div
            className={`min-h-screen ${theme === "light"
                    ? "bg-gray-100 text-gray-900"
                    : "bg-[#05060A] text-white"
                }`}
        >

            {/* HEADER */}
            <div className="h-16 border-b border-white/10 bg-[#0C0F1A] flex items-center px-5">

                <button
                    onClick={() => navigate("/chat")}
                    className="text-xl mr-4 hover:text-[#635BFF]"
                >
                    ←
                </button>

                <h1 className="text-lg font-semibold">
                    Settings
                </h1>

            </div>

            {/* CONTENT */}
            <div className="max-w-2xl mx-auto px-4 py-8">

                {/* PROFILE */}
                <section className="mb-8">

                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                        Profile
                    </p>

                    <div className="bg-[#0C0F1A] border border-white/10 rounded-2xl overflow-hidden">

                        <div className="p-5 flex items-center gap-4">

                            {/* AVATAR */}
                            <div className="w-16 h-16 rounded-full bg-[#181C2A] flex items-center justify-center text-2xl font-semibold">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>

                            <div className="min-w-0">

                                <h2 className="font-semibold text-lg truncate">
                                    {user?.name}
                                </h2>

                                <p className="text-sm text-gray-400 truncate">
                                    {user?.email}
                                </p>

                            </div>

                        </div>

                        <div className="border-t border-white/10 p-4">

                            <p className="text-xs text-gray-500 mb-1">
                                About
                            </p>

                            <p className="text-sm text-gray-300">
                                {user?.about || "Hey there! I am using PulseChat."}
                            </p>

                        </div>

                    </div>

                </section>

                {/* ACCOUNT */}
                <section className="mb-8">

                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                        Account
                    </p>

                    <div className="bg-[#0C0F1A] border border-white/10 rounded-2xl overflow-hidden">

                        {/* EDIT PROFILE */}
                        <button
                            onClick={() => {
                                setName(user?.name || "");
                                setAbout(user?.about || "");
                                setProfileError("");
                                setProfileSuccess("");
                                setShowEditProfile(true);
                            }}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition"
                        >
                            <div className="text-left">
                                <p className="text-sm font-medium">
                                    Edit Profile
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    Change your name and about
                                </p>
                            </div>

                            <span className="text-gray-500">
                                ›
                            </span>
                        </button>

                        <div className="border-t border-white/10" />

                        {/* CHANGE PASSWORD */}
                        <button
                            onClick={() => {
                                setCurrentPassword("");
                                setNewPassword("");
                                setConfirmPassword("");
                                setPasswordError("");
                                setPasswordSuccess("");
                                setShowChangePassword(true);
                            }}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition"
                        >
                            <div className="text-left">
                                <p className="text-sm font-medium">
                                    Change Password
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    Update your account password
                                </p>
                            </div>

                            <span className="text-gray-500">
                                ›
                            </span>
                        </button>

                    </div>

                </section>

                {/* PREFERENCES */}
                <section className="mb-8">

                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                        Preferences
                    </p>

                    <div className="bg-[#0C0F1A] border border-white/10 rounded-2xl overflow-hidden">

                        <button
                            onClick={() => setShowNotifications(true)}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition"
                        >

                            <div className="text-left">
                                <p className="text-sm font-medium">
                                    Notifications
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    Message and sound preferences
                                </p>
                            </div>

                            <span className="text-gray-500">
                                ›
                            </span>

                        </button>

                        <div className="border-t border-white/10" />

                        <button
                            onClick={() => setShowAppearance(true)}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition"
                        >

                            <div className="text-left">
                                <p className="text-sm font-medium">
                                    Appearance
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    Customize PulseChat
                                </p>
                            </div>

                            <span className="text-gray-500">
                                ›
                            </span>

                        </button>

                    </div>

                </section>

                {/* LOGOUT */}
                <section>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl py-3 text-sm font-medium hover:bg-red-500/20 transition"
                    >
                        Log out
                    </button>

                </section>

                <p className="text-center text-xs text-gray-600 mt-8">
                    PulseChat
                </p>

            </div>
            {showEditProfile && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">

                    <div className="w-full max-w-md bg-[#0C0F1A] border border-white/10 rounded-2xl shadow-2xl">

                        {/* HEADER */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">

                            <h2 className="font-semibold">
                                Edit Profile
                            </h2>

                            <button
                                onClick={() => setShowEditProfile(false)}
                                className="text-gray-400 hover:text-white text-xl"
                            >
                                ×
                            </button>

                        </div>

                        {/* FORM */}
                        <form
                            onSubmit={handleUpdateProfile}
                            className="p-5 space-y-5"
                        >

                            {/* NAME */}
                            <div>

                                <label className="block text-xs text-gray-400 mb-2">
                                    Name
                                </label>

                                <input
                                    type="text"
                                    value={name}
                                    maxLength={50}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#171B28] border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#635BFF]"
                                    placeholder="Enter your name"
                                />

                                <p className="text-xs text-gray-600 mt-1 text-right">
                                    {name.length}/50
                                </p>

                            </div>

                            {/* ABOUT */}
                            <div>

                                <label className="block text-xs text-gray-400 mb-2">
                                    About
                                </label>

                                <textarea
                                    value={about}
                                    maxLength={150}
                                    rows={3}
                                    onChange={(e) => setAbout(e.target.value)}
                                    className="w-full bg-[#171B28] border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#635BFF] resize-none"
                                    placeholder="Tell something about yourself"
                                />

                                <p className="text-xs text-gray-600 mt-1 text-right">
                                    {about.length}/150
                                </p>

                            </div>

                            {/* ERROR */}
                            {profileError && (
                                <p className="text-sm text-red-400">
                                    {profileError}
                                </p>
                            )}

                            {/* SUCCESS */}
                            {profileSuccess && (
                                <p className="text-sm text-green-400">
                                    {profileSuccess}
                                </p>
                            )}

                            {/* BUTTONS */}
                            <div className="flex gap-3">

                                <button
                                    type="button"
                                    onClick={() => setShowEditProfile(false)}
                                    className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-gray-300 hover:bg-white/5"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={savingProfile}
                                    className="flex-1 bg-[#635BFF] rounded-lg py-2.5 text-sm font-medium hover:bg-[#574FFF] disabled:opacity-50"
                                >
                                    {savingProfile ? "Saving..." : "Save Changes"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {showChangePassword && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">

                    <div className="w-full max-w-md bg-[#0C0F1A] border border-white/10 rounded-2xl shadow-2xl">

                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <h2 className="font-semibold">
                                Change Password
                            </h2>

                            <button
                                onClick={() => setShowChangePassword(false)}
                                className="text-gray-400 hover:text-white text-xl"
                            >
                                ×
                            </button>
                        </div>

                        <form
                            onSubmit={handleChangePassword}
                            className="p-5 space-y-5"
                        >

                            <div>
                                <label className="block text-xs text-gray-400 mb-2">
                                    Current Password
                                </label>

                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-[#171B28] border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#635BFF]"
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-2">
                                    New Password
                                </label>

                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-[#171B28] border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#635BFF]"
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-2">
                                    Confirm New Password
                                </label>

                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#171B28] border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#635BFF]"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            {passwordError && (
                                <p className="text-sm text-red-400">
                                    {passwordError}
                                </p>
                            )}

                            {passwordSuccess && (
                                <p className="text-sm text-green-400">
                                    {passwordSuccess}
                                </p>
                            )}

                            <div className="flex gap-3">

                                <button
                                    type="button"
                                    onClick={() => setShowChangePassword(false)}
                                    className="flex-1 border border-white/10 rounded-lg py-2.5 text-sm text-gray-300 hover:bg-white/5"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={changingPassword}
                                    className="flex-1 bg-[#635BFF] rounded-lg py-2.5 text-sm font-medium hover:bg-[#574FFF] disabled:opacity-50"
                                >
                                    {changingPassword ? "Changing..." : "Change Password"}
                                </button>

                            </div>

                        </form>
                    </div>
                </div>
            )}


            {showNotifications && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">

                    <div className="w-full max-w-md bg-[#0C0F1A] border border-white/10 rounded-2xl shadow-2xl">

                        {/* HEADER */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">

                            <h2 className="font-semibold">
                                Notifications
                            </h2>

                            <button
                                onClick={() => setShowNotifications(false)}
                                className="text-gray-400 hover:text-white text-xl"
                            >
                                ×
                            </button>

                        </div>

                        {/* OPTIONS */}
                        <div className="p-5">

                            {/* MESSAGE NOTIFICATIONS */}
                            <div className="flex items-center justify-between gap-4 py-3">

                                <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                        Message Notifications
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Receive notifications for new messages
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = !messageNotifications;
                                        setMessageNotifications(next);
                                        localStorage.setItem(
                                            "pulsechat_message_notifications",
                                            String(next)
                                        );
                                    }}
                                    className={`relative w-11 h-6 rounded-full transition ${messageNotifications
                                            ? "bg-[#635BFF]"
                                            : "bg-gray-700"
                                        }`}
                                    aria-label="Toggle message notifications"
                                >
                                    <span
                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${messageNotifications
                                                ? "left-6"
                                                : "left-1"
                                            }`}
                                    />
                                </button>

                            </div>

                            <div className="border-t border-white/10" />

                            {/* NOTIFICATION SOUND */}
                            <div className="flex items-center justify-between gap-4 py-3">

                                <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                        Notification Sound
                                    </p>

                                    <p className="text-xs text-gray-500 mt-1">
                                        Play a sound for new messages
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = !notificationSound;
                                        setNotificationSound(next);
                                        localStorage.setItem(
                                            "pulsechat_notification_sound",
                                            String(next)
                                        );
                                    }}
                                    className={`relative w-11 h-6 rounded-full transition ${notificationSound
                                            ? "bg-[#635BFF]"
                                            : "bg-gray-700"
                                        }`}
                                    aria-label="Toggle notification sound"
                                >
                                    <span
                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${notificationSound
                                                ? "left-6"
                                                : "left-1"
                                            }`}
                                    />
                                </button>

                            </div>

                            <button
                                type="button"
                                onClick={() => setShowNotifications(false)}
                                className="w-full mt-5 bg-[#635BFF] rounded-lg py-2.5 text-sm font-medium hover:bg-[#574FFF] transition"
                            >
                                Done
                            </button>

                        </div>

                    </div>

                </div>
            )}



            {showAppearance && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">

                    <div className="w-full max-w-md bg-[#0C0F1A] border border-white/10 rounded-2xl shadow-2xl">

                        {/* HEADER */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">

                            <h2 className="font-semibold">
                                Appearance
                            </h2>

                            <button
                                onClick={() => setShowAppearance(false)}
                                className="text-gray-400 hover:text-white text-xl"
                            >
                                ×
                            </button>

                        </div>

                        {/* OPTIONS */}
                        <div className="p-5">

                            <p className="text-xs text-gray-500 mb-4">
                                Choose how PulseChat should appear.
                            </p>

                            {/* DARK */}
                            <button
                                type="button"
                                onClick={() => {
                                    setTheme("dark");
                                    localStorage.setItem("pulsechat_theme", "dark");
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition ${theme === "dark"
                                        ? "border-[#635BFF] bg-[#635BFF]/10"
                                        : "border-white/10 hover:bg-white/5"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#171B28] flex items-center justify-center">
                                        🌙
                                    </div>

                                    <div className="text-left">
                                        <p className="text-sm font-medium">
                                            Dark
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            Use the current PulseChat dark theme
                                        </p>
                                    </div>
                                </div>

                                {theme === "dark" && (
                                    <span className="text-[#8b83ff] text-lg">
                                        ✓
                                    </span>
                                )}
                            </button>

                            {/* LIGHT */}
                            <button
                                type="button"
                                onClick={() => {
                                    setTheme("light");
                                    localStorage.setItem("pulsechat_theme", "light");
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border transition mt-3 ${theme === "light"
                                        ? "border-[#635BFF] bg-[#635BFF]/10"
                                        : "border-white/10 hover:bg-white/5"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                        ☀️
                                    </div>

                                    <div className="text-left">
                                        <p className="text-sm font-medium">
                                            Light
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            Use a lighter appearance
                                        </p>
                                    </div>
                                </div>

                                {theme === "light" && (
                                    <span className="text-[#635BFF] text-lg">
                                        ✓
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowAppearance(false)}
                                className="w-full mt-5 bg-[#635BFF] rounded-lg py-2.5 text-sm font-medium hover:bg-[#574FFF] transition"
                            >
                                Done
                            </button>

                        </div>

                    </div>

                </div>
            )}


        </div>
    );
};

export default SettingsPage;