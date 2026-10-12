/* global TrelloPowerUp */
import { isAuthorized } from "../lib/auth.js";

const ICON_URL =
  typeof window !== "undefined" && window.location.origin
    ? `${window.location.origin}/icons/icon.svg`
    : "./icons/icon.svg";

TrelloPowerUp.initialize({
  // Capability: Trello queries this capability to decide whether to prompt the member to authorize
  "authorization-status": async function (t) {
    const authorized = await isAuthorized(t);
    return { authorized };
  },

  // Capability: Called when Trello prompts authorization
  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize Daily Standups",
      url: "./auth.html",
      height: 340,
    });
  },

  // Capability: Called when member opens Power-Up settings from the board menu
  "show-settings": function (t) {
    return t.popup({
      title: "Daily Standups Settings",
      url: "./settings.html",
      height: 300,
    });
  },

  // Capability: Adds a Daily Standups button in the top board header
  "board-buttons": function () {
    return [
      {
        icon: {
          dark: ICON_URL,
          light: ICON_URL,
        },
        text: "Daily Standups",
        callback: async function (t) {
          const authorized = await isAuthorized(t);
          if (!authorized) {
            return t.popup({
              title: "Authorize Daily Standups",
              url: "./auth.html",
              height: 340,
            });
          }

          // User is authorized -> open centered modal dialog (fullscreen for generous workspace)
          return t.modal({
            url: "./standup.html",
            accentColor: "#0f172a",
            height: 720,
            fullscreen: true,
            title: "Daily Standups Sync",
          });
        },
      },
    ];
  },

  // Capability: Card button on back of cards
  "card-buttons": async function () {
    return [
      {
        icon: ICON_URL,
        text: "Daily Standup",
        callback: async function (t) {
          const authorized = await isAuthorized(t);
          if (!authorized) {
            return t.popup({
              title: "Authorize Daily Standups",
              url: "./auth.html",
              height: 340,
            });
          }

          let cardParam = "";
          try {
            const cardInfo = await t.card("id").catch(() => null);
            if (cardInfo && cardInfo.id) {
              cardParam = `?cardId=${encodeURIComponent(cardInfo.id)}`;
            }
          } catch (e) {}

          return t.modal({
            url: `./standup.html${cardParam}`,
            accentColor: "#0f172a",
            height: 720,
            fullscreen: true,
            title: "Daily Standup Entry",
          });
        },
      },
    ];
  },

  // Capability: Front-of-card badges (status, blockers)
  "card-badges": async function (t) {
    try {
      let standupData = null;
      let cardId = null;
      try {
        const cardInfo = await t.card("id").catch(() => null);
        if (cardInfo && cardInfo.id) {
          cardId = cardInfo.id;
        }
      } catch (e) {}

      if (cardId) {
        try {
          standupData = await t.get("card", "shared", "standupData").catch(() => null);
        } catch (e) {}
      }

      if (!standupData) {
        return [];
      }

      const badges = [];

      if (standupData.completed) {
        badges.push({
          text: "Standup Done",
          icon: ICON_URL,
          color: "green",
        });
      }

      if (standupData.hasBlocker) {
        badges.push({
          text: "⚠️ Blocker",
          color: "red",
        });
      }

      return badges;
    } catch (e) {
      return [];
    }
  },

  // Capability: Embeds standup summary widget on the back of Trello cards
  "card-back-section": function (t) {
    let cardParam = "";
    try {
      const ctx = typeof t.getContext === "function" ? t.getContext() : null;
      if (ctx && ctx.card) {
        cardParam = `&cardId=${encodeURIComponent(ctx.card)}`;
      }
    } catch (e) {}

    return {
      title: "Daily Standup Status",
      icon: ICON_URL,
      content: {
        type: "iframe",
        url: t.signUrl(`./standup.html?view=card-back-section${cardParam}`),
        height: 220,
      },
      action: {
        text: "Open Full Standup",
        callback: async function (t) {
          let cardParam = "";
          try {
            const cardInfo = await t.card("id").catch(() => null);
            if (cardInfo && cardInfo.id) {
              cardParam = `?cardId=${encodeURIComponent(cardInfo.id)}`;
            }
          } catch (e) {}

          return t.modal({
            url: `./standup.html${cardParam}`,
            accentColor: "#0f172a",
            height: 720,
            fullscreen: true,
            title: "Daily Standups",
          });
        },
      },
    };
  },

  // Capability: Detail badges beneath card title
  "card-detail-badges": async function (t) {
    try {
      let standupData = null;
      try {
        standupData = await t.get("card", "shared", "standupData").catch(() => null);
      } catch (e) {}

      if (!standupData) {
        return [];
      }

      return [
        {
          title: "Standup",
          text: standupData.completed ? "Submitted Today" : "Pending Update",
          color: standupData.completed ? "green" : "blue",
          callback: function (t) {
            return t.modal({
              url: "./standup.html",
              accentColor: "#0f172a",
              height: 640,
              fullscreen: false,
              title: "Daily Standups",
            });
          },
        },
      ];
    } catch (e) {
      return [];
    }
  },
});
