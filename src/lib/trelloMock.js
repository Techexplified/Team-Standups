/**
 * Provides a mock Trello PowerUp iframe client for local development & testing,
 * and passes through to the real window.TrelloPowerUp.iframe() when running inside Trello.
 */

const MOCK_BOARD_ID = "b_sprint_eng_101";

const MOCK_LISTS = [
  { id: "list_todo", name: "To Do", pos: 1000 },
  { id: "list_doing", name: "In Progress / Doing", pos: 2000 },
  { id: "list_review", name: "Code Review", pos: 3000 },
  { id: "list_blocked", name: "Blocked", pos: 4000 },
  { id: "list_done", name: "Done / Completed", pos: 5000 },
];

const MOCK_MEMBERS = [
  {
    id: "m_alex",
    fullName: "Alex Rivera",
    username: "alexrivera",
    initials: "AR",
    avatar: null,
  },
  {
    id: "m_ava",
    fullName: "Ava Sharma",
    username: "avasharma",
    initials: "AS",
    avatar: null,
  },
  {
    id: "m_marcus",
    fullName: "Marcus Ray",
    username: "marcusray",
    initials: "MR",
    avatar: null,
  },
  {
    id: "m_elena",
    fullName: "Elena Rostova",
    username: "elenarostova",
    initials: "ER",
    avatar: null,
  },
  {
    id: "m_devon",
    fullName: "Devon Chen",
    username: "devonchen",
    initials: "DC",
    avatar: null,
  },
  {
    id: "m_liam",
    fullName: "Liam Vance",
    username: "liamvance",
    initials: "LV",
    avatar: null,
  },
  {
    id: "m_sofia",
    fullName: "Sofia Morales",
    username: "sofiamorales",
    initials: "SM",
    avatar: null,
  },
  {
    id: "m_karan",
    fullName: "Karan Patel",
    username: "karanpatel",
    initials: "KP",
    avatar: null,
  },
  {
    id: "m_zoe",
    fullName: "Zoe Taylor",
    username: "zoetaylor",
    initials: "ZT",
    avatar: null,
  },
];

const MOCK_CARDS = [
  {
    id: "card_1",
    name: "Implementing Doing/Done card linking feature",
    desc: "Allow teammates to link board cards directly into daily standups",
    idList: "list_doing",
    idMembers: ["m_alex"],
    due: "2026-10-15T18:00:00.000Z",
    dueComplete: false,
    url: "https://trello.com/c/card_1",
  },
  {
    id: "card_2",
    name: "Writing Postgres index tests",
    desc: "Verify composite index performance on history queries",
    idList: "list_doing",
    idMembers: ["m_alex"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_2",
  },
  {
    id: "card_3",
    name: "OAuth refresh token flow",
    desc: "Handle silent token renewal across iframe lifecycle",
    idList: "list_doing",
    idMembers: ["m_ava"],
    due: "2026-10-14T12:00:00.000Z",
    dueComplete: false,
    url: "https://trello.com/c/card_3",
  },
  {
    id: "card_4",
    name: "Webhook sync event handlers",
    desc: "Listen to card moves and update standup status in real time",
    idList: "list_doing",
    idMembers: ["m_ava"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_4",
  },
  {
    id: "card_5",
    name: "Audit query response latencies",
    desc: "Profile endpoint latencies under concurrent standup logging",
    idList: "list_todo",
    idMembers: ["m_ava"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_5",
  },
  {
    id: "card_6",
    name: "Migrate Postgres schemas to v2",
    desc: "Run database migration script with standup history tables",
    idList: "list_doing",
    idMembers: ["m_marcus"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_6",
  },
  {
    id: "card_7",
    name: "Staging database integration test",
    desc: "Waiting on DevOps team credentials for staging cluster",
    idList: "list_blocked",
    idMembers: ["m_marcus"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_7",
  },
  {
    id: "card_8",
    name: "Build modal dialog for Log Standup",
    desc: "Interactive popup with card attachments and blocker notes",
    idList: "list_done",
    idMembers: ["m_elena"],
    due: null,
    dueComplete: true,
    url: "https://trello.com/c/card_8",
  },
  {
    id: "card_9",
    name: "Filter chips and teammate selector",
    desc: "UI filters for submitted, unsubmitted, and active blockers",
    idList: "list_doing",
    idMembers: ["m_elena"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_9",
  },
  {
    id: "card_10",
    name: "Board card badge sync cron",
    desc: "Display front-of-card badges for standup completion & blockers",
    idList: "list_doing",
    idMembers: ["m_devon"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_10",
  },
  {
    id: "card_11",
    name: "Card back section embedding",
    desc: "Display compact standup widget inside card back view",
    idList: "list_doing",
    idMembers: ["m_devon"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_11",
  },
  {
    id: "card_12",
    name: "Finalize Daily Standup Power-Up checklist",
    desc: "Review acceptance criteria with engineering and product",
    idList: "list_doing",
    idMembers: ["m_sofia"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_12",
  },
  {
    id: "card_13",
    name: "Stakeholder demo session prep",
    desc: "Slides and environment prep for sprint demo",
    idList: "list_todo",
    idMembers: ["m_sofia"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_13",
  },
  {
    id: "card_14",
    name: "CSP headers validation on Vercel deployment",
    desc: "Requires TLS certificate renewal on proxy domain",
    idList: "list_blocked",
    idMembers: ["m_karan"],
    due: null,
    dueComplete: false,
    url: "https://trello.com/c/card_14",
  },
  {
    id: "card_15",
    name: "Participation gauge ring SVG component",
    desc: "Circular SVG gauge showing % standups logged",
    idList: "list_done",
    idMembers: ["m_elena"],
    due: null,
    dueComplete: true,
    url: "https://trello.com/c/card_15",
  },
];

export function getTrelloClient() {
  if (typeof window !== "undefined" && window.TrelloPowerUp && typeof window.TrelloPowerUp.iframe === "function") {
    try {
      const realClient = window.TrelloPowerUp.iframe();
      // Test if real client is responsive inside Trello
      if (realClient && typeof realClient.board === "function") {
        return realClient;
      }
    } catch (e) {
      // TrelloPowerUp.iframe() fallback handled cleanly
    }
  }

  // Fallback rich mock for local development & sandbox
  return {
    get: (scope, visibility, key) => {
      try {
        const val = localStorage.getItem(`ds_powerup_${scope}_${visibility}_${key}`);
        return Promise.resolve(val);
      } catch (e) {
        return Promise.resolve(null);
      }
    },
    set: (scope, visibility, key, val) => {
      try {
        const serialized = typeof val === "string" ? val : JSON.stringify(val);
        localStorage.setItem(`ds_powerup_${scope}_${visibility}_${key}`, serialized);
      } catch (e) {}
      return Promise.resolve();
    },
    remove: (scope, visibility, key) => {
      try {
        localStorage.removeItem(`ds_powerup_${scope}_${visibility}_${key}`);
      } catch (e) {}
      return Promise.resolve();
    },
    sizeTo: (selector) => Promise.resolve(),
    closePopup: () => {},
    popup: (opts) => {
      if (opts && opts.url) {
        window.open(opts.url, "_blank");
      }
    },
    modal: (opts) => {
      if (opts && opts.url) {
        window.open(opts.url, "_blank");
      }
    },
    card: (field) => {
      return Promise.resolve(MOCK_CARDS[0]);
    },
    cards: (field) => {
      return Promise.resolve(MOCK_CARDS);
    },
    lists: (field) => {
      return Promise.resolve(MOCK_LISTS);
    },
    board: (field) => {
      return Promise.resolve({
        id: MOCK_BOARD_ID,
        name: "Engineering Sprint Board",
        url: "https://trello.com/b/sprint-eng",
        members: MOCK_MEMBERS,
      });
    },
    member: (field) => {
      return Promise.resolve(MOCK_MEMBERS[0]);
    },
    signUrl: (url) => url,
  };
}
