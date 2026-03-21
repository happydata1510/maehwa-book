"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary: "bg-green-500 hover:bg-green-600 text-white shadow-sm",
  secondary: "bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-sm",
  outline: "border-2 border-green-500 text-green-600 hover:bg-green-50",
  ghost: "text-gray-600 hover:bg-gray-100",
  danger: "bg-red-500 hover:bg-red-600 text-white shadow-sm",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-base rounded-xl",
  lg: "px-6 py-3.5 text-lg rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        font-semibold transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          처리중...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
