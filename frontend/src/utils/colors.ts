const TAG_COLORS = [
  { bg: 'rgba(129, 140, 248, 0.15)', text: '#818cf8' }, // Indigo
  { bg: 'rgba(74, 222, 128, 0.15)', text: '#4ade80' },  // Green
  { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },  // Amber
  { bg: 'rgba(248, 113, 113, 0.15)', text: '#f87171' }, // Red
  { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa' },  // Blue
  { bg: 'rgba(244, 114, 182, 0.15)', text: '#f472b6' }, // Pink
  { bg: 'rgba(167, 139, 250, 0.15)', text: '#a78bfa' }, // Purple
  { bg: 'rgba(45, 212, 191, 0.15)', text: '#2dd4bf' },  // Teal
];

export function getTagStyle(tag: string) {
  if (!tag) return {};
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return {
    backgroundColor: TAG_COLORS[index].bg,
    color: TAG_COLORS[index].text,
    border: '1px solid transparent'
  };
}
