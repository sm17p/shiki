import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertFileSrc } from "@tauri-apps/api/core";
// import { MorphingText } from "@/components/magicui/morphing-text";
import { DAYS_OF_WEEK } from "@/constants";
import {
	checkPermissions,
	type FolderPath,
	getMediaItems,
	pickFolder,
	requestPermissions,
} from "tauri-plugin-media-api";
import { Settings } from "lucide-react";
import { useCallback, useEffect, useState, } from "react";
import { store } from "@/store";

const HEADER_TEXTS = ["四季", "Shiki", "ऋतुएँ", "Rituye"];
const folders = await store.get("folders");
const files = await store.get("files");

export function CronTab() {
	const [media, setMedia] = useState<FolderPath>();
	console.log("🚀 ~ CronTab ~ media:", media?.toString(), folders?.toString());
	

	const onSubmit = useCallback((event) => {
		event.preventDefault();
	}, []);

	const onClick = async () => {
		// Do you have permission to send a notification?
		let hasPermission = await checkPermissions();
		if (!hasPermission.granted) {
			hasPermission = await requestPermissions();
		}
		console.log("🚀 ~ onClick ~ hasPermission:", );
		if (hasPermission?.granted) {
			console.log("🚀 ~ onClick ~ hasPermission: inside", hasPermission?.granted);
			const media = await pickFolder();
			console.log("🚀 ~ onClick ~ media:", media);
			store.set("folders", [media.uri]);
			setMedia(media);
		}
	};

	useEffect(() => {
		if (Array.isArray(folders)) {
			for (const el of folders) {
				console.log("🚀 MediaPlugin ~ useEffect ~ el:", el);
				// getMediaItems(el).then(res => {
				// 	store.set("files", [...res.media]);
				// })
			}

		}
	}, []);

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
			{files.map(v => (
				<>
					<h2 className="wrap-anywhere">{convertFileSrc(v.path)}</h2>
					<img className="border-2 border-amber-600" src={convertFileSrc(v.path)} alt="" width={v.width} height={v.height} />
				</>
				)
			)}
		</section>
	);
}
