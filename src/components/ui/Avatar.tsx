"use client";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

const colors = [
  "bg-pink-400",
  "bg-purple-400",
  "bg-blue-400",
  "bg-green-400",
  "bg-yellow-400",
  "bg-orange-400",
  "bg-red-400",
  "bg-teal-400",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({
  name,
  imageUrl,
  size = "md",
  className = "",
}: AvatarProps) {
  const initials = name.slice(0, 1);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizes[size]} ${getColorFromName(name)}
        rounded-full flex items-center justify-center
        text-white font-bold shadow-sm
        ${className}
      `}
    >
      {initials}
    </div>
  );
}
