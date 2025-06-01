import { CronTab } from "@/containers/CronTab";
import { Gallery } from "@/containers/Gallery";

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
