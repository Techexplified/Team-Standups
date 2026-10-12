import React, { useEffect, useState } from "react";
import { isAuthorized } from "../lib/auth.js";
import { getCurrentMember } from "../lib/trelloApi.js";
import {
  StandupIcon,
  CheckIcon,
  FlameIcon,
  AlertCircleIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
} from "../lib/icons.jsx";
import "./standup.css";

export default function StandupApp({ t }) {
  const [authorized, setAuthorized] = useState(false);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("full"); // "full" or "card-back-section"

  // Standup form fields
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");
  const [hasBlocker, setHasBlocker] = useState(false);
  const [submittedToday, setSubmittedToday] = useState(false);

  // Standups list
  const [teamStandups, setTeamStandups] = useState([]);

  useEffect(() => {
    // Check URL params for view type
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("view") === "card-back-section") {
      setViewMode("card-back-section");
    }

    checkAuthAndLoad();
  }, []);

  async function checkAuthAndLoad() {
    setLoading(true);
    try {
      const authed = await isAuthorized(t);
      setAuthorized(authed);
      if (authed) {
        const prof = await getCurrentMember(t).catch(() => ({
          fullName: "Sprint Member",
          username: "sprint_member",
          initials: "SM",
        }));
        setMember(prof);
      }
    } catch (e) {
      setAuthorized(false);
    } finally {
      setLoading(false);
    }

    // Load any saved standups from mock/storage
    try {
      const saved = localStorage.getItem("ds_today_standups");
      if (saved) {
        setTeamStandups(JSON.parse(saved));
      } else {
        // Seed initial example standup for demonstration
        setTeamStandups([
          {
            id: "s1",
            author: "Alex Morgan",
            avatarText: "AM",
            time: "09:30 AM",
            yesterday: "Finalized sprint backlog & updated Trello cards.",
            today: "Implement OAuth flow and multi-page routing.",
            blockers: "",
            hasBlocker: false,
          },
        ]);
      }
    } catch (e) {}
  }

  function handleAuthorizeClick() {
    if (t && typeof t.popup === "function") {
      t.popup({
        title: "Authorize Daily Standups",
        url: "./auth.html",
        height: 340,
      });
    } else {
      window.location.href = "./auth.html";
    }
  }

  function handleSubmitStandup(e) {
    e.preventDefault();
    if (!today.trim()) return;

    const newEntry = {
      id: "s_" + Date.now(),
      author: member?.fullName || "Current User",
      avatarText: member?.initials || "ME",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      yesterday: yesterday.trim() || "Worked on sprint tasks.",
      today: today.trim(),
      blockers: hasBlocker ? blockers.trim() : "",
      hasBlocker: hasBlocker,
    };

    const updated = [newEntry, ...teamStandups];
    setTeamStandups(updated);
    try {
      localStorage.setItem("ds_today_standups", JSON.stringify(updated));
    } catch (e) {}

    // If on card back, update card shared data
    if (t && typeof t.set === "function") {
      t.set("card", "shared", "standupData", {
        completed: true,
        hasBlocker: hasBlocker,
        updatedAt: Date.now(),
      }).catch(() => {});
    }

    setSubmittedToday(true);
    setYesterday("");
    setToday("");
    setBlockers("");
    setHasBlocker(false);
  }

  if (viewMode === "card-back-section") {
    return (
      <div className="compact-card-back">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
            <StandupIcon width={16} height={16} />
            <span>Today's Standup Status</span>
          </div>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 9999, background: submittedToday ? "rgba(16, 185, 129, 0.2)" : "rgba(99, 102, 241, 0.2)", color: submittedToday ? "#10b981" : "#818cf8" }}>
            {submittedToday ? "Updated" : "Pending"}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
          {submittedToday
            ? "Your daily standup update has been recorded for this sprint."
            : "Share yesterday's achievements, today's goals, and any blockers."}
        </p>
      </div>
    );
  }

  return (
    <div className="standup-layout">
      <header className="standup-header">
        <div className="standup-brand">
          <img src="./icons/icon.svg" alt="Daily Standups" className="standup-logo" />
          <div>
            <h1 className="standup-title">Daily Standups</h1>
            <p className="standup-tagline">Sprint Sync & Blocker Tracker</p>
          </div>
        </div>
        <div className="standup-user-badge">
          <div className="user-avatar">{member?.initials || "SM"}</div>
          <span>{member?.fullName || "Sprint Member"}</span>
        </div>
      </header>

      <main className="standup-main">
        {!authorized && !loading && (
          <div style={{ padding: 16, background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 12, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <StandupIcon width={24} height={24} />
              <div>
                <h4 style={{ margin: 0, fontSize: 14 }}>Connect Trello Account</h4>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>Authorize Daily Standups to sync updates and member assignments.</p>
              </div>
            </div>
            <button type="button" onClick={handleAuthorizeClick} className="btn-submit" style={{ padding: "8px 16px" }}>
              Authorize Now
            </button>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8" }}>
              <UsersIcon width={20} height={20} />
            </div>
            <div>
              <p className="stat-val">{teamStandups.length}</p>
              <p className="stat-label">Updates Today</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <CheckIcon width={20} height={20} />
            </div>
            <div>
              <p className="stat-val">{submittedToday ? "Completed" : "Pending"}</p>
              <p className="stat-label">Your Standup</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
              <AlertCircleIcon width={20} height={20} />
            </div>
            <div>
              <p className="stat-val">{teamStandups.filter((s) => s.hasBlocker).length}</p>
              <p className="stat-label">Blockers Flagged</p>
            </div>
          </div>
        </div>

        <div className="card-box">
          <h2 className="card-box-title">
            <FlameIcon width={18} height={18} />
            Log Today's Standup
          </h2>
          <form onSubmit={handleSubmitStandup}>
            <div className="form-group">
              <label className="form-label">1. What did you accomplish yesterday?</label>
              <textarea
                className="form-textarea"
                placeholder="e.g., Reviewed PR #42, finished API integration..."
                value={yesterday}
                onChange={(e) => setYesterday(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">2. What are you working on today? *</label>
              <textarea
                className="form-textarea"
                placeholder="e.g., Implementing card-back section and OAuth callback..."
                value={today}
                onChange={(e) => setToday(e.target.value)}
                required
              />
            </div>

            <label className="blocker-toggle">
              <input
                type="checkbox"
                className="blocker-checkbox"
                checked={hasBlocker}
                onChange={(e) => setHasBlocker(e.target.checked)}
              />
              <span>I have a blocker or dependency that needs team attention</span>
            </label>

            {hasBlocker && (
              <div className="form-group">
                <label className="form-label" style={{ color: "#f87171" }}>3. Describe the blocker:</label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g., Waiting for backend deployment or credentials..."
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}
                />
              </div>
            )}

            <button type="submit" className="btn-submit">
              <CheckIcon width={16} height={16} />
              Submit Standup Update
            </button>
          </form>
        </div>

        <div className="card-box">
          <h2 className="card-box-title">
            <ClockIcon width={18} height={18} />
            Team Standups Feed
          </h2>
          {teamStandups.map((s) => (
            <div key={s.id} className="standup-item">
              <div className="standup-item-header">
                <div className="standup-item-user">
                  <div className="user-avatar" style={{ width: 22, height: 22, fontSize: 10 }}>{s.avatarText}</div>
                  <span>{s.author}</span>
                </div>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>{s.time}</span>
              </div>
              <div className="standup-item-body">
                <div>
                  <span className="standup-section-heading">Yesterday: </span>
                  <span>{s.yesterday}</span>
                </div>
                <div>
                  <span className="standup-section-heading">Today: </span>
                  <span>{s.today}</span>
                </div>
                {s.hasBlocker && (
                  <div style={{ color: "#f87171", marginTop: 4 }}>
                    <span style={{ fontWeight: 700 }}>⚠️ Blocker: </span>
                    <span>{s.blockers || "Impediment reported"}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
