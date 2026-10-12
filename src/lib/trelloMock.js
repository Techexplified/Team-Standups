/**
 * Provides a mock Trello PowerUp iframe client for local development & testing.
 * Stores data in localStorage scoped like Trello member/board storage.
 */
export function getTrelloClient() {
  if (typeof window !== "undefined" && window.TrelloPowerUp && typeof window.TrelloPowerUp.iframe === "function") {
    try {
      return window.TrelloPowerUp.iframe();
    } catch (e) {
      console.warn("TrelloPowerUp.iframe() failed, using mock client", e);
    }
  }

  // Fallback mock for local development
  return {
    get: (scope, visibility, key) =>
      Promise.resolve(localStorage.getItem(`ds_powerup_${scope}_${visibility}_${key}`)),
    set: (scope, visibility, key, val) => {
      localStorage.setItem(`ds_powerup_${scope}_${visibility}_${key}`, val);
      return Promise.resolve();
    },
    remove: (scope, visibility, key) => {
      localStorage.removeItem(`ds_powerup_${scope}_${visibility}_${key}`);
      return Promise.resolve();
    },
    sizeTo: (selector) => Promise.resolve(),
    closePopup: () => {
      console.log("[Mock Trello] closePopup called");
    },
    popup: (opts) => {
      console.log("[Mock Trello] popup requested:", opts);
      if (opts && opts.url) {
        window.open(opts.url, "_blank");
      }
    },
    modal: (opts) => {
      console.log("[Mock Trello] modal requested:", opts);
      if (opts && opts.url) {
        window.open(opts.url, "_blank");
      }
    },
    card: (field) => {
      return Promise.resolve({
        id: "mock-card-id-101",
        name: "Feature: Daily Standup Workflow",
        desc: "Sprint card for daily sync tracking",
      });
    },
    board: (field) => {
      return Promise.resolve({
        id: "mock-board-id-202",
        name: "Engineering Sprint Board",
      });
    },
    member: (field) => {
      return Promise.resolve({
        id: "mock-member-id-303",
        fullName: "Standup Lead",
        username: "standuplead",
      });
    },
    signUrl: (url) => url,
  };
}
