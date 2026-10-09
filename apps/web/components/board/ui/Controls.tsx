"use client";
import type { ComponentProps } from "react";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2";
const field = `w-full min-w-0 rounded-lg border border-[var(--field-line)] bg-[var(--surface)] px-3 py-3 text-base leading-6 text-ink placeholder:text-muted ${focus}`;
export function Input({ className = "", ...props }: ComponentProps<"input">) { return <input {...props} className={`${field} ${className}`} />; }
export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) { return <textarea {...props} className={`${field} resize-y ${className}`} />; }
export function Select({ className = "", ...props }: ComponentProps<"select">) { return <span className={`relative block min-w-0 ${className}`}><select {...props} className={`${field} min-h-12 appearance-none cursor-pointer pr-10`} /><svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg></span>; }
export function Button({ className = "", type = "button", ...props }: ComponentProps<"button">) { return <button type={type} {...props} className={`cursor-pointer disabled:cursor-not-allowed ${focus} ${className}`} />; }
export function Checkbox({ className = "", ...props }: Omit<ComponentProps<"input">, "type">) { return <input {...props} type="checkbox" className={`size-5 shrink-0 cursor-pointer rounded border-[var(--field-line)] accent-blue ${focus} ${className}`} />; }
