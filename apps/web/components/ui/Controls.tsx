"use client";
import type {
  InputProps,
  TextareaProps,
  SelectProps,
  ButtonProps,
  CheckboxProps,
} from "@/types/ui/type";
import Dropdown from "./Dropdown";
const focus = "outline-none focus-visible:outline-none focus:border-blue";
const field = `w-full min-w-0 rounded-lg border border-[var(--field-line)] bg-[var(--surface)] px-3 py-3 text-base leading-6 text-ink placeholder:text-muted ${focus}`;
const variants = {
  plain: "",
  primary:
    "inline-flex min-h-11 items-center justify-center gap-6 rounded-lg bg-blue px-4 py-3 text-sm font-normal text-[var(--surface)] hover:bg-[var(--blue-hover)] disabled:bg-[var(--blue-faint)] disabled:text-muted",
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-6 rounded-lg border border-[var(--field-line)] bg-[var(--surface)] px-4 py-3 text-sm font-normal text-blue hover:bg-[var(--blue-faint)] disabled:text-muted",
  danger:
    "inline-flex min-h-11 items-center justify-center gap-6 rounded-lg border border-[var(--danger-line)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-normal text-[var(--danger)] hover:bg-[var(--surface)]",
};
export function Input({
  className = "",
  unstyled = false,
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      className={`${unstyled ? "w-full min-w-0 border-0 bg-transparent p-0 text-ink outline-none focus-visible:outline-none" : field} ${className}`}
    />
  );
}
export function Textarea({ className = "", ...props }: TextareaProps) {
  return <textarea {...props} className={`${field} resize-y ${className}`} />;
}
export function Select({ className = "", ...props }: SelectProps) {
  return <Dropdown {...props} className={className} />;
}
export function Button({
  className = "",
  type = "button",
  variant = "plain",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={`cursor-pointer transition-transform duration-200 motion-safe:hover:scale-[1.02] motion-reduce:transition-none disabled:hover:scale-100 disabled:cursor-not-allowed outline-none focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--field-line)] ${variants[variant]} ${className}`}
    />
  );
}
export function Checkbox({ className = "", ...props }: CheckboxProps) {
  return (
    <input
      {...props}
      type="checkbox"
      className={`size-5 shrink-0 cursor-pointer rounded border-[var(--field-line)] accent-blue ${focus} ${className}`}
    />
  );
}
