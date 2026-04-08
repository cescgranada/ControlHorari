import { cn } from "@/lib/utils/cn";

type BadgeTone = "brand" | "success" | "pause" | "danger" | "neutral";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  brand: "bg-brand-soft text-brand-strong border-brand/20",
  success: "bg-success-soft text-ink border-success/20",
  pause: "bg-pause-soft text-ink border-pause/20",
  danger: "bg-danger-soft text-ink border-danger/20",
  neutral: "bg-mist text-ink border-line"
};

export function Badge({ children, className, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
