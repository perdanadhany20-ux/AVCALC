"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function ConfirmSubmit({ message, className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={cn("inline-flex items-center gap-1.5 rounded-md border border-border text-sm text-danger hover:bg-sunken", className)}
      {...props}
    >
      {children}
    </button>
  );
}
