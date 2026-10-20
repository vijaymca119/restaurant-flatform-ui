import { Link } from "@tanstack/react-router";

export function Logo({ suffix }: { suffix?: string }) {
  return (
    <Link to="/" className="flex items-center gap-2 text-foreground" aria-label="SortedDate Partners home">
      <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
        S
      </span>
      <span className="text-[15px] font-semibold tracking-tight">
        SortedDate{suffix ? <span className="font-normal text-muted-foreground"> {suffix}</span> : null}
      </span>
    </Link>
  );
}
