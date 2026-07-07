export interface ChapterConfig {
  id: number;
  title: string;
  subtitle: string;
  opponentIds: string[];
  environmentEnabled: boolean;
}

export const CHAPTERS: ChapterConfig[] = [
  {
    id: 1,
    title: 'Làng quê',
    subtitle: 'Bước chân đầu tiên',
    opponentIds: ['tra-vinh'],
    environmentEnabled: false,
  },
  {
    id: 2,
    title: 'Xã / Huyện',
    subtitle: 'Sóng nhẹ trên sông',
    opponentIds: ['tra-vinh', 'ca-mau', 'can-tho'],
    environmentEnabled: true,
  },
  {
    id: 3,
    title: 'Liên tỉnh',
    subtitle: 'Tranh tài ĐBSCL',
    opponentIds: ['tra-vinh', 'ca-mau', 'can-tho', 'bac-lieu', 'kien-giang'],
    environmentEnabled: true,
  },
  {
    id: 4,
    title: 'Vòng loại',
    subtitle: 'Vào chung kết',
    opponentIds: ['tra-vinh', 'ca-mau', 'can-tho', 'bac-lieu', 'kien-giang', 'soc-trang'],
    environmentEnabled: true,
  },
  {
    id: 5,
    title: 'Chung kết Sóc Trăng',
    subtitle: 'Festival ĐBSCL',
    opponentIds: ['tra-vinh', 'ca-mau', 'can-tho', 'bac-lieu', 'kien-giang', 'soc-trang'],
    environmentEnabled: true,
  },
];

export function getChapter(id: number): ChapterConfig | undefined {
  return CHAPTERS.find((c) => c.id === id);
}
