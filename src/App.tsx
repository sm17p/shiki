import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CronTab } from "@/containers/CronTab";
import { Gallery } from "@/containers/Gallery";
import { Button } from "@/components/ui/button"

// import "./index.css";
import "./globals.css";

function App() {

  return (
    <main className="prose-lg min-h-screen w-screen flex flex-col">
      <CronTab />
      <Gallery />
    </main>
  );
}

export default App;
