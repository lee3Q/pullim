"use client";

import { ThemeName } from "@/lib/types-ultimate";
import { THEMES, Theme } from "@/lib/themes";

interface Props {
  onSelect: (theme: ThemeName) => void;
  disabled?: boolean;
}

function ThemeCard({ theme, onSelect, disabled }: { theme: Theme; onSelect: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/10
                 bg-black/30 backdrop-blur-sm hover:border-white/25 hover:bg-white/5
                 active:scale-95 transition-all
                 disabled:opacity-70 disabled:animate-pulse disabled:pointer-events-none
                 w-full max-w-[160px]"
    >
      <span className="text-4xl">{theme.icon}</span>
      <div className="text-center">
        <p className="text-sm font-semibold text-white/90">{theme.title}</p>
        <p className="text-xs text-white/40 mt-1 leading-relaxed">{theme.subtitle}</p>
        <p className="text-[11px] text-white/35 mt-2 font-rpg-sm">{theme.useCases}</p>
      </div>
    </button>
  );
}

export default function ThemeSelector({ onSelect, disabled }: Props) {
  const themes = Object.values(THEMES);

  return (
    <div className="flex gap-4 justify-center flex-wrap">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.name}
          theme={theme}
          onSelect={() => onSelect(theme.name)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
