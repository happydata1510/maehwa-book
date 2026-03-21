"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({
  children,
  className = "",
  onClick,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100 p-4
        ${hoverable ? "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
