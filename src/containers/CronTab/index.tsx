import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MorphingText } from "@/components/magicui/morphing-text";
import { DAYS_OF_WEEK } from "@/constants";
import { Settings } from "lucide-react";

const HEADER_TEXTS = ["四季", "Shiki", "ऋतुएँ", "Rituye"];

export function CronTab() {
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
					<CardTitle className="font-light">Cycles Every</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="grid grid-cols-1 gap-4">
						<div className="flex justify-between">
							{DAYS_OF_WEEK.map((day) => {
								return (
									<Button
										key={day.id}
										className="rounded-full"
										size="icon"
										variant="neutral"
									>
										{day.code}
									</Button>
								);
							})}
						</div>
						<div className="flex justify-between">
							<div className="grid items-center gap-1.5">
								<Label htmlFor="email">Email</Label>
								<Input type="email" id="email" placeholder="Email" />
							</div>
							<div className="grid items-center gap-1.5">
								<Label htmlFor="email">Email</Label>
								<Input type="email" id="email" placeholder="Email" />
							</div>
						</div>
					</form>
				</CardContent>
			</Card>
		</section>
	);
}
