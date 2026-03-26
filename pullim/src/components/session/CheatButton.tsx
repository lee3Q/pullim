"use client";

interface CheatButtonProps {
  text?: string;
  onClick: () => void;
}

export default function CheatButton({
  text = "다 별로야",
  onClick,
}: CheatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="text-xs transition-colors py-1 px-3 rounded-full font-rpg-sm"
      style={{
        color: "rgba(180,100,100,0.5)",
        border: "1px solid rgba(180,100,100,0.2)",
        background: "rgba(120,50,50,0.1)",
      }}
    >
      {text}
    </button>
  );
}
