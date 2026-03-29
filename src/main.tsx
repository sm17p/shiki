import React from "react";
import ReactDOM from "react-dom/client";
import { init } from "@/lib/log";
import App from "./App";

init();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
