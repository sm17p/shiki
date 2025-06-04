import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageCard from "@/components/ui/image-card";

// import { MorphingText } from "@/components/magicui/morphing-text";
import { DAYS_OF_WEEK } from "@/constants";
import {
	checkPermissions,
	getMediaItems,
	ImageLoader,
	type MediaItem,
	pickFolder,
	requestPermissions,
} from "tauri-plugin-media-api";
import { Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { store } from "@/store";

const HEADER_TEXTS = ["四季", "Shiki", "ऋतुएँ", "Rituye"];

export function CronTab() {
	const [folders, setFolder] = useState([]);
	const [files, setFiles] = useState<MediaItem[]>([]);

	const onSubmit = useCallback((event) => {
		event.preventDefault();
	}, []);

	const onClick = async () => {
		// Do you have permission to send a notification?
		let hasPermission = await checkPermissions();
		if (!hasPermission.granted) {
			hasPermission = await requestPermissions();
		}
		if (hasPermission?.granted) {
			const media = await pickFolder();
			store.set("folders", [media.uri]);
			getMediaItems(media.uri).then((res) => {
				// biome-ignore lint/complexity/noForEach: <explanation>
				res.media.forEach((item) =>
					console.log("MediaPlugin: ", JSON.stringify(item)),
				);
				store.set("files", [...res.media]);
				setFiles(res.media);
			});
		}
	};

	useEffect(() => {
		store.get("files").then((result) => {
			setFiles(result);
		});
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
			<div className="grid grid-cols-2">
				{files?.map((v) => (
					<div key={v.displayName}>
						<ImageCard
							key={v.displayName}
							caption={v.displayName!}
							imageUrl={ImageLoader.getThumbnailUrl(v.path)}
						/>
						{/* <ImageCard
						key={v.displayName}
						caption={v.displayName!}
						imageUrl={ImageLoader.getFullImageUrl(v.path)}
					/> */}
					</div>
				))}
			</div>
		</section>
	);
}
