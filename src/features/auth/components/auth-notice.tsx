import { cn } from "@/lib/utils/cn";

type AuthNoticeProps = {
  message?: string | null;
  tone?: "info" | "error";
};

export function AuthNotice({ message, tone = "info" }: AuthNoticeProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "error"
          ? "border-danger/20 bg-danger-soft text-ink"
          : "border-brand/15 bg-brand-soft/60 text-ink/80"
      )}
    >
      {message}
    </div>
  );
}
