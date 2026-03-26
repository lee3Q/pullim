"use client";

interface ChoiceOption {
  emoji: string;
  label: string;
}

interface Props {
  options: [ChoiceOption, ChoiceOption];
  onSelect: (index: 0 | 1) => void;
  disabled?: boolean;
  primaryColor: string;
}

export default function DiscoveryChoice({
  options,
  onSelect,
  disabled = false,
  primaryColor,
}: Props) {
  return (
    <div className="flex flex-col gap-3 max-w-sm mx-auto w-full">
      {options.map((option, i) => (
        <button
          key={i}
          onClick={() => onSelect(i as 0 | 1)}
          disabled={disabled}
          className="w-full text-left px-5 py-4 rounded-xl border border-white/10
                     hover:border-white/30 active:scale-[0.97]
                     transition-all duration-300 backdrop-blur-sm
                     disabled:opacity-30 disabled:pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            animationDelay: `${0.2 + i * 0.15}s`,
            animation: "stage-fade-in 0.4s ease-out backwards",
          }}
        >
          <span className="text-xl mr-3">{option.emoji}</span>
          <span
            className="text-sm font-rpg"
            style={{ color: `${primaryColor}dd` }}
          >
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}
