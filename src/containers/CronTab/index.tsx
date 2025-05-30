import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { MorphingText } from "@/components/magicui/morphing-text";
import { DAYS_OF_WEEK } from "@/constants";
// import {
// 	checkPermissions,
// 	requestPermissions,
// 	getMediaItems,
// } from "tauri-plugin-media-api";
import { Settings } from "lucide-react";
import { useCallback } from "react";
import {
	// isPermissionGranted,
	requestPermission,
	sendNotification,
} from "@tauri-apps/plugin-notification";

const HEADER_TEXTS = ["四季", "Shiki", "ऋतुएँ", "Rituye"];

export function CronTab() {
	// const [media, setMedia] = useState();

	const onSubmit = useCallback((event) => {
		event.preventDefault();
	}, []);

	const onClick = async () => {
		// Do you have permission to send a notification?
		// let permissionGranted = await isPermissionGranted();

		// If not we need to request it
		const permission = await requestPermission();
		const permissionGranted = permission === "granted";

		// Once permission has been granted we can send the notification
		if (permissionGranted) {
			sendNotification({ title: "Tauri", body: "Tauri is awesome!" });
		}
	};

	return (
		<section className="px-4 py-5 cron-tab grid grid-cols-1 gap-5 border-b-5">
			<div className="flex gap-2 justify-between">
				<h1 className="mt-0 mb-0">
					{/* <MorphingText texts={HEADER_TEXTS} /> */}
					{HEADER_TEXTS[0].toString()}
				</h1>
				<Button size="icon" variant="neutral">
					<Settings />
				</Button>
			</div>
			<Card className="w-full bg-white">
				<CardHeader>
					<CardTitle className="font-light text-neutral-500">
						Cycles Every
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="grid grid-cols-1 gap-4" onSubmit={onSubmit}>
						<div className="flex justify-between">
							{DAYS_OF_WEEK.map((day) => {
								return (
									<Button
										key={day.id}
										className="rounded-full"
										onClick={onClick}
										pressed={day.code === "T"}
										size="icon"
										variant="neutral"
									>
										{day.code}
									</Button>
								);
							})}
						</div>
						<div className="flex gap-4">
							<div className="grid items-center gap-1.5">
								<Label
									className="text-center text-neutral-500"
									htmlFor="minute"
								>
									Min
								</Label>
								<Input
									className="text-center text-neutral-500"
									min={0}
									max={59}
									type="number"
									id="minute"
									placeholder="*"
								/>
							</div>
							<div className="grid items-center gap-1.5">
								<Label className="text-center text-neutral-500" htmlFor="hour">
									Hour
								</Label>
								<Input
									className="text-center text-neutral-500"
									min={0}
									max={23}
									type="number"
									id="hour"
									placeholder="*"
								/>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
			{/* {JSON.stringify(media)} */}
		</section>
	);
}
