"use client";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import type { SelectProps } from "@/types/ui/type";
export default function Dropdown({
  children,
  className = "",
  value,
  defaultValue,
  disabled,
  ...props
}: SelectProps) {
  const root = useRef<HTMLSpanElement>(null);
  const native = useRef<HTMLSelectElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const options = Children.toArray(children).flatMap((child) =>
    isValidElement<ComponentProps<"option">>(child)
      ? [
          {
            value: String(child.props.value ?? child.props.children ?? ""),
            label: child.props.children,
            disabled: Boolean(child.props.disabled),
          },
        ]
      : [],
  );
  const [internal, setInternal] = useState(
    String(defaultValue ?? options[0]?.value ?? ""),
  );
  const selected = String(value ?? internal);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selected),
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const typeahead = useRef({ text: "", at: 0 });
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (open)
      document
        .getElementById(id + "-" + active)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active, id]);
  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled || !native.current) return;
    native.current.value = option.value;
    native.current.dispatchEvent(new Event("change", { bubbles: true }));
    setInternal(option.value);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  function move(direction: number) {
    let next = active;
    for (let n = 0; n < options.length; n++) {
      next = (next + direction + options.length) % options.length;
      if (!options[next]?.disabled) break;
    }
    setActive(next);
  }
  function key(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setActive(selectedIndex);
        setOpen(true);
      } else move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setOpen(true);
      setActive(event.key === "Home" ? 0 : options.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(active);
      else {
        setActive(selectedIndex);
        setOpen(true);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Tab") setOpen(false);
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      const text =
        (Date.now() - typeahead.current.at < 600
          ? typeahead.current.text
          : "") + event.key.toLowerCase();
      typeahead.current = { text, at: Date.now() };
      const index = options.findIndex(
        (option) =>
          !option.disabled &&
          String(option.label).toLowerCase().startsWith(text),
      );
      if (index >= 0) {
        setActive(index);
        setOpen(true);
      }
    }
  }
  return (
    <span ref={root} className={`relative block min-w-0 ${className}`}>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-activedescendant={open ? id + "-" + active : undefined}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        aria-required={props.required}
        disabled={disabled}
        onKeyDown={key}
        onClick={() => {
          setActive(selectedIndex);
          setOpen((old) => !old);
        }}
        className={`flex min-h-12 w-full min-w-0 items-center justify-between gap-4 rounded-lg border bg-[var(--surface)] px-3 py-3 text-left text-base leading-6 text-ink outline-none focus:border-blue disabled:cursor-not-allowed disabled:text-muted ${open ? "border-blue" : "border-[var(--field-line)]"}`}
      >
        <span className="truncate">{options[selectedIndex]?.label}</span>
        <svg
          className={`shrink-0 text-muted transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          width="16"
          height="16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m5 8 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <select
        {...props}
        ref={native}
        hidden
        tabIndex={-1}
        aria-hidden="true"
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        disabled={disabled}
      >
        {children}
      </select>
      {open && (
        <span
          role="listbox"
          id={id}
          aria-label={props["aria-label"] ?? "Options"}
          className="absolute left-0 right-0 top-full z-50 mt-2 block max-h-64 overflow-y-auto rounded-xl border border-line bg-[var(--surface)] p-1.5 shadow-[0_12px_32px_var(--menu-shadow)]"
        >
          {options.map((option, index) => (
            <span
              key={option.value}
              id={id + "-" + index}
              role="option"
              aria-selected={option.value === selected}
              aria-disabled={option.disabled}
              onPointerMove={() => !option.disabled && setActive(index)}
              onPointerDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                choose(index);
              }}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm leading-6 ${option.disabled ? "cursor-not-allowed text-muted" : active === index ? "bg-[var(--blue-faint)] text-blue" : "text-ink"}`}
            >
              {option.label}
              {option.value === selected && (
                <svg
                  viewBox="0 0 20 20"
                  width="16"
                  height="16"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0 text-blue"
                >
                  <path
                    d="m4 10 4 4 8-8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
