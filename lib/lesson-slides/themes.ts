export type SlideTheme = {
  id: string;
  name: string;
  background: string;
  surface: string;
  titleColor: string;
  bodyColor: string;
  primary: string;
  secondary: string;
  accent: string;
  titleFont: string;
  bodyFont: string;
  cardRadius: number;
};

export const slideThemes: SlideTheme[] = [
  { id: "education-blue", name: "Xanh giáo dục", background: "F5F8FF", surface: "FFFFFF", titleColor: "102A56", bodyColor: "334155", primary: "2563EB", secondary: "60A5FA", accent: "06B6D4", titleFont: "Aptos Display", bodyFont: "Aptos", cardRadius: 0.16 },
  { id: "minimal-light", name: "Tối giản sáng", background: "FAFAF9", surface: "FFFFFF", titleColor: "18181B", bodyColor: "3F3F46", primary: "334155", secondary: "94A3B8", accent: "2563EB", titleFont: "Arial", bodyFont: "Arial", cardRadius: 0.08 },
  { id: "modern-green", name: "Xanh lá hiện đại", background: "F2FBF7", surface: "FFFFFF", titleColor: "064E3B", bodyColor: "334155", primary: "059669", secondary: "34D399", accent: "0EA5E9", titleFont: "Aptos Display", bodyFont: "Aptos", cardRadius: 0.18 },
  { id: "formal", name: "Trang trọng", background: "FFFDF8", surface: "FFFFFF", titleColor: "3F2D20", bodyColor: "44403C", primary: "7C3E24", secondary: "C08457", accent: "B45309", titleFont: "Times New Roman", bodyFont: "Arial", cardRadius: 0.04 },
  { id: "modern-dark", name: "Tối hiện đại", background: "0F172A", surface: "1E293B", titleColor: "F8FAFC", bodyColor: "CBD5E1", primary: "38BDF8", secondary: "818CF8", accent: "22D3EE", titleFont: "Aptos Display", bodyFont: "Aptos", cardRadius: 0.16 },
];

export function getSlideTheme(id: string) {
  return slideThemes.find((theme) => theme.id === id) ?? slideThemes[0];
}
