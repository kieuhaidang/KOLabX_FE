import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content flex min-h-24 w-full resize-none rounded-2xl border border-white/12 bg-black/70 px-4 py-3 text-base text-white shadow-sm backdrop-blur transition-[color,box-shadow,background,border-color] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-[#111] focus-visible:ring-primary/20 focus-visible:ring-[4px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
