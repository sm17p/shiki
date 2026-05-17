import { cn } from "@/lib/utils";

type Props = {
  imageUrl: string;
  caption: string;
  className?: string;
  children?: React.ReactNode;
  width?: number;
  height?: number;
};

export default function ImageCard({
  imageUrl,
  caption,
  children,
  className,
  width,
  height,
}: Props) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-base border-2 border-border bg-main font-base shadow-shadow",
        className,
      )}
    >
      <img
        className="w-full h-full aspect-1/1 object-cover"
        src={imageUrl}
        alt={caption || "Photo"}
        width={width}
        height={height}
        loading="lazy"
      />
      <figcaption className="border-t-2 text-main-foreground border-border p-4">
        <div className="min-w-0 truncate">{caption}</div>
        {children}
      </figcaption>
    </figure>
  );
}
