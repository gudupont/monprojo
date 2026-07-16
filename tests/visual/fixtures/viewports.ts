export interface Viewport {
  name: "mobile" | "tablet" | "desktop";
  size: { width: number; height: number };
}

export const VIEWPORTS: Viewport[] = [
  { name: "mobile", size: { width: 375, height: 812 } },
  { name: "tablet", size: { width: 768, height: 1024 } },
  { name: "desktop", size: { width: 1280, height: 800 } },
];
