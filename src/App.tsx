import { CronTab } from "@/containers/CronTab";
import { Gallery } from "@/containers/Gallery";

// import "./index.css";
import "./globals.css";
import { useEffect } from "react";

function App() {
	useEffect(() => {
		const observer = new PerformanceObserver((list) => {
			list.getEntries().forEach((entry) => {
				if (entry.entryType === "resource") {
					console.log("New Resource:", entry.name);
					console.log("Duration:", entry.duration);
				}
			});
		});

		observer.observe({ type: "resource", buffered: true });

		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<main className="prose-lg min-h-screen w-screen flex flex-col">
			<CronTab />
			<Gallery />
		</main>
	);
}

export default App;
