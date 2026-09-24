"use client";

interface Props {
  message: string;
  hotline: string;
  onClose: () => void;
  riskState?: "awaiting_confirmation" | "emergency";
}

export default function CrisisAlert({ message, hotline, onClose, riskState }: Props) {
  const confirmSafe = async () => {
    const response = await fetch("/api/ultimate/confirm-safety", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer: "safe" }),
    });
    if (response.ok && (await response.json()).policy?.riskState === "open") onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl max-w-md md:max-w-xl w-full p-6 shadow-xl border border-red-900/30">
        <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <p className="text-center text-white/90 font-medium mb-2">{message}</p>
        <p className="text-center text-sm text-white/60 mb-6">{hotline}</p>
        <div className="flex flex-col gap-2">
          {riskState === "awaiting_confirmation" && (
            <button onClick={confirmSafe} className="w-full py-3 bg-white/10 text-white rounded-xl">
              지금은 안전합니다
            </button>
          )}
          <a
            href="tel:109"
            className="block w-full text-center py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            109 전화하기
          </a>
          <button
            onClick={onClose}
            className="w-full py-3 text-white/60 rounded-xl hover:bg-white/5 transition-colors text-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
