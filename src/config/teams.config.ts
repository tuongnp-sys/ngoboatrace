import type { AIPersonalityConfig } from '@/types/race.types';

export const TEAMS: AIPersonalityConfig[] = [
  {
    id: 'soc-trang',
    name: 'Sóc Trăng',
    earlyBurst: 0.4,
    lateBurst: 0.9,
    stability: 0.95,
    riskWhenBehind: 0.3,
  },
  {
    id: 'tra-vinh',
    name: 'Trà Vinh',
    earlyBurst: 0.95,
    lateBurst: 0.5,
    stability: 0.75,
    riskWhenBehind: 0.6,
  },
  {
    id: 'ca-mau',
    name: 'Cà Mau',
    earlyBurst: 0.3,
    lateBurst: 0.95,
    stability: 0.8,
    riskWhenBehind: 0.7,
  },
  {
    id: 'can-tho',
    name: 'Cần Thơ',
    earlyBurst: 0.6,
    lateBurst: 0.6,
    stability: 0.85,
    riskWhenBehind: 0.5,
  },
  {
    id: 'bac-lieu',
    name: 'Bạc Liêu',
    earlyBurst: 0.5,
    lateBurst: 0.7,
    stability: 0.7,
    riskWhenBehind: 0.8,
  },
  {
    id: 'kien-giang',
    name: 'Kiên Giang',
    earlyBurst: 0.55,
    lateBurst: 0.65,
    stability: 0.82,
    riskWhenBehind: 0.45,
  },
];

export function getTeamById(id: string): AIPersonalityConfig | undefined {
  return TEAMS.find((t) => t.id === id);
}
