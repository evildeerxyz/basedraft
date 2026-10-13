import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-control border bg-fg/[0.03] text-fg outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-subtle focus:bg-fg/[0.05]";

/** Three densities: "md" for forms on a page, "base" for rows of buttons in dialogs, "sm" for tool panels like Studio's inspector. */
export type FieldSize = "sm" | "base" | "md";
const SIZE: Record<FieldSize, { input: string; area: string; ring: string }> = {
  md: { input: "h-12 px-4 text-[16px]", area: "min-h-[110px] px-4 py-3 text-[16px]", ring: "focus:ring-4" },
  base: { input: "h-9 px-3 text-[14px]", area: "min-h-[84px] px-3 py-2 text-[14px]", ring: "focus:ring-[3px]" },
  sm: { input: "h-8 px-2.5 text-[13px]", area: "field-sizing-content min-h-[58px] max-h-[220px] px-2.5 py-2 text-[13px] leading-[1.5]", ring: "focus:ring-2" },
};

/** Lime ring on focus, red ring when the field has an error. */
export const fieldTone = (invalid?: boolean) => (invalid ? "border-[#ff5a4e]/70 focus:border-[#ff5a4e] focus:ring-[#ff5a4e]/20" : "border-line hover:border-fg/25 focus:border-accent focus:ring-accent/30");

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: ReactNode; children: ReactNode; htmlFor: string }) {
  return (
    <div>
      <label id={`${htmlFor}-label`} htmlFor={htmlFor} className="mb-2 block text-[15px] text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-2 text-[15px] text-[#ff5a4e]">
          {error}
        </p>
      ) : (
        hint && <p className="mt-2 text-[15px] text-muted">{hint}</p>
      )}
    </div>
  );
}

export function Input({ invalid, className, size = "md", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & { invalid?: boolean; size?: FieldSize }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
      className={cn(base, SIZE[size].input, SIZE[size].ring, fieldTone(invalid), className)}
      {...props}
    />
  );
}

export function Textarea({ invalid, className, size = "md", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean; size?: FieldSize }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
      className={cn(base, "resize-y", SIZE[size].area, SIZE[size].ring, fieldTone(invalid), className)}
      {...props}
    />
  );
}
