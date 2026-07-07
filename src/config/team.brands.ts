import { TEAMS } from '@/config/teams.config';
import { getTeamColor, getTeamColorCss } from '@/config/team.colors';

export type FlagSymbol = 'lotus' | 'wave' | 'rice' | 'star' | 'bird' | 'fish';

export interface TeamBrand {
  symbol: FlagSymbol;
  accentColor: string;
  bannerText: string;
  motto: string;
}

export const TEAM_BRANDS: Record<string, TeamBrand> = {
  'soc-trang': {
    symbol: 'lotus',
    accentColor: '#ffd700',
    bannerText: 'ST',
    motto: 'Chậm mà chắc, đích vẫn gọi tên',
  },
  'tra-vinh': {
    symbol: 'wave',
    accentColor: '#ffffff',
    bannerText: 'TV',
    motto: 'Ra khơi như chớp, đối thủ còn ngáp',
  },
  'ca-mau': {
    symbol: 'rice',
    accentColor: '#fef08a',
    bannerText: 'CM',
    motto: 'Cuối trận mới biết ai là đại ca',
  },
  'can-tho': {
    symbol: 'star',
    accentColor: '#dc2626',
    bannerText: 'CT',
    motto: 'Giữa sông Hậu — giữa bảng xếp hạng',
  },
  'bac-lieu': {
    symbol: 'bird',
    accentColor: '#ffffff',
    bannerText: 'BL',
    motto: 'Thua là tăng ga, không ai cản được',
  },
  'kien-giang': {
    symbol: 'fish',
    accentColor: '#ffffff',
    bannerText: 'KG',
    motto: 'Đảo Phú Quốc không đảo lộn kế hoạch',
  },
};

const DEFAULT_BRAND: TeamBrand = {
  symbol: 'star',
  accentColor: '#ffffff',
  bannerText: '??',
  motto: '',
};

export function getTeamBrand(teamId: string): TeamBrand {
  return TEAM_BRANDS[teamId] ?? DEFAULT_BRAND;
}

export function getTeamAccentPhaser(teamId: string): number {
  const hex = getTeamBrand(teamId).accentColor.replace('#', '');
  return parseInt(hex, 16);
}

/** Inline SVG cờ đội cho UI DOM */
export function getTeamFlagSvg(teamId: string, height = 36): string {
  const brand = getTeamBrand(teamId);
  const primary = getTeamColorCss(teamId);
  const accent = brand.accentColor;
  const w = Math.round(height * 0.75);
  const poleH = height;
  const pennant = symbolSvgPath(brand.symbol, w * 0.55, height * 0.38);

  const poleX = w + 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 6}" height="${poleH}" viewBox="0 0 ${w + 6} ${poleH}" aria-hidden="true">
    <rect x="${poleX}" y="4" width="2" height="${poleH - 4}" rx="1" fill="#5c3d1e"/>
    <path d="M${poleX} 4 L${poleX} ${height * 0.52} L4 ${height * 0.28} Z" fill="${primary}"/>
    <path d="M${poleX} ${height * 0.52} L4 ${height * 0.28} L8 ${height * 0.42} Z" fill="${accent}" opacity="0.9"/>
    <g transform="translate(${w * 0.32}, ${height * 0.3})" fill="${accent}">${pennant}</g>
    <text x="${w * 0.35}" y="${height * 0.48}" text-anchor="middle" font-size="6" font-weight="bold" fill="${accent}" font-family="sans-serif">${brand.bannerText}</text>
  </svg>`;
}

function symbolSvgPath(symbol: FlagSymbol, x: number, y: number): string {
  switch (symbol) {
    case 'lotus':
      return `<circle cx="${x}" cy="${y}" r="3" opacity="0.95"/><ellipse cx="${x - 3}" cy="${y + 1}" rx="2" ry="3"/><ellipse cx="${x + 3}" cy="${y + 1}" rx="2" ry="3"/>`;
    case 'wave':
      return `<path d="M${x - 5} ${y} Q${x - 2} ${y - 3} ${x + 1} ${y} T${x + 7} ${y}" stroke="currentColor" stroke-width="1.2" fill="none"/>`;
    case 'rice':
      return `<line x1="${x}" y1="${y - 4}" x2="${x}" y2="${y + 4}" stroke="currentColor" stroke-width="1"/><line x1="${x - 3}" y1="${y - 2}" x2="${x - 3}" y2="${y + 3}" stroke="currentColor" stroke-width="0.8"/><line x1="${x + 3}" y1="${y - 2}" x2="${x + 3}" y2="${y + 3}" stroke="currentColor" stroke-width="0.8"/>`;
    case 'star':
      return `<polygon points="${x},${y - 4} ${x + 1.2},${y - 1} ${x + 4},${y - 1} ${x + 1.8},${y + 0.8} ${x + 2.6},${y + 4} ${x},${y + 2} ${x - 2.6},${y + 4} ${x - 1.8},${y + 0.8} ${x - 4},${y - 1} ${x - 1.2},${y - 1}"/>`;
    case 'bird':
      return `<path d="M${x - 5} ${y} L${x} ${y - 3} L${x + 5} ${y} L${x} ${y + 1} Z"/>`;
    case 'fish':
      return `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.5"/><polygon points="${x + 4},${y} ${x + 7},${y - 2} ${x + 7},${y + 2}"/>`;
    default:
      return `<circle cx="${x}" cy="${y}" r="2"/>`;
  }
}

/** Đảm bảo mọi đội trong TEAMS đều có brand */
export function assertAllTeamsHaveBrands(): void {
  for (const team of TEAMS) {
    if (!TEAM_BRANDS[team.id]) {
      throw new Error(`Missing team brand for ${team.id}`);
    }
  }
}

export { getTeamColor, getTeamColorCss };
