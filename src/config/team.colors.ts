/** Team visual colors for boats & UI */
export const TEAM_COLORS: Record<string, number> = {
  'soc-trang': 0xc41e3a,
  'tra-vinh': 0x2563eb,
  'ca-mau': 0x16a34a,
  'can-tho': 0xf59e0b,
  'bac-lieu': 0x8b5cf6,
  'kien-giang': 0x06b6d4,
  player: 0xffd700,
};

export function getTeamColor(teamId: string): number {
  return TEAM_COLORS[teamId] ?? 0x94a3b8;
}

export function getTeamColorCss(teamId: string): string {
  const hex = (getTeamColor(teamId) >>> 0).toString(16).padStart(6, '0');
  return `#${hex}`;
}
