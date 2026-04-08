import { cn } from "@/lib/utils/cn";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-line/80 bg-panel p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
