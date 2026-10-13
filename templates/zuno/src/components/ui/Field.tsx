import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-[12px] border bg-white/[0.03] px-4 text-[17px] text-white outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-white/55 focus:bg-white/[0.05] focus:ring-4";

/** Lime ring on focus, red ring when the field has an error. */
export const fieldTone = (invalid?: boolean) => (invalid ? "border-down/70 focus:border-down focus:ring-down/20" : "border-white/12 hover:border-white/25 focus:border-lime focus:ring-lime/30");

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: ReactNode; children: ReactNode; htmlFor: string }) {
  return (
    <div>
      <label id={`${htmlFor}-label`} htmlFor={htmlFor} className="mb-2.5 block text-[16px] text-white/80">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-2 text-[15px] text-down">
          {error}
        </p>
      ) : (
        hint && <p className="mt-2 text-[15px] text-white/60">{hint}</p>
      )}
    </div>
  );
}

export function Input({ invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
      className={cn(base, "h-14", fieldTone(invalid), className)}
      {...props}
    />
  );
}

export function Textarea({ invalid, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
      className={cn(base, "min-h-[150px] resize-y py-3.5", fieldTone(invalid), className)}
      {...props}
    />
  );
}
