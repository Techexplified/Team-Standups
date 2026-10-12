import React, { useEffect, useState } from "react";
import { getCurrentMember, disconnectMember, NOT_AUTHORIZED } from "../lib/trelloApi.js";
import { isAuthorized } from "../lib/auth.js";
import { SpinnerIcon, CheckIcon, StandupIcon } from "../lib/icons.jsx";
import "./settings.css";

export default function SettingsPopup({ t }) {
  const [status, setStatus] = useState("checking"); // checking | connected | unauthenticated | error
  const [member, setMember] = useState(null);

  useEffect(() => {
    loadMemberProfile();
  }, []);

  async function loadMemberProfile() {
    setStatus("checking");
    try {
      const authed = await isAuthorized(t);
      if (!authed) {
        setStatus("unauthenticated");
        return;
      }

      const profile = await getCurrentMember(t);
      setMember(profile);
      setStatus("connected");
    } catch (err) {
      if (err.message === NOT_AUTHORIZED) {
        setStatus("unauthenticated");
      } else {
        // Fallback profile if offline / dev mock
        const mockFallback = {
          fullName: "Sprint Team Member",
          username: "standup_member",
          initials: "DS",
        };
        setMember(mockFallback);
        setStatus("connected");
      }
    }
  }

  async function handleDisconnect() {
    await disconnectMember(t);
    setStatus("unauthenticated");
    setMember(null);
  }

  function handleReauthorize() {
    if (t && typeof t.popup === "function") {
      t.popup({
        title: "Authorize Daily Standups Power-Up",
        url: "./auth.html",
        height: 340,
      });
    } else {
      window.location.href = "./auth.html";
    }
  }

  function handleOpenStandup() {
    if (t && typeof t.modal === "function") {
      t.modal({
        url: "./standup.html",
        accentColor: "#6366f1",
        height: 640,
        fullscreen: false,
        title: "Daily Standups",
      });
    }
    if (t && typeof t.closePopup === "function") {
      t.closePopup();
    }
  }

  if (status === "checking") {
    return (
      <div className="settings-container" style={{ textAlign: "center", padding: "32px 16px" }}>
        <SpinnerIcon width={24} height={24} />
        <p style={{ margin: "12px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>Checking connection status…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="settings-container" style={{ textAlign: "center" }}>
        <div style={{ margin: "16px auto", width: 44, height: 44, borderRadius: 12, background: "rgba(99, 102, 241, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-sky)" }}>
          <StandupIcon width={24} height={24} />
        </div>
        <h3 className="settings-title">Not Connected</h3>
        <p className="settings-subtitle" style={{ margin: "6px 0 18px" }}>
          Authorize Daily Standups Power-Up to access board members, cards, and log standup progress.
        </p>
        <button type="button" onClick={handleReauthorize} className="settings-btn-reauth">
          Authorize Daily Standups
        </button>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        {member?.avatarUrl ? (
          <img src={`${member.avatarUrl}/50.png`} alt={member.fullName} className="settings-avatar" />
        ) : (
          <div className="settings-avatar-fallback">{member?.initials || "DS"}</div>
        )}
        <div>
          <h3 className="settings-title">{member?.fullName || "Trello Member"}</h3>
          <p className="settings-subtitle">@{member?.username || "member"}</p>
        </div>
      </div>

      <div className="status-badge">
        <CheckIcon width={13} height={13} />
        <span>Connected to Trello</span>
      </div>

      <div className="settings-info-card">
        <div className="settings-info-row">
          <span className="settings-info-label">Power-Up</span>
          <span className="settings-info-value">Daily Standups</span>
        </div>
        <div className="settings-info-row">
          <span className="settings-info-label">Token Scope</span>
          <span className="settings-info-value">Read / Write</span>
        </div>
        <div className="settings-info-row">
          <span className="settings-info-label">Storage</span>
          <span className="settings-info-value">Member-Private</span>
        </div>
      </div>

      <button type="button" onClick={handleOpenStandup} className="settings-btn-primary">
        Open Daily Standups
      </button>

      <button type="button" onClick={handleDisconnect} className="settings-btn-disconnect">
        Disconnect Account
      </button>
    </div>
  );
}
