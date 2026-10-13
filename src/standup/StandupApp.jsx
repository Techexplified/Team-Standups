import React, { useState, useEffect, useMemo } from "react";
import { isAuthorized } from "../lib/auth.js";
import { getCurrentMember, sendTrelloCardNudge } from "../lib/trelloApi.js";
import {
  fetchActualBoardData,
  loadBoardStandups,
  saveBoardStandups,
  getAvatarGradient,
  getInitials,
} from "../lib/boardService.js";
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
  ClockIcon,
  RefreshCwIcon,
  LayersIcon,
  EditIcon,
  MessageSquareIcon,
  SendIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  TrashIcon,
} from "../lib/icons.jsx";
import "./standup.css";

// Initial mock sprint team data representing baseline fallback
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
    assignedCards: [],
    comments: [],
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
    assignedCards: [],
    comments: [
      {
        id: "c1",
        authorName: "Sofia Morales",
        authorAvatar: "SM",
        authorAvatarBg: "linear-gradient(135deg, #eab308, #f97316)",
        text: "Great progress on database indexing! Let me know if you need review on PR #104.",
        timestamp: "Today, 10:15 AM",
        createdAt: 1728814500000,
      },
    ],
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
    assignedCards: [],
    comments: [
      {
        id: "c2",
        authorName: "Alex Rivera",
        authorAvatar: "AR",
        authorAvatarBg: "linear-gradient(135deg, #2563eb, #38bdf8)",
        text: "Pinging the DevOps lead right now to expedite staging credentials.",
        timestamp: "Today, 10:45 AM",
        createdAt: 1728816300000,
      },
    ],
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
    assignedCards: [],
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
    assignedCards: [],
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
    assignedCards: [],
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
    assignedCards: [],
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
    assignedCards: [],
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
    assignedCards: [],
  },
];

// Dynamic Date Utility Helpers
function formatDisplayDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export default function StandupApp({ t }) {
  // Live Board State from Trello
  const [boardData, setBoardData] = useState({
    board: { id: "default_board", name: "Engineering Sprint Board" },
    members: [],
    lists: [],
    cards: [],
    currentMember: null,
    isLiveBoard: false,
    lastSyncTime: null,
  });
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Dynamic Real Calendar Date State (Defaults to current local date)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const dateKey = useMemo(() => formatDateKey(currentDate), [currentDate]);
  const selectedDate = useMemo(() => formatDisplayDate(currentDate), [currentDate]);

  const isToday = useMemo(() => isSameDay(currentDate, new Date()), [currentDate]);
  const isYesterday = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(currentDate, yesterday);
  }, [currentDate]);

  // Team standups state (merged with board data)
  const [teamMembers, setTeamMembers] = useState(() => {
    try {
      const saved = localStorage.getItem("ds_team_standups_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((m) => {
            if (!m.comments) {
              const init = INITIAL_TEAM_MEMBERS.find((im) => im.id === m.id || im.name === m.name);
              return { ...m, comments: init?.comments || [] };
            }
            return m;
          });
        }
      }
      return INITIAL_TEAM_MEMBERS;
    } catch (e) {
      return INITIAL_TEAM_MEMBERS;
    }
  });

  // Active comment input text per member card: { [memberId]: "draft text" }
  const [commentInputs, setCommentInputs] = useState({});

  // Collapsible comments state: tracks which member cards have comments expanded
  const [expandedComments, setExpandedComments] = useState({});

  function toggleComments(memberId) {
    setExpandedComments((prev) => ({
      ...prev,
      [memberId]: !prev[memberId],
    }));
  }

  // Cooldown tracker for reminder nudges: { [memberId]: { timestamp, timeStr } }
  const [nudgedMembers, setNudgedMembers] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`ds_nudged_${dateKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`ds_nudged_${dateKey}`);
      setNudgedMembers(saved ? JSON.parse(saved) : {});
    } catch (e) {
      setNudgedMembers({});
    }
  }, [dateKey]);

  // Interactive Theme Mode: "dark" (Vibrant Dark) | "light" (Fresh Light)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("ds_color_theme") || "dark";
    } catch (e) {
      return "dark";
    }
  });

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("ds_color_theme", next);
    } catch (e) {}
  }

  // Current User profile & Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeammate, setSelectedTeammate] = useState("all");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "submitted" | "unsubmitted" | "blockers"

  // Modal State for Log Daily Standup
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [formTeammate, setFormTeammate] = useState("Alex Rivera");
  const [formDate, setFormDate] = useState(() => formatDateKey(new Date()));
  const [formYesterday, setFormYesterday] = useState("");
  const [formDoingToday, setFormDoingToday] = useState("");
  const [formBlockers, setFormBlockers] = useState("");
  const [formLinkedCards, setFormLinkedCards] = useState([]);

  // Board Card Picker State inside Modal
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [cardPickerTab, setCardPickerTab] = useState("assigned"); // "assigned" | "all" | "custom"
  const [cardPickerSearch, setCardPickerSearch] = useState("");
  const [newCardTag, setNewCardTag] = useState("[CARD]");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardStatus, setNewCardStatus] = useState("In Progress");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState("");

  // View mode check (e.g., card-back-section)
  const [isCardBackView, setIsCardBackView] = useState(false);
  const [cardBackCardId, setCardBackCardId] = useState(null);

  // Initialize and synchronize Board Data from Trello
  useEffect(() => {
    let mounted = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "card-back-section") {
      setIsCardBackView(true);
    }
    const cardIdParam = params.get("cardId");
    if (cardIdParam) {
      setCardBackCardId(cardIdParam);
    }

    async function loadData() {
      setIsLoadingBoard(true);
      try {
        // 1. Check authorization & get member profile
        const authed = await isAuthorized(t).catch(() => false);
        if (mounted) setAuthorized(authed);
        if (authed) {
          const profile = await getCurrentMember(t).catch(() => null);
          if (mounted && profile) setCurrentUser(profile);
        }

        // 2. Fetch live board information (board, cards, lists, members)
        const liveBoard = await fetchActualBoardData(t);
        if (!mounted) return;
        setBoardData(liveBoard);

        // 3. Load standups from board shared storage or localStorage
        const storedStandups = await loadBoardStandups(t);

        // 4. Merge board members with standup records
        if (Array.isArray(liveBoard.members) && liveBoard.members.length > 0) {
          const merged = liveBoard.members.map((bm) => {
            const existing = (storedStandups || teamMembers).find(
              (s) =>
                s.id === bm.id ||
                s.name.toLowerCase() === bm.name.toLowerCase() ||
                (bm.username && s.name.toLowerCase() === bm.username.toLowerCase())
            );

            if (existing) {
              return {
                ...existing,
                id: bm.id,
                name: bm.name,
                username: bm.username || existing.username || "",
                role: bm.username ? `@${bm.username}` : (existing.role || "Board Contributor"),
                avatar: bm.avatar || existing.avatar,
                avatarBg: bm.avatarBg || existing.avatarBg,
                assignedCards: bm.assignedCards || [],
                comments: existing.comments || [],
              };
            }

            // Fresh member from board without standup submitted yet
            const defaultDoing = (bm.assignedCards || [])
              .filter((c) => c.status === "In Progress")
              .map((c) => ({
                id: c.id,
                tag: c.tag || `[${c.listName}]`,
                text: c.name,
                status: "In Progress",
                fromBoard: true,
              }));

            return {
              id: bm.id,
              name: bm.name,
              username: bm.username || "",
              role: bm.role || (bm.username ? `@${bm.username}` : "Board Contributor"),
              avatar: bm.avatar,
              avatarBg: bm.avatarBg,
              timestamp: "Pending",
              status: "unsubmitted",
              yesterdayItems: [],
              todayTasks: defaultDoing,
              hasBlocker: false,
              blockerText: "",
              assignedCards: bm.assignedCards || [],
              comments: [],
            };
          });

          setTeamMembers(merged);
          // Set default form teammate to logged in member if matched
          if (liveBoard.currentMember && liveBoard.currentMember.fullName) {
            const match = merged.find((m) => m.name === liveBoard.currentMember.fullName);
            if (match) setFormTeammate(match.name);
          } else if (merged[0]) {
            setFormTeammate(merged[0].name);
          }
        } else if (storedStandups && storedStandups.length > 0) {
          setTeamMembers(storedStandups);
        }
      } catch (err) {
        console.warn("Error loading board data:", err);
      } finally {
        if (mounted) setIsLoadingBoard(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [t]);

  // Save changes to localStorage whenever teamMembers changes
  useEffect(() => {
    try {
      localStorage.setItem("ds_team_standups_v2", JSON.stringify(teamMembers));
    } catch (e) {}
  }, [teamMembers]);

  // Synchronize standup records dynamically whenever selected calendar date changes
  useEffect(() => {
    let mounted = true;
    async function switchDateData() {
      if (isLoadingBoard) return;
      try {
        const storedStandups = await loadBoardStandups(t, dateKey);
        if (!mounted) return;

        if (Array.isArray(boardData.members) && boardData.members.length > 0) {
          const merged = boardData.members.map((bm) => {
            const existing = storedStandups?.find(
              (s) =>
                s.id === bm.id ||
                s.name.toLowerCase() === bm.name.toLowerCase() ||
                (bm.username && s.name.toLowerCase() === bm.username.toLowerCase())
            );

            if (existing) {
              return {
                ...existing,
                id: bm.id,
                name: bm.name,
                username: bm.username || existing.username || "",
                role: bm.username ? `@${bm.username}` : (existing.role || "Board Contributor"),
                avatar: bm.avatar || existing.avatar,
                avatarBg: bm.avatarBg || existing.avatarBg,
                assignedCards: bm.assignedCards || [],
                comments: existing.comments || [],
              };
            }

            // Fresh member from board without standup submitted for this date
            const defaultDoing = isToday
              ? (bm.assignedCards || [])
                  .filter((c) => c.status === "In Progress")
                  .map((c) => ({
                    id: c.id,
                    tag: c.tag || `[${c.listName}]`,
                    text: c.name,
                    status: "In Progress",
                    fromBoard: true,
                  }))
              : [];

            return {
              id: bm.id,
              name: bm.name,
              username: bm.username || "",
              role: bm.role || (bm.username ? `@${bm.username}` : "Board Contributor"),
              avatar: bm.avatar,
              avatarBg: bm.avatarBg,
              timestamp: "Pending",
              status: "unsubmitted",
              yesterdayItems: [],
              todayTasks: defaultDoing,
              hasBlocker: false,
              blockerText: "",
              assignedCards: bm.assignedCards || [],
              comments: [],
            };
          });

          setTeamMembers(merged);
        } else if (storedStandups && storedStandups.length > 0) {
          setTeamMembers(storedStandups);
        }
      } catch (e) {
        console.warn("Failed to load standups for date", dateKey, e);
      }
    }

    switchDateData();

    return () => {
      mounted = false;
    };
  }, [dateKey, boardData.members, isLoadingBoard, isToday, t]);


  // Refresh Board Data handler
  async function handleRefreshBoard() {
    setIsSyncing(true);
    try {
      const liveBoard = await fetchActualBoardData(t);
      setBoardData(liveBoard);
      const storedStandups = await loadBoardStandups(t);

      if (Array.isArray(liveBoard.members) && liveBoard.members.length > 0) {
        const merged = liveBoard.members.map((bm) => {
          const existing = (storedStandups || teamMembers).find(
            (s) => s.id === bm.id || s.name.toLowerCase() === bm.name.toLowerCase()
          );

          if (existing) {
            return {
              ...existing,
              id: bm.id,
              name: bm.name,
              assignedCards: bm.assignedCards || [],
              comments: existing.comments || [],
            };
          }

          return {
            id: bm.id,
            name: bm.name,
            role: bm.role || "Board Contributor",
            avatar: bm.avatar,
            avatarBg: bm.avatarBg,
            timestamp: "Pending",
            status: "unsubmitted",
            yesterdayItems: [],
            todayTasks: [],
            hasBlocker: false,
            blockerText: "",
            assignedCards: bm.assignedCards || [],
            comments: [],
          };
        });

        setTeamMembers(merged);
      }

      showToast(`🔄 Synced with ${liveBoard.board.name} (${liveBoard.cards.length} cards, ${liveBoard.members.length} members)`);
    } catch (e) {
      showToast("⚠️ Failed to re-sync board data");
    } finally {
      setIsSyncing(false);
    }
  }

  // Compute KPI metrics dynamically
  const metrics = useMemo(() => {
    const totalMembers = teamMembers.length;
    const submittedList = teamMembers.filter((m) => m.status === "submitted");
    const submittedCount = submittedList.length;
    const unsubmittedCount = totalMembers - submittedCount;
    const blockersCount = teamMembers.filter((m) => m.hasBlocker).length;

    // Count accomplishments and active tasks reported in standups
    let activeDoingCardsCount = 0;
    let doneYesterdayCount = 0;

    teamMembers.forEach((m) => {
      if (m.status === "submitted") {
        if (Array.isArray(m.todayTasks)) {
          activeDoingCardsCount += m.todayTasks.filter((t) => t.status === "In Progress").length;
        }
        if (Array.isArray(m.yesterdayItems)) {
          doneYesterdayCount += m.yesterdayItems.length;
        }
      }
    });

    // If no standup updates logged yet, active doing can reflect board in-progress tasks
    if (activeDoingCardsCount === 0 && Array.isArray(boardData.cards)) {
      activeDoingCardsCount = boardData.cards.filter((c) => c.status === "In Progress").length;
    }

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
  }, [teamMembers, boardData.cards]);

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

  // Currently selected member object in modal
  const activeFormMember = useMemo(() => {
    return teamMembers.find((m) => m.name === formTeammate) || teamMembers[0] || null;
  }, [teamMembers, formTeammate]);

  // Board cards assigned to the selected teammate in modal
  const assignedCardsForTeammate = useMemo(() => {
    if (!activeFormMember) return [];
    return boardData.cards.filter((c) => c.idMembers.includes(activeFormMember.id));
  }, [boardData.cards, activeFormMember]);

  // Filtered cards for the board card picker
  const filteredPickerCards = useMemo(() => {
    let source = cardPickerTab === "assigned" ? assignedCardsForTeammate : boardData.cards;
    if (cardPickerSearch.trim()) {
      const q = cardPickerSearch.toLowerCase();
      source = source.filter((c) => c.name.toLowerCase().includes(q) || c.listName.toLowerCase().includes(q));
    }
    return source;
  }, [cardPickerTab, assignedCardsForTeammate, boardData.cards, cardPickerSearch]);

  // Send Nudge notification via Trello @mention & toast
  async function handleSendNudge(member) {
    if (!member) return;

    const senderName =
      currentUser?.fullName ||
      boardData.currentMember?.fullName ||
      formTeammate ||
      "A teammate";

    // Find best card to post the @mention comment on (assigned card first, then board card)
    const targetCard = member.assignedCards?.[0] || boardData.cards?.[0];
    const targetCardId = targetCard?.id || targetCard?.cardId;
    const username = member.username || member.name.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (t && targetCardId) {
      try {
        await sendTrelloCardNudge(t, targetCardId, username, senderName);
        showToast(`🔔 Reminder posted on card "${targetCard.name || targetCard.title}" mentioning @${username}!`);
      } catch (err) {
        console.warn("Could not post Trello @mention comment via API:", err);
        if (err?.message === "NOT_AUTHORIZED") {
          if (t && typeof t.popup === "function") {
            t.popup({
              title: "Authorize Daily Standups",
              url: "./auth.html",
              height: 340,
            });
          }
          showToast(`⚠️ Please authorize Power-Up to post native Trello @mentions`);
          return;
        } else {
          showToast(`🔔 Reminder sent to ${member.name}!`);
        }
      }
    } else {
      showToast(`🔔 Reminder sent to ${member.name}!`);
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const updatedNudges = {
      ...nudgedMembers,
      [member.id]: { timestamp: Date.now(), timeStr },
    };

    setNudgedMembers(updatedNudges);
    try {
      sessionStorage.setItem(`ds_nudged_${dateKey}`, JSON.stringify(updatedNudges));
    } catch (e) {}
  }

  function showToast(msg) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  }

  // Dynamic Date controls
  function handlePrevDay() {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  }

  function handleNextDay() {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  }

  function handleJumpToday() {
    setCurrentDate(new Date());
  }

  function handleJumpYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  }

  // Open / Close modal
  function openLogModal() {
    setFormDate(formatDateKey(currentDate));
    setIsLogModalOpen(true);
  }

  function closeLogModal() {
    setIsLogModalOpen(false);
    setShowCardPicker(false);
  }

  // Attach a card from the actual board
  function handleAttachBoardCard(card, status = "In Progress") {
    const isAlreadyAttached = formLinkedCards.some((c) => c.id === card.id);
    if (isAlreadyAttached) return;

    const newCard = {
      id: card.id,
      cardId: card.id,
      tag: card.tag || `[${card.listName || "CARD"}]`,
      title: card.name,
      status: status,
      fromBoard: true,
    };
    setFormLinkedCards([...formLinkedCards, newCard]);
  }

  // Quick import all Doing cards assigned to this member on the board
  function handleQuickImportDoingCards() {
    const doingCards = assignedCardsForTeammate.filter((c) => c.status === "In Progress" || c.status === "To Do");
    if (doingCards.length === 0) {
      showToast(`No active doing cards assigned to ${formTeammate} on the board`);
      return;
    }

    const currentIds = new Set(formLinkedCards.map((c) => c.id));
    const newItems = doingCards
      .filter((c) => !currentIds.has(c.id))
      .map((c) => ({
        id: c.id,
        cardId: c.id,
        tag: c.tag || `[${c.listName || "DOING"}]`,
        title: c.name,
        status: "In Progress",
        fromBoard: true,
      }));

    if (newItems.length === 0) {
      showToast("All assigned Doing cards are already linked!");
      return;
    }

    setFormLinkedCards([...formLinkedCards, ...newItems]);
    showToast(`⚡ Attached ${newItems.length} board cards from ${formTeammate}'s sprint!`);
  }

  // Add custom manual task
  function handleAddCustomTask() {
    if (!newCardTitle.trim()) return;
    const newCard = {
      id: "c_" + Date.now(),
      tag: newCardTag.trim() || "[TASK]",
      title: newCardTitle.trim(),
      status: newCardStatus,
      fromBoard: false,
    };
    setFormLinkedCards([...formLinkedCards, newCard]);
    setNewCardTitle("");
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

  // 1-Click Direct Toggle for Tasks on the Dashboard Card
  async function handleToggleTaskStatusDirect(memberId, taskId) {
    let nextStatus = "";
    let taskName = "";

    const updated = teamMembers.map((m) => {
      if (m.id === memberId) {
        const nextTasks = (m.todayTasks || []).map((t) => {
          if (t.id === taskId) {
            nextStatus = t.status === "Done" ? "In Progress" : "Done";
            taskName = t.text;
            return { ...t, status: nextStatus };
          }
          return t;
        });
        return { ...m, todayTasks: nextTasks };
      }
      return m;
    });

    setTeamMembers(updated);

    // Save update to Trello shared board storage & localStorage
    await saveBoardStandups(t, updated, {}, dateKey);

    if (nextStatus === "Done") {
      showToast(`✓ Marked "${taskName.slice(0, 24)}..." as Done!`);
    } else {
      showToast(`↺ Moved "${taskName.slice(0, 24)}..." back to In Progress`);
    }
  }

  // Add comment to a member's standup card
  async function handleAddComment(memberId) {
    const text = (commentInputs[memberId] || "").trim();
    if (!text) return;

    const authorName =
      currentUser?.fullName ||
      boardData.currentMember?.fullName ||
      (currentUser?.username ? `@${currentUser.username}` : null) ||
      formTeammate ||
      "Alex Rivera";

    const authorInitials = getInitials(authorName);
    const authorBg = getAvatarGradient(authorName);
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newComment = {
      id: "cmt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      authorName,
      authorAvatar: authorInitials,
      authorAvatarBg: authorBg,
      text,
      timestamp: `Today, ${timeStr}`,
      createdAt: Date.now(),
    };

    const updated = teamMembers.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          comments: [...(m.comments || []), newComment],
        };
      }
      return m;
    });

    setTeamMembers(updated);
    setCommentInputs((prev) => ({ ...prev, [memberId]: "" }));
    setExpandedComments((prev) => ({ ...prev, [memberId]: true }));
    await saveBoardStandups(t, updated, {}, dateKey);
    showToast("💬 Comment posted!");
  }

  // Delete a comment from a member's standup card
  async function handleDeleteComment(memberId, commentId) {
    const updated = teamMembers.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          comments: (m.comments || []).filter((c) => c.id !== commentId),
        };
      }
      return m;
    });

    setTeamMembers(updated);
    await saveBoardStandups(t, updated, {}, dateKey);
    showToast("🗑️ Comment removed");
  }

  // Open Edit Modal pre-populated with member's current standup
  function handleOpenEditModal(member) {
    setFormTeammate(member.name);
    setFormDate(dateKey);
    setFormYesterday((member.yesterdayItems || []).join("\n"));

    // Split tasks into attached board cards and custom text tasks
    const boardCardsAttached = [];
    const customLines = [];

    (member.todayTasks || []).forEach((task) => {
      if (task.fromBoard || task.cardId || (task.tag && task.tag !== "[DOING]")) {
        boardCardsAttached.push({
          id: task.id,
          cardId: task.cardId || task.id,
          tag: task.tag,
          title: task.text,
          status: task.status,
          fromBoard: Boolean(task.fromBoard),
        });
      } else {
        customLines.push(task.text);
      }
    });

    setFormLinkedCards(boardCardsAttached);
    setFormDoingToday(customLines.join("\n"));
    setFormBlockers(member.blockerText || "");
    setIsLogModalOpen(true);
  }

  // Submit standup from modal
  async function handleSaveStandup(e) {
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
      cardId: c.cardId || null,
      tag: c.tag,
      text: c.title,
      status: c.status,
      fromBoard: Boolean(c.fromBoard),
    }));

    const combinedTasks = [...linkedTasks, ...textTasks];

    const hasBlocker = Boolean(
      formBlockers.trim() &&
      formBlockers.trim().toLowerCase() !== "none" &&
      formBlockers.trim().toLowerCase() !== "'none'"
    );

    const isCompletelyEmpty =
      newYesterdayList.length === 0 &&
      combinedTasks.length === 0 &&
      !hasBlocker;

    const updated = teamMembers.map((m) => {
      if (m.name === targetName || m.id === activeFormMember?.id || (targetName === "Alex Rivera" && m.id === "m0")) {
        return {
          ...m,
          status: isCompletelyEmpty ? "unsubmitted" : "submitted",
          timestamp: isCompletelyEmpty ? "Pending" : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          yesterdayItems: newYesterdayList,
          todayTasks: combinedTasks,
          hasBlocker: hasBlocker,
          blockerText: hasBlocker ? formBlockers.trim() : "",
        };
      }
      return m;
    });

    setTeamMembers(updated);
    closeLogModal();

    // Persist standup to Trello board shared storage and sync card badges
    const linkedCardIds = formLinkedCards.map((c) => c.cardId || c.id);
    await saveBoardStandups(
      t,
      updated,
      {
        linkedCardIds: linkedCardIds,
        completed: !isCompletelyEmpty,
        hasBlocker: hasBlocker,
        blockerText: hasBlocker ? formBlockers.trim() : "",
      },
      formDate || dateKey
    );

    showToast(`✨ Standup updated & synced for ${targetName}!`);
  }

  // Compact Card Back Section mode
  if (isCardBackView) {
    // If opened on a specific card, find the card and its assignees
    const specificCard = cardBackCardId
      ? boardData.cards.find((c) => c.id === cardBackCardId)
      : null;

    const assignedMember = specificCard && specificCard.idMembers.length > 0
      ? teamMembers.find((m) => specificCard.idMembers.includes(m.id))
      : teamMembers[0];

    const targetStandup = assignedMember || teamMembers[0];

    return (
      <div className="card-back-compact-container">
        <div className="card-back-widget">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StandupLogoIcon width={20} height={20} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {specificCard ? specificCard.name : "Today's Standup Status"}
              </span>
            </div>
            <span className={`status-pill ${targetStandup.status === "submitted" ? "submitted" : "unsubmitted"}`}>
              {targetStandup.status === "submitted" ? (
                <>
                  <CheckIcon width={12} height={12} />
                  Submitted
                </>
              ) : (
                "Pending"
              )}
            </span>
          </div>

          <div style={{ fontSize: 12, color: "var(--ds-text-secondary)", lineHeight: 1.45 }}>
            <p style={{ margin: "0 0 6px 0" }}>
              <strong style={{ color: "var(--ds-text-primary)" }}>Assignee: </strong>
              {targetStandup.name} ({targetStandup.role})
            </p>
            <p style={{ margin: "0 0 6px 0" }}>
              <strong style={{ color: "var(--ds-text-primary)" }}>Doing Today: </strong>
              {targetStandup.todayTasks.length > 0
                ? targetStandup.todayTasks.map((t) => `${t.tag} ${t.text}`).join(", ")
                : "No active tasks logged"}
            </p>
            {targetStandup.hasBlocker ? (
              <p style={{ margin: 0, color: "var(--ds-crimson)" }}>⚠️ Blocker: {targetStandup.blockerText}</p>
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
    <div className={`standup-app-container theme-${theme}`}>
      {/* ====================================================================
          TOP NAVBAR / HEADER
          ==================================================================== */}
      <header className="standup-navbar">
        <div className="navbar-left">
          <div className="brand-wrapper">
            <StandupLogoIcon width={22} height={22} />
            <h1 className="brand-title">Daily Standups</h1>
          </div>

          {/* Actual Board Name & Sync Pill */}
          <div className="board-badge-wrap">
            <span className="live-indicator-dot" title="Live Board Connected"></span>
            <span className="board-name-tag">
              <LayersIcon width={13} height={13} style={{ color: "#38bdf8" }} />
              {boardData.board.name}
            </span>
            <span className="board-counts-pill">
              ({boardData.cards.length} cards, {metrics.totalMembers} members)
            </span>
            <button
              type="button"
              className={`btn-sync-board ${isSyncing ? "is-syncing" : ""}`}
              onClick={handleRefreshBoard}
              title="Re-sync cards and members from Trello board"
            >
              <RefreshCwIcon width={12} height={12} />
              <span>{isSyncing ? "Syncing…" : "Sync"}</span>
            </button>
          </div>

          {/* Date Navigator */}
          <div className="date-navigator">
            <button
              type="button"
              className="nav-arrow-btn"
              title="Previous Day"
              onClick={handlePrevDay}
            >
              <ChevronLeftIcon width={12} height={12} />
            </button>
            <span className="current-date-text">{selectedDate}</span>
            <button
              type="button"
              className="nav-arrow-btn"
              title="Next Day"
              onClick={handleNextDay}
            >
              <ChevronRightIcon width={12} height={12} />
            </button>
          </div>

          {/* Quick Toggle Segment */}
          <div className="segment-pills">
            <button
              type="button"
              className={`segment-btn ${isToday ? "active" : ""}`}
              onClick={handleJumpToday}
            >
              Today
            </button>
            <button
              type="button"
              className={`segment-btn ${isYesterday ? "active" : ""}`}
              onClick={handleJumpYesterday}
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

          {/* Interactive Color Mode Toggle */}
          <button
            type="button"
            className="btn-theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
          >
            {theme === "dark" ? (
              <>
                <SunIcon width={13} height={13} style={{ color: "#fbbf24" }} />
                <span>Light</span>
              </>
            ) : (
              <>
                <MoonIcon width={13} height={13} style={{ color: "#6366f1" }} />
                <span>Dark</span>
              </>
            )}
          </button>

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
        {/* KPI METRIC SUMMARY CARDS */}
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
              <span className="kpi-badge-trend">
                {metrics.participationPct === 100 && metrics.totalMembers > 0
                  ? "🎉 100% Sync"
                  : `${metrics.participationPct}% logged`}
              </span>
            </div>
            <div className="kpi-card-value-line">
              <span className="kpi-number">{metrics.submittedCount}</span>
              <span className="kpi-total">/ {metrics.totalMembers} members</span>
            </div>
            <p className="kpi-subtitle">
              {metrics.unsubmittedCount === 0 && metrics.totalMembers > 0
                ? "🎉 All teammates checked in"
                : `${metrics.unsubmittedCount} awaiting check-in`}
            </p>
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
          <div className={`kpi-card ${metrics.blockersCount > 0 ? "kpi-blockers has-blockers" : "kpi-blockers-clear"}`}>
            <div className="kpi-card-header">
              <div className="kpi-card-title-group">
                <div className="kpi-icon-pill">
                  {metrics.blockersCount > 0 ? (
                    <AlertTriangleIcon width={13} height={13} />
                  ) : (
                    <CheckIcon width={13} height={13} />
                  )}
                </div>
                <span style={{ color: metrics.blockersCount > 0 ? "#fca5a5" : "inherit" }}>Active Blockers</span>
              </div>
              {metrics.blockersCount === 0 && (
                <span className="kpi-badge-clear">All Clear</span>
              )}
            </div>
            <div className="kpi-card-value-line">
              <span className="kpi-number">{metrics.blockersCount}</span>
              <span className="kpi-total" style={{ color: metrics.blockersCount > 0 ? "#fca5a5" : "inherit" }}>
                {metrics.blockersCount > 0 ? "critical" : "reported"}
              </span>
            </div>
            <p className="kpi-subtitle" style={{ color: metrics.blockersCount > 0 ? "#f87171" : "inherit" }}>
              {metrics.blockersCount > 0 ? "Requires team attention" : "No active blockers reported"}
            </p>
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
                placeholder="Search team members, board cards, or blockers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="teammate-select"
              value={selectedTeammate}
              onChange={(e) => setSelectedTeammate(e.target.value)}
            >
              <option value="all">All Teammates ({teamMembers.length})</option>
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
              className={`filter-chip chip-all ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All ({metrics.totalMembers})
            </button>
            <button
              type="button"
              className={`filter-chip chip-submitted ${activeTab === "submitted" ? "active" : ""}`}
              onClick={() => setActiveTab("submitted")}
            >
              Submitted ({metrics.submittedCount})
            </button>
            <button
              type="button"
              className={`filter-chip chip-unsubmitted ${activeTab === "unsubmitted" ? "active" : ""}`}
              onClick={() => setActiveTab("unsubmitted")}
            >
              Awaiting ({metrics.unsubmittedCount})
            </button>
            <button
              type="button"
              className={`filter-chip chip-blockers ${activeTab === "blockers" ? "active" : ""}`}
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
              const assignedCardsCount = member.assignedCards?.length || 0;

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
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <h3 className="member-name">{member.name}</h3>
                          {assignedCardsCount > 0 && (
                            <span className="assigned-cards-count-tag" title={`${assignedCardsCount} cards assigned on this board`}>
                              <TrelloCardIcon width={10} height={10} />
                              {assignedCardsCount}
                            </span>
                          )}
                        </div>
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

                    {/* Status Pill & Quick Edit */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {!isUnsubmitted && (
                        <button
                          type="button"
                          className="btn-edit-standup"
                          onClick={() => handleOpenEditModal(member)}
                          title={`Edit standup update for ${member.name}`}
                        >
                          <EditIcon width={11} height={11} />
                          <span>Edit</span>
                        </button>
                      )}
                      {member.hasBlocker ? (
                        <span className="status-pill blocker">
                          <AlertTriangleIcon width={12} height={12} />
                          Blocker
                        </span>
                      ) : isUnsubmitted ? (
                        <span className="status-pill unsubmitted">Awaiting Update</span>
                      ) : (
                        <span className="status-pill submitted">
                          <CheckIcon width={12} height={12} />
                          Submitted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* UN-SUBMITTED STATE */}
                  {isUnsubmitted ? (
                    <div className="unsubmitted-content-box">
                      <div className="unsubmitted-header-row">
                        <div className="unsubmitted-icon-bubble">
                          <ClockIcon width={16} height={16} />
                        </div>
                        <div className="unsubmitted-header-text">
                          <h4 className="unsubmitted-headline">Awaiting Today's Check-in</h4>
                          <p className="unsubmitted-helper">
                            {assignedCardsCount > 0
                              ? `${member.name.split(" ")[0]} has ${assignedCardsCount} active board task${assignedCardsCount > 1 ? "s" : ""}:`
                              : `${member.name.split(" ")[0]} hasn't shared their daily update yet today.`}
                          </p>
                        </div>
                      </div>

                      {/* Display assigned board cards if any */}
                      {assignedCardsCount > 0 && (
                        <div className="unsubmitted-assigned-preview">
                          {member.assignedCards.slice(0, 3).map((c) => (
                            <div key={c.id} className="preview-card-pill">
                              <TrelloCardIcon width={12} height={12} style={{ color: "#38bdf8", flexShrink: 0 }} />
                              <span className="preview-card-tag">{c.tag || `[${c.listName || "DOING"}]`}</span>
                              <span className="preview-card-title">{c.name}</span>
                            </div>
                          ))}
                          {assignedCardsCount > 3 && (
                            <span className="preview-more-count">+{assignedCardsCount - 3} more assigned tasks</span>
                          )}
                        </div>
                      )}

                      <div className="unsubmitted-actions-row">
                        {(() => {
                          const isNudged = Boolean(nudgedMembers[member.id]);
                          const nudgeInfo = nudgedMembers[member.id];
                          return (
                            <button
                              type="button"
                              className={`btn-send-nudge ${isNudged ? "is-reminded" : ""}`}
                              onClick={() => handleSendNudge(member)}
                              title={
                                isNudged
                                  ? `Reminder sent at ${nudgeInfo?.timeStr || "earlier today"}. Click to resend.`
                                  : `Send Trello @mention reminder to ${member.name}`
                              }
                            >
                              {isNudged ? (
                                <>
                                  <span className="btn-nudge-reminded-label">
                                    <CheckIcon width={12} height={12} />
                                    <span>Reminded ✓</span>
                                  </span>
                                  <span className="btn-nudge-resend-label">
                                    <RefreshCwIcon width={12} height={12} />
                                    <span>Resend Reminder</span>
                                  </span>
                                </>
                              ) : (
                                <>
                                  <BellIcon width={12} height={12} />
                                  <span>Send Reminder</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
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
                      {Array.isArray(member.yesterdayItems) && member.yesterdayItems.length > 0 && (
                        <div className="card-section">
                          <p className="section-label">Yesterday</p>
                          <div className="task-checklist">
                            {member.yesterdayItems.map((item, idx) => (
                              <div key={idx} className="checklist-item">
                                <CheckIcon width={14} height={14} className="checklist-icon" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Doing Today (Interactive Linked Trello Card Pills) */}
                      {Array.isArray(member.todayTasks) && member.todayTasks.length > 0 && (
                        <div className="card-section">
                          <p className="section-label">Doing Today</p>
                          <div className="linked-cards-list">
                            {member.todayTasks.map((task) => {
                              let badgeClass = "badge-in-progress";
                              if (task.status === "Done") badgeClass = "badge-done";
                              if (task.status === "To Do") badgeClass = "badge-todo";
                              if (task.status === "Blocked") badgeClass = "badge-blocked";

                              const isDone = task.status === "Done";

                              return (
                                <div
                                  key={task.id}
                                  className={`trello-card-pill ${isDone ? "is-task-done" : ""}`}
                                >
                                  <div className="card-pill-left">
                                    {isDone ? (
                                      <CheckCircleIcon
                                        width={14}
                                        height={14}
                                        style={{ color: "#10b981", flexShrink: 0 }}
                                      />
                                    ) : (
                                      <TrelloCardIcon
                                        width={13}
                                        height={13}
                                        style={{ color: "#38bdf8", flexShrink: 0 }}
                                      />
                                    )}
                                    <span className="card-pill-tag">{task.tag}</span>
                                    <span className={`card-pill-text ${isDone ? "is-completed-text" : ""}`}>
                                      {task.text}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    className={`card-pill-badge ${badgeClass} interactive-toggle-badge`}
                                    onClick={() => handleToggleTaskStatusDirect(member.id, task.id)}
                                    title={`Click to mark as ${isDone ? "In Progress" : "Done"}`}
                                  >
                                    {isDone ? (
                                      <>
                                        <CheckIcon width={11} height={11} />
                                        <span>Done</span>
                                      </>
                                    ) : (
                                      <span>In Progress</span>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Blockers & Next Steps */}
                      {!member.hasBlocker && (
                        <div className="card-section" style={{ marginBottom: 0 }}>
                          <p className="section-label">Blockers</p>
                          <span className="blockers-none-tag">✓ None reported</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* COMMENTS SECTION (Collapsible by default to eliminate card clutter) */}
                  <div className="card-comments-section">
                    {!expandedComments[member.id] ? (
                      /* Collapsed Compact Trigger */
                      <div className="comments-collapsed-bar">
                        <button
                          type="button"
                          className={`comments-toggle-btn ${
                            (member.comments?.length || 0) > 0 ? "has-comments" : "is-empty"
                          }`}
                          onClick={() => toggleComments(member.id)}
                          title={
                            (member.comments?.length || 0) > 0
                              ? `View ${member.comments.length} comment${
                                  member.comments.length > 1 ? "s" : ""
                                }`
                              : "Add a comment"
                          }
                        >
                          <MessageSquareIcon width={13} height={13} />
                          <span>
                            {(member.comments?.length || 0) > 0
                              ? `${member.comments.length} Comment${
                                  member.comments.length > 1 ? "s" : ""
                                }`
                              : "Add comment"}
                          </span>
                          {(member.comments?.length || 0) > 0 ? (
                            <ChevronDownIcon width={12} height={12} className="toggle-chevron" />
                          ) : (
                            <span className="comments-plus-sign">+</span>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Expanded Comments View */
                      <div className="comments-expanded-view">
                        <div className="comments-header-row expanded">
                          <button
                            type="button"
                            className="comments-title-btn"
                            onClick={() => toggleComments(member.id)}
                            title="Collapse comments"
                          >
                            <MessageSquareIcon width={13} height={13} />
                            <span>Comments</span>
                            {(member.comments?.length || 0) > 0 && (
                              <span className="comments-count-pill">
                                {member.comments.length}
                              </span>
                            )}
                            <ChevronDownIcon
                              width={12}
                              height={12}
                              className="toggle-chevron is-open"
                            />
                          </button>
                          <button
                            type="button"
                            className="comments-collapse-btn"
                            onClick={() => toggleComments(member.id)}
                            title="Collapse comments"
                          >
                            Hide
                          </button>
                        </div>

                        {/* Display comments list */}
                        {Array.isArray(member.comments) && member.comments.length > 0 ? (
                          <div className="comments-list">
                            {member.comments.map((comment) => (
                              <div key={comment.id} className="comment-item-box">
                                <div
                                  className="comment-avatar"
                                  style={{
                                    background: comment.authorAvatarBg || "var(--ds-primary)",
                                  }}
                                >
                                  {comment.authorAvatar || "TM"}
                                </div>
                                <div className="comment-content">
                                  <div className="comment-meta-line">
                                    <span className="comment-author-name">
                                      {comment.authorName}
                                    </span>
                                    <div className="comment-meta-actions">
                                      <span className="comment-timestamp">
                                        {comment.timestamp}
                                      </span>
                                      <button
                                        type="button"
                                        className="btn-delete-comment"
                                        onClick={() =>
                                          handleDeleteComment(member.id, comment.id)
                                        }
                                        title="Delete comment"
                                        aria-label="Delete comment"
                                      >
                                        <TrashIcon width={11} height={11} />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="comment-text">{comment.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="comments-empty-hint">
                            No comments yet. Leave a question or note for{" "}
                            {member.name.split(" ")[0]}!
                          </p>
                        )}

                        {/* Comment input field & add comment interaction */}
                        <div className="comment-input-row">
                          <input
                            type="text"
                            className="comment-input-field"
                            placeholder="Write a comment or question..."
                            value={commentInputs[member.id] || ""}
                            autoFocus
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [member.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(member.id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn-post-comment"
                            disabled={!(commentInputs[member.id] || "").trim()}
                            onClick={() => handleAddComment(member.id)}
                            title="Post comment"
                          >
                            <SendIcon width={12} height={12} />
                            <span>Post</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* ====================================================================
          MODAL: LOG DAILY STANDUP WITH ACTUAL BOARD CARD INTEGRATION
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
                    Sync yesterday's work, today's focus, and cards from {boardData.board.name}
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

            <form className="modal-form" onSubmit={handleSaveStandup}>
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
                    rows={4}
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
                    rows={4}
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

                {/* LINKED TRELLO CARDS WITH LIVE BOARD INTEGRATION */}
                <div className="modal-section-group">
                  <div className="linked-cards-header-line">
                    <div className="linked-cards-title-wrap">
                      <span className="modal-section-heading" style={{ marginBottom: 0 }}>
                        LINKED TRELLO CARDS
                      </span>
                      <span className="linked-cards-hint">
                        (Select from board cards or link Doing/Done)
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn-link-card-action"
                        onClick={() => setShowCardPicker(!showCardPicker)}
                      >
                        <PlusIcon width={13} height={13} />
                        <span>{showCardPicker ? "Hide Card Picker" : "Attach from Board"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Board Card Picker */}
                  {showCardPicker && (
                    <div className="board-card-picker-wrap">
                      <div className="picker-tabs-row">
                        <div className="picker-tabs-group">
                          <button
                            type="button"
                            className={`picker-tab-btn ${cardPickerTab === "assigned" ? "active" : ""}`}
                            onClick={() => setCardPickerTab("assigned")}
                          >
                            Assigned to {formTeammate.split(" ")[0]} ({assignedCardsForTeammate.length})
                          </button>
                          <button
                            type="button"
                            className={`picker-tab-btn ${cardPickerTab === "all" ? "active" : ""}`}
                            onClick={() => setCardPickerTab("all")}
                          >
                            All Board Cards ({boardData.cards.length})
                          </button>
                          <button
                            type="button"
                            className={`picker-tab-btn ${cardPickerTab === "custom" ? "active" : ""}`}
                            onClick={() => setCardPickerTab("custom")}
                          >
                            Custom Task
                          </button>
                        </div>

                        {cardPickerTab === "assigned" && assignedCardsForTeammate.length > 0 && (
                          <button
                            type="button"
                            className="btn-quick-import"
                            onClick={handleQuickImportDoingCards}
                          >
                            ⚡ Auto-import assigned Doing cards
                          </button>
                        )}
                      </div>

                      {cardPickerTab !== "custom" ? (
                        <>
                          <input
                            type="text"
                            className="picker-search-input"
                            placeholder="Search board cards by title or list..."
                            value={cardPickerSearch}
                            onChange={(e) => setCardPickerSearch(e.target.value)}
                          />

                          <div className="board-cards-scroll-box">
                            {filteredPickerCards.length === 0 ? (
                              <p style={{ margin: "10px 0", fontSize: 12, color: "var(--ds-text-muted)", textAlign: "center" }}>
                                No cards found matching this filter.
                              </p>
                            ) : (
                              filteredPickerCards.map((card) => {
                                const isAttached = formLinkedCards.some((c) => c.id === card.id);
                                let statusPillClass = "to-do";
                                if (card.status === "In Progress") statusPillClass = "in-progress";
                                if (card.status === "Done") statusPillClass = "done";
                                if (card.status === "Blocked") statusPillClass = "blocked";

                                return (
                                  <div key={card.id} className="board-card-item-row">
                                    <div className="board-card-info-left">
                                      <TrelloCardIcon width={13} height={13} style={{ color: "#38bdf8", flexShrink: 0 }} />
                                      <span className={`board-list-pill ${statusPillClass}`}>
                                        {card.listName}
                                      </span>
                                      <span className="board-card-title-text" title={card.name}>
                                        {card.name}
                                      </span>
                                    </div>

                                    {isAttached ? (
                                      <span className="btn-attach-card-action already-attached">
                                        ✓ Linked
                                      </span>
                                    ) : (
                                      <div style={{ display: "flex", gap: 5 }}>
                                        <button
                                          type="button"
                                          className="btn-attach-card-action"
                                          onClick={() => handleAttachBoardCard(card, "In Progress")}
                                        >
                                          + Doing
                                        </button>
                                        <button
                                          type="button"
                                          className="btn-attach-card-action"
                                          style={{ background: "#059669" }}
                                          onClick={() => handleAttachBoardCard(card, "Done")}
                                        >
                                          + Done
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="link-card-picker-box" style={{ margin: 0 }}>
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
                            placeholder="Task description or card title..."
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
                            onClick={handleAddCustomTask}
                          >
                            Attach
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attached Cards List */}
                  {formLinkedCards.length === 0 ? (
                    <p className="linked-cards-empty-helper">
                      No cards linked yet. Click "+ Attach from Board" to attach board cards with Doing or Done status.
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
