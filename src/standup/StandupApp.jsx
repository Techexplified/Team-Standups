import React, { useState, useEffect, useMemo } from "react";
import { isAuthorized } from "../lib/auth.js";
import { getCurrentMember } from "../lib/trelloApi.js";
import {
  StandupLogoIcon,
  CheckIcon,
  CheckCircleIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  CloseIcon,
  BellIcon,
  AlertTriangleIcon,
  TrelloCardIcon,
  FlameIcon,
  ClockIcon,
  TrashIcon,
} from "../lib/icons.jsx";
import "./standup.css";

// Initial mock sprint team data representing Version 2 state
const INITIAL_TEAM_MEMBERS = [
  {
    id: "m0",
    name: "Alex Rivera",
    role: "Lead Frontend Engineer",
    avatar: "AR",
    avatarBg: "linear-gradient(135deg, #2563eb, #38bdf8)",
    timestamp: "Pending",
    status: "unsubmitted",
    yesterdayItems: [
      "Completed token renewal service",
      "Reviewed Maya's UI specifications",
    ],
    todayTasks: [
      { id: "t0_1", tag: "[UI-401]", text: "Implementing Doing/Done card linking feature", status: "In Progress" },
      { id: "t0_2", tag: "[TEST-12]", text: "Writing Postgres index tests", status: "In Progress" },
    ],
    hasBlocker: false,
    blockerText: "",
  },
  {
    id: "m1",
    name: "Ava Sharma",
    role: "Lead Architect",
    avatar: "AS",
    avatarBg: "linear-gradient(135deg, #6366f1, #38bdf8)",
    timestamp: "9:20 AM",
    status: "submitted",
    yesterdayItems: [
      "Completed database indexing for standup history tables",
      "Code review for OAuth 2.0 handshake PR #104",
    ],
    todayTasks: [
      { id: "t1", tag: "[AUTH-402]", text: "OAuth refresh token flow", status: "In Progress" },
      { id: "t2", tag: "[API-88]", text: "Webhook sync event handlers", status: "In Progress" },
      { id: "t3", tag: "[PERF-12]", text: "Audit query response latencies", status: "To Do" },
    ],
    hasBlocker: false,
    blockerText: "",
  },
  {
    id: "m2",
    name: "Marcus Ray",
    role: "Senior Dev",
    avatar: "MR",
    avatarBg: "linear-gradient(135deg, #f43f5e, #fb923c)",
    timestamp: "9:42 AM",
    status: "submitted",
    yesterdayItems: [
      "Deployed staging candidate v1.4.0",
      "Fixed CORS preflight headers on Trello webhook listener",
    ],
    todayTasks: [
      { id: "t4", tag: "[DB-201]", text: "Migrate Postgres schemas to v2", status: "In Progress" },
      { id: "t5", tag: "[AUTH-402]", text: "Staging database integration test", status: "Blocked" },
    ],
    hasBlocker: true,
    blockerText: "Waiting on staging database credentials from DevOps team (ticket #DEVOPS-992).",
  },
  {
    id: "m3",
    name: "Liam Vance",
    role: "QA Engineer",
    avatar: "LV",
    avatarBg: "linear-gradient(135deg, #10b981, #06b6d4)",
    timestamp: "Pending",
    status: "unsubmitted",
    yesterdayItems: [],
    todayTasks: [],
    hasBlocker: false,
    blockerText: "",
  },
  {
    id: "m4",
    name: "Elena Rostova",
    role: "Frontend Dev",
    avatar: "ER",
    avatarBg: "linear-gradient(135deg, #a855f7, #ec4899)",
    timestamp: "9:15 AM",
    status: "submitted",
    yesterdayItems: [
      "Designed participation gauge ring SVG component",
      "Implemented dark mode variables matching Linear design",
    ],
    todayTasks: [
      { id: "t6", tag: "[UI-310]", text: "Build modal dialog for Log Standup", status: "Done" },
      { id: "t7", tag: "[UI-314]", text: "Filter chips and teammate selector", status: "In Progress" },
    ],
    hasBlocker: false,
    blockerText: "",
  },
  {
    id: "m5",
    name: "Devon Chen",
    role: "Fullstack Eng",
    avatar: "DC",
    avatarBg: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    timestamp: "8:55 AM",
    status: "submitted",
    yesterdayItems: [
      "Connected Trello Power-Up REST endpoints with member token",
      "Resolved 401 unauthorized automatic token cleanup",
    ],
    todayTasks: [
      { id: "t8", tag: "[SYNC-105]", text: "Board card badge sync cron", status: "In Progress" },
      { id: "t9", tag: "[CARD-42]", text: "Card back section embedding", status: "In Progress" },
    ],
    hasBlocker: false,
    blockerText: "",
  },
  {
    id: "m6",
    name: "Sofia Morales",
    role: "Product Manager",
    avatar: "SM",
    avatarBg: "linear-gradient(135deg, #eab308, #f97316)",
    timestamp: "9:05 AM",
    status: "submitted",
    yesterdayItems: [
      "Drafted Sprint 14 sprint goals & scope document",
      "Triage reported blockers and dependencies with leads",
    ],
    todayTasks: [
      { id: "t10", tag: "[PRD-18]", text: "Finalize Daily Standup Power-Up checklist", status: "In Progress" },
      { id: "t11", tag: "[USER-8]", text: "Stakeholder demo session prep", status: "To Do" },
    ],
    hasBlocker: false,
    blockerText: "",
  },
  {
    id: "m7",
    name: "Karan Patel",
    role: "Backend Dev",
    avatar: "KP",
    avatarBg: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
    timestamp: "9:35 AM",
    status: "submitted",
    yesterdayItems: [
      "Integrated rate limiters for Trello API calls",
      "Unit tests for token encryption helpers",
    ],
    todayTasks: [
      { id: "t12", tag: "[SEC-77]", text: "CSP headers validation on Vercel deployment", status: "In Progress" },
    ],
    hasBlocker: true,
    blockerText: "Requires TLS certificate renewal on custom subdomain proxy.",
  },
  {
    id: "m8",
    name: "Zoe Taylor",
    role: "UI/UX Designer",
    avatar: "ZT",
    avatarBg: "linear-gradient(135deg, #14b8a6, #0284c7)",
    timestamp: "Pending",
    status: "unsubmitted",
    yesterdayItems: [],
    todayTasks: [],
    hasBlocker: false,
    blockerText: "",
  },
];

export default function StandupApp({ t }) {
  const [teamMembers, setTeamMembers] = useState(() => {
    try {
      const saved = localStorage.getItem("ds_team_standups_v2");
      return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
    } catch (e) {
      return INITIAL_TEAM_MEMBERS;
    }
  });

  // Current User profile
  const [currentUser, setCurrentUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  // Date Navigation State
  const [selectedDate, setSelectedDate] = useState("Monday, Oct 12, 2026");
  const [dateFilter, setDateFilter] = useState("today"); // "today" | "yesterday"

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeammate, setSelectedTeammate] = useState("all");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "submitted" | "unsubmitted" | "blockers"

  // Modal State for Log Daily Standup (Exact specification)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [formTeammate, setFormTeammate] = useState("Alex Rivera");
  const [formDate, setFormDate] = useState("2026-10-10");
  const [formYesterday, setFormYesterday] = useState("");
  const [formDoingToday, setFormDoingToday] = useState("");
  const [formBlockers, setFormBlockers] = useState("");
  const [formLinkedCards, setFormLinkedCards] = useState([]);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [newCardTag, setNewCardTag] = useState("[TASK-105]");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardStatus, setNewCardStatus] = useState("In Progress");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState("");

  // View mode check (e.g., card-back-section)
  const [isCardBackView, setIsCardBackView] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "card-back-section") {
      setIsCardBackView(true);
    }

    async function loadAuth() {
      try {
        const authed = await isAuthorized(t);
        setAuthorized(authed);
        if (authed) {
          const profile = await getCurrentMember(t).catch(() => null);
          if (profile) setCurrentUser(profile);
        }
      } catch (e) {}
    }
    loadAuth();
  }, [t]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ds_team_standups_v2", JSON.stringify(teamMembers));
    } catch (e) {}
  }, [teamMembers]);

  // Compute KPI metrics dynamically
  const metrics = useMemo(() => {
    const totalMembers = teamMembers.length;
    const submittedList = teamMembers.filter((m) => m.status === "submitted");
    const submittedCount = submittedList.length;
    const unsubmittedCount = totalMembers - submittedCount;
    const blockersCount = teamMembers.filter((m) => m.hasBlocker).length;

    // Active doing cards count
    let activeDoingCardsCount = 0;
    let doneYesterdayCount = 0;

    teamMembers.forEach((m) => {
      if (Array.isArray(m.todayTasks)) {
        activeDoingCardsCount += m.todayTasks.filter((t) => t.status === "In Progress").length;
      }
      if (Array.isArray(m.yesterdayItems)) {
        doneYesterdayCount += m.yesterdayItems.length;
      }
    });

    const participationPct = totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0;

    return {
      totalMembers,
      submittedCount,
      unsubmittedCount,
      blockersCount,
      activeDoingCardsCount,
      doneYesterdayCount,
      participationPct,
    };
  }, [teamMembers]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((member) => {
      // 1. Tab filter
      if (activeTab === "submitted" && member.status !== "submitted") return false;
      if (activeTab === "unsubmitted" && member.status !== "unsubmitted") return false;
      if (activeTab === "blockers" && !member.hasBlocker) return false;

      // 2. Teammate dropdown
      if (selectedTeammate !== "all" && member.name !== selectedTeammate) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inName = member.name.toLowerCase().includes(query);
        const inRole = member.role.toLowerCase().includes(query);
        const inBlocker = member.blockerText.toLowerCase().includes(query);
        const inYesterday = member.yesterdayItems?.some((i) => i.toLowerCase().includes(query));
        const inTasks = member.todayTasks?.some((t) => (t.tag + " " + t.text).toLowerCase().includes(query));

        if (!inName && !inRole && !inBlocker && !inYesterday && !inTasks) {
          return false;
        }
      }

      return true;
    });
  }, [teamMembers, activeTab, selectedTeammate, searchQuery]);

  // Send Nudge notification
  function handleSendNudge(memberName) {
    showToast(`🔔 Reminder nudge sent to ${memberName}!`);
  }

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  }

  // Date controls
  function handleDateToggle(mode) {
    setDateFilter(mode);
    if (mode === "today") {
      setSelectedDate("Monday, Oct 12, 2026");
    } else {
      setSelectedDate("Sunday, Oct 11, 2026");
    }
  }

  // Open / Close modal
  function openLogModal() {
    setIsLogModalOpen(true);
  }

  function closeLogModal() {
    setIsLogModalOpen(false);
  }

  // Linked Card Handlers for Modal
  function handleAddLinkedCard() {
    if (!newCardTitle.trim()) return;
    const newCard = {
      id: "c_" + Date.now(),
      tag: newCardTag.trim() || "[CARD]",
      title: newCardTitle.trim(),
      status: newCardStatus,
    };
    setFormLinkedCards([...formLinkedCards, newCard]);
    setNewCardTitle("");
    setShowCardPicker(false);
  }

  function handleToggleCardStatus(id) {
    setFormLinkedCards(
      formLinkedCards.map((c) => {
        if (c.id === id) {
          return { ...c, status: c.status === "Done" ? "In Progress" : "Done" };
        }
        return c;
      })
    );
  }

  function handleRemoveLinkedCard(id) {
    setFormLinkedCards(formLinkedCards.filter((c) => c.id !== id));
  }

  // Submit standup from modal
  function handleSaveStandup(e) {
    e.preventDefault();

    const targetName = formTeammate || "Alex Rivera";

    const newYesterdayList = formYesterday
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // Parse today tasks from textarea
    const doingLines = formDoingToday
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const textTasks = doingLines.map((line, idx) => ({
      id: "dt_" + Date.now() + "_" + idx,
      tag: "[DOING]",
      text: line,
      status: "In Progress",
    }));

    const linkedTasks = formLinkedCards.map((c) => ({
      id: c.id,
      tag: c.tag,
      text: c.title,
      status: c.status,
    }));

    const combinedTasks = [...linkedTasks, ...textTasks];

    const hasBlocker = Boolean(
      formBlockers.trim() &&
      formBlockers.trim().toLowerCase() !== "none" &&
      formBlockers.trim().toLowerCase() !== "'none'"
    );

    const updated = teamMembers.map((m) => {
      if (m.name === targetName || (targetName === "Alex Rivera" && m.id === "m0")) {
        return {
          ...m,
          status: "submitted",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          yesterdayItems: newYesterdayList.length > 0 ? newYesterdayList : (m.yesterdayItems.length > 0 ? m.yesterdayItems : ["Completed planned tasks"]),
          todayTasks: combinedTasks.length > 0 ? combinedTasks : m.todayTasks,
          hasBlocker: hasBlocker,
          blockerText: hasBlocker ? formBlockers.trim() : "",
        };
      }
      return m;
    });

    setTeamMembers(updated);
    closeLogModal();
    showToast(`✨ Standup published for ${targetName}!`);

    // If running in Trello, update card data
    if (t && typeof t.set === "function") {
      t.set("board", "shared", "dailyStandupsLastUpdate", Date.now()).catch(() => {});
    }
  }

  // Compact Card Back Section mode
  if (isCardBackView) {
    const userStandup = teamMembers[0];
    return (
      <div className="card-back-compact-container">
        <div className="card-back-widget">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StandupLogoIcon width={20} height={20} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Today's Standup Status</span>
            </div>
            <span className="status-pill submitted">
              <CheckIcon width={12} height={12} />
              Submitted
            </span>
          </div>

          <div style={{ fontSize: 12, color: "var(--ds-text-secondary)", lineHeight: 1.45 }}>
            <p style={{ margin: "0 0 6px 0" }}>
              <strong style={{ color: "var(--ds-text-primary)" }}>Doing Today: </strong>
              {userStandup.todayTasks.map((t) => `${t.tag} ${t.text}`).join(", ")}
            </p>
            {userStandup.hasBlocker ? (
              <p style={{ margin: 0, color: "var(--ds-crimson)" }}>⚠️ Blocker: {userStandup.blockerText}</p>
            ) : (
              <p style={{ margin: 0, color: "var(--ds-emerald)" }}>✓ No blockers reported</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Circular gauge circumference for radius 10
  const gaugeRadius = 10;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (metrics.participationPct / 100) * gaugeCircumference;

  return (
    <div className="standup-app-container">
      {/* ====================================================================
          TOP NAVBAR / HEADER
          ==================================================================== */}
      <header className="standup-navbar">
        <div className="navbar-left">
          <div className="brand-wrapper">
            <StandupLogoIcon width={22} height={22} />
            <h1 className="brand-title">Daily Standups</h1>
          </div>

          {/* Date Navigator */}
          <div className="date-navigator">
            <button
              type="button"
              className="nav-arrow-btn"
              title="Previous Day"
              onClick={() => handleDateToggle("yesterday")}
            >
              <ChevronLeftIcon width={12} height={12} />
            </button>
            <span className="current-date-text">{selectedDate}</span>
            <button
              type="button"
              className="nav-arrow-btn"
              title="Next Day"
              onClick={() => handleDateToggle("today")}
            >
              <ChevronRightIcon width={12} height={12} />
            </button>
          </div>

          {/* Quick Toggle Segment */}
          <div className="segment-pills">
            <button
              type="button"
              className={`segment-btn ${dateFilter === "today" ? "active" : ""}`}
              onClick={() => handleDateToggle("today")}
            >
              Today
            </button>
            <button
              type="button"
              className={`segment-btn ${dateFilter === "yesterday" ? "active" : ""}`}
              onClick={() => handleDateToggle("yesterday")}
            >
              Yesterday
            </button>
          </div>
        </div>

        <div className="navbar-right">
          {/* Circular Participation Ring */}
          <div className="participation-gauge">
            <div className="gauge-svg-box">
              <svg width="22" height="22" viewBox="0 0 28 28">
                <defs>
                  <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <circle
                  className="gauge-circle-bg"
                  cx="14"
                  cy="14"
                  r={gaugeRadius}
                  fill="none"
                  strokeWidth="2.5"
                />
                <circle
                  className="gauge-circle-progress"
                  cx="14"
                  cy="14"
                  r={gaugeRadius}
                  fill="none"
                  strokeWidth="2.5"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                  transform="rotate(-90 14 14)"
                />
              </svg>
            </div>
            <span className="gauge-text">
              {metrics.participationPct}%
              <span className="gauge-subtext">({metrics.submittedCount}/{metrics.totalMembers})</span>
            </span>
          </div>

          {/* Primary Action Button */}
          <button type="button" className="btn-log-standup" onClick={openLogModal}>
            <PlusIcon width={14} height={14} />
            <span>Log Standup</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          MAIN DASHBOARD BODY
          ==================================================================== */}
      <main className="standup-body">
        {/* KPI METRIC SUMMARY CARDS (BALANCED PROPORTIONS) */}
        <section className="kpi-metrics-row">
          {/* Card 1: Submitted */}
          <div className="kpi-card kpi-submitted">
            <div className="kpi-card-header">
              <div className="kpi-card-title-group">
                <div className="kpi-icon-pill">
                  <CheckCircleIcon width={13} height={13} />
                </div>
                <span>Submitted</span>
              </div>
              <span className="kpi-badge-trend">+15% streak</span>
            </div>
            <div className="kpi-card-value-line">
              <span className="kpi-number">{metrics.submittedCount}</span>
              <span className="kpi-total">/ {metrics.totalMembers} members</span>
            </div>
            <p className="kpi-subtitle">{metrics.unsubmittedCount} pending updates</p>
          </div>

          {/* Card 2: Active Doing Cards */}
          <div className="kpi-card kpi-doing">
            <div className="kpi-card-header">
              <div className="kpi-card-title-group">
                <div className="kpi-icon-pill">
                  <TrelloCardIcon width={13} height={13} />
                </div>
                <span>Active Doing</span>
              </div>
            </div>
            <div className="kpi-card-value-line">
              <span className="kpi-number">{metrics.activeDoingCardsCount}</span>
              <span className="kpi-total">tasks on board</span>
            </div>
            <p className="kpi-subtitle">Synced across sprint lists</p>
          </div>

          {/* Card 3: Done Yesterday */}
          <div className="kpi-card kpi-done">
            <div className="kpi-card-header">
              <div className="kpi-card-title-group">
                <div className="kpi-icon-pill">
                  <CheckIcon width={13} height={13} />
                </div>
                <span>Done Yesterday</span>
              </div>
            </div>
            <div className="kpi-card-value-line">
              <span className="kpi-number">{metrics.doneYesterdayCount}</span>
              <span className="kpi-total">completed items</span>
            </div>
            <p className="kpi-subtitle">Verified in sprint backlog</p>
          </div>

          {/* Card 4: Active Blockers */}
          <div className="kpi-card kpi-blockers">
            <div className="kpi-card-header">
              <div className="kpi-card-title-group">
                <div className="kpi-icon-pill">
                  <AlertTriangleIcon width={13} height={13} />
                </div>
                <span style={{ color: "#fca5a5" }}>Active Blockers</span>
              </div>
            </div>
            <div className="kpi-card-value-line">
              <span className="kpi-number">{metrics.blockersCount}</span>
              <span className="kpi-total" style={{ color: "#fca5a5" }}>critical</span>
            </div>
            <p className="kpi-subtitle" style={{ color: "#f87171" }}>Requires team attention</p>
          </div>
        </section>

        {/* ====================================================================
            SEARCH & FILTER TOOLBAR
            ==================================================================== */}
        <section className="standup-toolbar">
          <div className="toolbar-left">
            <div className="search-input-wrapper">
              <SearchIcon width={14} height={14} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search team members, tasks, or blockers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="teammate-select"
              value={selectedTeammate}
              onChange={(e) => setSelectedTeammate(e.target.value)}
            >
              <option value="all">All Teammates</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="toolbar-filter-chips">
            <button
              type="button"
              className={`filter-chip ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All ({metrics.totalMembers})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeTab === "submitted" ? "active" : ""}`}
              onClick={() => setActiveTab("submitted")}
            >
              Submitted ({metrics.submittedCount})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeTab === "unsubmitted" ? "active" : ""}`}
              onClick={() => setActiveTab("unsubmitted")}
            >
              Unsubmitted ({metrics.unsubmittedCount})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeTab === "blockers" ? "active" : ""}`}
              onClick={() => setActiveTab("blockers")}
            >
              Blockers ({metrics.blockersCount})
            </button>
          </div>
        </section>

        {/* ====================================================================
            TEAM MEMBER STANDUP CARDS GRID
            ==================================================================== */}
        <section className="team-standup-grid">
          {filteredMembers.length === 0 ? (
            <div className="empty-search-state">
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No standup updates match your filter</p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ds-text-muted)" }}>
                Try adjusting your search query or reset the filter tabs.
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isUnsubmitted = member.status === "unsubmitted";

              return (
                <div
                  key={member.id}
                  className={`standup-member-card ${isUnsubmitted ? "is-unsubmitted" : ""}`}
                >
                  {/* Card Header */}
                  <div className="card-member-header">
                    <div className="member-identity">
                      <div
                        className="member-avatar"
                        style={{ background: member.avatarBg }}
                      >
                        {member.avatar}
                      </div>
                      <div className="member-meta">
                        <h3 className="member-name">{member.name}</h3>
                        <p className="member-role-time">
                          <span>{member.role}</span>
                          {!isUnsubmitted && (
                            <>
                              <span>•</span>
                              <span>{member.timestamp}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {member.hasBlocker ? (
                      <span className="status-pill blocker">
                        <AlertTriangleIcon width={12} height={12} />
                        Blocker
                      </span>
                    ) : isUnsubmitted ? (
                      <span className="status-pill unsubmitted">Pending</span>
                    ) : (
                      <span className="status-pill submitted">
                        <CheckIcon width={12} height={12} />
                        Submitted
                      </span>
                    )}
                  </div>

                  {/* UN-SUBMITTED STATE */}
                  {isUnsubmitted ? (
                    <div className="unsubmitted-content-box">
                      <div className="unsubmitted-icon-bubble">
                        <ClockIcon width={20} height={20} />
                      </div>
                      <h4 className="unsubmitted-headline">Standup Pending</h4>
                      <p className="unsubmitted-helper">
                        No daily update submitted yet for today. Send a friendly reminder nudge.
                      </p>
                      <button
                        type="button"
                        className="btn-send-nudge"
                        onClick={() => handleSendNudge(member.name)}
                      >
                        <BellIcon width={13} height={13} />
                        <span>Send Reminder Nudge</span>
                      </button>
                    </div>
                  ) : (
                    /* SUBMITTED STATE */
                    <>
                      {/* Active Crimson Blocker Banner */}
                      {member.hasBlocker && (
                        <div className="blocker-alert-banner">
                          <AlertTriangleIcon width={15} height={15} />
                          <div className="blocker-alert-text">
                            <strong>Blocker: </strong>
                            {member.blockerText}
                          </div>
                        </div>
                      )}

                      {/* Yesterday's Accomplishments */}
                      <div className="card-section">
                        <p className="section-label">Yesterday</p>
                        <div className="task-checklist">
                          {member.yesterdayItems?.map((item, idx) => (
                            <div key={idx} className="checklist-item">
                              <CheckIcon width={14} height={14} className="checklist-icon" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Doing Today (Linked Trello Card Pills) */}
                      <div className="card-section">
                        <p className="section-label">Doing Today</p>
                        <div className="linked-cards-list">
                          {member.todayTasks?.map((task) => {
                            let badgeClass = "badge-in-progress";
                            if (task.status === "Done") badgeClass = "badge-done";
                            if (task.status === "To Do") badgeClass = "badge-todo";
                            if (task.status === "Blocked") badgeClass = "badge-blocked";

                            return (
                              <div key={task.id} className="trello-card-pill">
                                <div className="card-pill-left">
                                  <TrelloCardIcon width={13} height={13} style={{ color: "#38bdf8" }} />
                                  <span className="card-pill-tag">{task.tag}</span>
                                  <span className="card-pill-text">{task.text}</span>
                                </div>
                                <span className={`card-pill-badge ${badgeClass}`}>{task.status}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Blockers & Next Steps */}
                      {!member.hasBlocker && (
                        <div className="card-section" style={{ marginBottom: 0 }}>
                          <p className="section-label">Blockers</p>
                          <span className="blockers-none-tag">✓ None reported</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* ====================================================================
          MODAL: LOG DAILY STANDUP
          ==================================================================== */}
      {/* ====================================================================
          MODAL: LOG DAILY STANDUP (Screenshot Specification)
          ==================================================================== */}
      {isLogModalOpen && (
        <div className="modal-backdrop" onClick={closeLogModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-badge-su">SU</div>
                <div>
                  <h2 className="modal-title">Log Daily Standup</h2>
                  <p className="modal-subtitle">
                    Sync yesterday's work, today's focus, and linked cards
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={closeLogModal}
                aria-label="Close modal"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>

            <form onSubmit={handleSaveStandup}>
              <div className="modal-body">
                {/* Top Row: Teammate & Standup Date */}
                <div className="modal-top-row">
                  <div className="modal-field-col">
                    <label className="modal-field-label">Teammate</label>
                    <select
                      className="modal-select"
                      value={formTeammate}
                      onChange={(e) => setFormTeammate(e.target.value)}
                    >
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="modal-field-col">
                    <label className="modal-field-label">Standup Date</label>
                    <input
                      type="date"
                      className="modal-date-input"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* 1. WHAT DID YOU ACCOMPLISH YESTERDAY? */}
                <div className="modal-section-group">
                  <label className="modal-section-heading">
                    1. WHAT DID YOU ACCOMPLISH YESTERDAY?
                  </label>
                  <textarea
                    className="modal-textarea"
                    rows={3}
                    placeholder="e.g. Completed token renewal service, reviewed Maya's UI specifications, resolved staging bug..."
                    value={formYesterday}
                    onChange={(e) => setFormYesterday(e.target.value)}
                  />
                </div>

                {/* 2. WHAT ARE YOU DOING TODAY? */}
                <div className="modal-section-group">
                  <label className="modal-section-heading">
                    2. WHAT ARE YOU DOING TODAY?
                  </label>
                  <textarea
                    className="modal-textarea"
                    rows={3}
                    placeholder="e.g. Implementing Doing/Done card linking feature, writing Postgres index tests, pairing on release..."
                    value={formDoingToday}
                    onChange={(e) => setFormDoingToday(e.target.value)}
                  />
                </div>

                {/* 3. ANY BLOCKERS OR WHAT WILL YOU DO NEXT? */}
                <div className="modal-section-group">
                  <label className="modal-section-heading">
                    3. ANY BLOCKERS OR WHAT WILL YOU DO NEXT?
                  </label>
                  <textarea
                    className="modal-textarea"
                    rows={3}
                    placeholder="e.g. Waiting on PR review from Elena, need staging cluster credentials, or 'None'"
                    value={formBlockers}
                    onChange={(e) => setFormBlockers(e.target.value)}
                  />
                </div>

                {/* LINKED TRELLO CARDS (Check status as Doing or Done) */}
                <div className="modal-section-group">
                  <div className="linked-cards-header-line">
                    <div className="linked-cards-title-wrap">
                      <span className="modal-section-heading" style={{ marginBottom: 0 }}>
                        LINKED TRELLO CARDS
                      </span>
                      <span className="linked-cards-hint">
                        (Check status as Doing or Done)
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-link-card-action"
                      onClick={() => setShowCardPicker(!showCardPicker)}
                    >
                      <PlusIcon width={13} height={13} />
                      <span>Link Card</span>
                    </button>
                  </div>

                  {/* Optional Interactive Card Linker */}
                  {showCardPicker && (
                    <div className="link-card-picker-box">
                      <input
                        type="text"
                        className="card-picker-input"
                        placeholder="[TAG]"
                        value={newCardTag}
                        onChange={(e) => setNewCardTag(e.target.value)}
                      />
                      <input
                        type="text"
                        className="card-picker-input-title"
                        placeholder="Card title from board..."
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                      />
                      <select
                        className="card-picker-status"
                        value={newCardStatus}
                        onChange={(e) => setNewCardStatus(e.target.value)}
                      >
                        <option value="In Progress">Doing</option>
                        <option value="Done">Done</option>
                      </select>
                      <button
                        type="button"
                        className="btn-add-card-confirm"
                        onClick={handleAddLinkedCard}
                      >
                        Attach
                      </button>
                    </div>
                  )}

                  {/* Empty state or list */}
                  {formLinkedCards.length === 0 ? (
                    <p className="linked-cards-empty-helper">
                      No cards linked yet. Click "+ Link Card" to attach board cards with Doing or Done status.
                    </p>
                  ) : (
                    <div className="modal-linked-cards-list">
                      {formLinkedCards.map((card) => (
                        <div key={card.id} className="modal-linked-card-item">
                          <div className="card-item-info">
                            <TrelloCardIcon width={13} height={13} style={{ color: "#38bdf8" }} />
                            <span className="card-tag">{card.tag}</span>
                            <span className="card-title">{card.title}</span>
                          </div>
                          <div className="card-item-actions">
                            <button
                              type="button"
                              className={`card-status-pill ${
                                card.status === "Done" ? "status-done" : "status-doing"
                              }`}
                              onClick={() => handleToggleCardStatus(card.id)}
                              title="Click to toggle Doing/Done"
                            >
                              {card.status === "Done" ? "Done" : "Doing"}
                            </button>
                            <button
                              type="button"
                              className="btn-remove-linked-card"
                              onClick={() => handleRemoveLinkedCard(card.id)}
                              title="Remove card"
                            >
                              <CloseIcon width={13} height={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeLogModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save-publish">
                  Save & Publish Standup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="toast-notice">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
