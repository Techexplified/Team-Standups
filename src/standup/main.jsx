import React from "react";
import ReactDOM from "react-dom/client";
import StandupApp from "./StandupApp.jsx";
import { getTrelloClient } from "../lib/trelloMock.js";

const t = getTrelloClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StandupApp t={t} />
  </React.StrictMode>
);
