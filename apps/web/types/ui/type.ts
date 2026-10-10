import type { ComponentProps } from "react";
export interface IconProps {
  name:
    | "plus"
    | "user"
    | "bell"
    | "arrow"
    | "close"
    | "filters"
    | "eye"
    | "eye-off";
  size?: number;
  className?: string;
}
export interface BrandMarkProps {
  size?: number;
  className?: string;
}
export interface NameAvatarProps {
  name: string;
  size?: number;
  className?: string;
}
export type InputProps = ComponentProps<"input"> & { unstyled?: boolean };
export type TextareaProps = ComponentProps<"textarea">;
export type SelectProps = ComponentProps<"select">;
export type CheckboxProps = Omit<InputProps, "type">;
export type ButtonProps = ComponentProps<"button"> & {
  variant?: "plain" | "primary" | "secondary" | "danger";
};
