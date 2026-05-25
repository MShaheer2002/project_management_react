import React from 'react';

type LabelChipProps = {
  label: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
  active?: boolean;
};

const palettes = [
  { bg: 'bg-sky-500/12', text: 'text-sky-300', dot: '#38bdf8', ring: 'ring-sky-500/30' },
  { bg: 'bg-emerald-500/12', text: 'text-emerald-300', dot: '#34d399', ring: 'ring-emerald-500/30' },
  { bg: 'bg-amber-500/12', text: 'text-amber-300', dot: '#f59e0b', ring: 'ring-amber-500/30' },
  { bg: 'bg-rose-500/12', text: 'text-rose-300', dot: '#fb7185', ring: 'ring-rose-500/30' },
  { bg: 'bg-violet-500/12', text: 'text-violet-300', dot: '#a78bfa', ring: 'ring-violet-500/30' },
  { bg: 'bg-cyan-500/12', text: 'text-cyan-300', dot: '#22d3ee', ring: 'ring-cyan-500/30' },
  { bg: 'bg-fuchsia-500/12', text: 'text-fuchsia-300', dot: '#e879f9', ring: 'ring-fuchsia-500/30' },
  { bg: 'bg-lime-500/12', text: 'text-lime-300', dot: '#84cc16', ring: 'ring-lime-500/30' },
];

const hashLabel = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

const normalizeLabel = (value: string) => value.trim().toLowerCase();

export const LabelChip: React.FC<LabelChipProps> = ({ label, size = 'sm', onClick, active = false }) => {
  const palette = palettes[hashLabel(normalizeLabel(label)) % palettes.length];
  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 rounded-full ${sizeClass} font-semibold tracking-wide transition-all ${palette.bg} ${palette.text} ${
        onClick ? 'hover:scale-[1.03] cursor-pointer' : 'cursor-default'
      } ${active ? `ring-1 ${palette.ring}` : ''}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: palette.dot }} />
      <span className="truncate">{label}</span>
    </button>
  );
};
