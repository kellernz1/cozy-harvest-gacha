export default function CoinIcon({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-500 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 text-[10px] font-black leading-none text-amber-950 shadow-sm ${className}`}
    >
      $
    </span>
  );
}
