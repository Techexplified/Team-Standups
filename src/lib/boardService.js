// Service for retrieving and synchronizing live board data from Trello
// Supports both native Trello Power-Up client (t.board, t.cards, t.lists)
// and REST API fallback, with board shared storage persistence.

import { isAuthorized } from "./auth.js";
import { getBoardCards, getBoardLists, getBoardMembers, getCurrentMember } from "./trelloApi.js";

// Vibrant gradient palette for member avatars
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #2563eb, #38bdf8)", // Blue / Sky
  "linear-gradient(135deg, #6366f1, #38bdf8)", // Indigo / Sky
  "linear-gradient(135deg, #f43f5e, #fb923c)", // Rose / Orange
  "linear-gradient(135deg, #10b981, #06b6d4)", // Emerald / Cyan
  "linear-gradient(135deg, #a855f7, #ec4899)", // Purple / Pink
  "linear-gradient(135deg, #3b82f6, #1d4ed8)", // Royal Blue
  "linear-gradient(135deg, #eab308, #f97316)", // Amber / Orange
  "linear-gradient(135deg, #8b5cf6, #3b82f6)", // Violet / Blue
  "linear-gradient(135deg, #14b8a6, #0284c7)", // Teal / Sky
  "linear-gradient(135deg, #ec4899, #f43f5e)", // Pink / Rose
  "linear-gradient(135deg, #06b6d4, #3b82f6)", // Cyan / Blue
  "linear-gradient(135deg, #10b981, #84cc16)", // Emerald / Lime
];

/**
 * Returns a consistent avatar gradient for a given member string identifier.
 */
export function getAvatarGradient(idOrName = "") {
  let hash = 0;
  for (let i = 0; i < idOrName.length; i++) {
    hash = (hash << 5) - hash + idOrName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

/**
 * Derives initials from a full name or username.
 */
export function getInitials(fullName = "", username = "") {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (username && username.trim()) {
    return username.trim().slice(0, 2).toUpperCase();
  }
  return "TM";
}

/**
 * Classifies a Trello list into standard sprint status:
 * "In Progress" | "Done" | "Blocked" | "To Do"
 */
export function classifyListStatus(listName = "") {
  const normalized = listName.toLowerCase().trim();
  if (/done|complete|shipped|finished|closed|released/i.test(normalized)) {
    return "Done";
  }
  if (/block|impediment|stuck|waiting|hold/i.test(normalized)) {
    return "Blocked";
  }
  if (/doing|in progress|active|wip|working|current sprint|review/i.test(normalized)) {
    return "In Progress";
  }
  return "To Do";
}

/**
 * Loads actual board data (board info, lists, cards, members) from Trello.
 *
 * @param {object} t - Trello Power-Up client
 * @returns {Promise<{
 *   board: { id: string, name: string },
 *   members: Array<object>,
 *   lists: Array<object>,
 *   cards: Array<object>,
 *   currentMember: object|null,
 *   isLiveBoard: boolean,
 *   lastSyncTime: Date
 * }>}
 */
export async function fetchActualBoardData(t) {
  let boardInfo = { id: "default_board", name: "Engineering Sprint Board" };
  let rawMembers = [];
  let rawLists = [];
  let rawCards = [];
  let currentMember = null;
  let isLiveBoard = false;

  // 1. Fetch Board Info and Members via Power-Up client
  if (t && typeof t.board === "function") {
    try {
      const b = await t.board("id", "name", "members", "url").catch(() => null);
      if (b && (b.name || b.id)) {
        boardInfo = {
          id: b.id || "default_board",
          name: b.name || "Engineering Sprint Board",
          url: b.url || "",
        };
        if (Array.isArray(b.members) && b.members.length > 0) {
          rawMembers = b.members;
          isLiveBoard = true;
        }
      }
    } catch (e) {
      console.warn("Could not retrieve board via t.board", e);
    }
  }

  // 2. Fetch Lists via Power-Up client
  if (t && typeof t.lists === "function") {
    try {
      const l = await t.lists("all").catch(() => null);
      if (Array.isArray(l) && l.length > 0) {
        rawLists = l;
        isLiveBoard = true;
      }
    } catch (e) {
      console.warn("Could not retrieve lists via t.lists", e);
    }
  }

  // 3. Fetch Cards via Power-Up client
  if (t && typeof t.cards === "function") {
    try {
      const c = await t.cards("id", "name", "desc", "idList", "idMembers", "due", "dueComplete", "labels", "url").catch(() => null);
      if (Array.isArray(c) && c.length > 0) {
        rawCards = c;
        isLiveBoard = true;
      }
    } catch (e) {
      console.warn("Could not retrieve cards via t.cards", e);
    }
  }

  // 4. Fetch Current Member via Power-Up client
  if (t && typeof t.member === "function") {
    try {
      const m = await t.member("id", "fullName", "username", "avatar", "initials").catch(() => null);
      if (m && m.id) {
        currentMember = m;
      }
    } catch (e) {}
  }

  // 5. REST API fallback if authorized and board has ID
  try {
    const authed = await isAuthorized(t).catch(() => false);
    if (authed) {
      if (!currentMember) {
        currentMember = await getCurrentMember(t).catch(() => null);
      }
      if (boardInfo.id && boardInfo.id !== "default_board") {
        if (rawMembers.length === 0) {
          const apiMembers = await getBoardMembers(t, boardInfo.id).catch(() => null);
          if (Array.isArray(apiMembers) && apiMembers.length > 0) {
            rawMembers = apiMembers;
            isLiveBoard = true;
          }
        }
        if (rawLists.length === 0) {
          const apiLists = await getBoardLists(t, boardInfo.id).catch(() => null);
          if (Array.isArray(apiLists) && apiLists.length > 0) {
            rawLists = apiLists;
            isLiveBoard = true;
          }
        }
        if (rawCards.length === 0) {
          const apiCards = await getBoardCards(t, boardInfo.id).catch(() => null);
          if (Array.isArray(apiCards) && apiCards.length > 0) {
            rawCards = apiCards;
            isLiveBoard = true;
          }
        }
      }
    }
  } catch (e) {
    console.warn("REST API fallback encounter error", e);
  }

  // Build list lookup map
  const listsMap = {};
  rawLists.forEach((l) => {
    listsMap[l.id] = {
      id: l.id,
      name: l.name,
      status: classifyListStatus(l.name),
    };
  });

  // Process cards with assigned list information & tags
  const processedCards = rawCards.map((card, idx) => {
    const listInfo = listsMap[card.idList] || { name: "Sprint", status: "In Progress" };
    const cardStatus = card.dueComplete ? "Done" : listInfo.status;
    const tag = `[CARD-${(idx + 1).toString().padStart(2, "0")}]`;

    return {
      id: card.id,
      name: card.name,
      desc: card.desc || "",
      idList: card.idList,
      listName: listInfo.name,
      status: cardStatus,
      tag: tag,
      idMembers: Array.isArray(card.idMembers) ? card.idMembers : [],
      due: card.due || null,
      dueComplete: Boolean(card.dueComplete),
      url: card.url || null,
    };
  });

  // Process members with avatars and assigned cards
  const processedMembers = rawMembers.map((m, idx) => {
    const memberName = m.fullName || m.username || `Member ${idx + 1}`;
    const initials = m.initials || getInitials(memberName, m.username);
    const assignedCards = processedCards.filter((c) => c.idMembers.includes(m.id));

    return {
      id: m.id || `m_${idx}`,
      name: memberName,
      username: m.username || "",
      avatar: initials,
      avatarUrl: m.avatar || m.avatarUrl || null,
      avatarBg: getAvatarGradient(m.id || memberName),
      role: m.username ? `@${m.username}` : "Board Contributor",
      assignedCards: assignedCards,
    };
  });

  return {
    board: boardInfo,
    members: processedMembers,
    lists: rawLists,
    cards: processedCards,
    currentMember: currentMember,
    isLiveBoard: isLiveBoard,
    lastSyncTime: new Date(),
  };
}

/**
 * Loads shared board standups from Trello shared storage and local storage.
 * Supports date-specific storage (e.g., dateKey: "2026-10-13").
 *
 * @param {object} t - Trello Power-Up client
 * @param {string} dateKey - Optional date key (YYYY-MM-DD)
 * @returns {Promise<Array<object>|null>}
 */
export async function loadBoardStandups(t, dateKey = null) {
  const storageKey = dateKey ? `daily_standups_${dateKey}` : "daily_standups_v2";
  const localKey = dateKey ? `ds_team_standups_${dateKey}` : "ds_team_standups_v2";

  // 1. Try Trello shared board storage for the specific date
  if (t && typeof t.get === "function") {
    try {
      const stored = await t.get("board", "shared", storageKey).catch(() => null);
      if (stored) {
        return typeof stored === "string" ? JSON.parse(stored) : stored;
      }
      // If dateKey was requested but empty, check if today matches latest
      if (dateKey) {
        const latest = await t.get("board", "shared", "daily_standups_v2").catch(() => null);
        if (latest) {
          const parsed = typeof latest === "string" ? JSON.parse(latest) : latest;
          if (Array.isArray(parsed) && parsed.some((m) => m.dateKey === dateKey)) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load standups from Trello board storage", e);
    }
  }

  // 2. Fallback to localStorage
  try {
    const local = localStorage.getItem(localKey);
    if (local) {
      return JSON.parse(local);
    }
    if (dateKey) {
      const fallbackLocal = localStorage.getItem("ds_team_standups_v2");
      if (fallbackLocal) {
        const parsed = JSON.parse(fallbackLocal);
        if (Array.isArray(parsed) && parsed.some((m) => m.dateKey === dateKey)) {
          return parsed;
        }
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Saves standup data to Trello shared board storage and local storage.
 *
 * @param {object} t - Trello Power-Up client
 * @param {Array<object>} standupData - Team members standup state
 * @param {object} opts - Optional linked card sync options
 * @param {string} dateKey - Optional date key (YYYY-MM-DD)
 */
export async function saveBoardStandups(t, standupData, opts = {}, dateKey = null) {
  const storageKey = dateKey ? `daily_standups_${dateKey}` : "daily_standups_v2";
  const localKey = dateKey ? `ds_team_standups_${dateKey}` : "ds_team_standups_v2";

  // Attach dateKey metadata to records
  const enrichedData = standupData.map((m) => ({
    ...m,
    dateKey: dateKey || m.dateKey || new Date().toISOString().split("T")[0],
  }));

  // 1. Persist to localStorage
  try {
    localStorage.setItem(localKey, JSON.stringify(enrichedData));
    localStorage.setItem("ds_team_standups_v2", JSON.stringify(enrichedData));
  } catch (e) {}

  // 2. Persist to Trello Board Shared storage
  if (t && typeof t.set === "function") {
    try {
      await t.set("board", "shared", storageKey, JSON.stringify(enrichedData)).catch(() => {});
      await t.set("board", "shared", "daily_standups_v2", JSON.stringify(enrichedData)).catch(() => {});
      await t.set("board", "shared", "dailyStandupsLastUpdate", Date.now()).catch(() => {});
    } catch (e) {
      console.warn("Failed to persist standups to Trello board storage", e);
    }

    // 3. Update card-level badges for linked cards if provided
    if (opts.linkedCardIds && Array.isArray(opts.linkedCardIds)) {
      for (const cardId of opts.linkedCardIds) {
        try {
          await t.set(cardId, "shared", "standupData", {
            completed: Boolean(opts.completed),
            hasBlocker: Boolean(opts.hasBlocker),
            blockerText: opts.blockerText || "",
            updatedAt: Date.now(),
          }).catch(() => {});
        } catch (e) {}
      }
    }
  }
}
