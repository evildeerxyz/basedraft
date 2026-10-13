/*
 * One icon per idea, used everywhere that idea appears: the rail, Studio's
 * outline, sheet titles and buttons. Duotone throughout, so the second tone
 * carries the active color.
 */
import {
  BoundingBoxIcon,
  BookOpenTextIcon,
  BrowserIcon,
  ChartBarIcon,
  CodeIcon,
  CursorClickIcon,
  ClockCounterClockwiseIcon,
  FootprintsIcon,
  HandPointingIcon,
  DiamondIcon,
  DropIcon,
  ExportIcon,
  FigmaLogoIcon,
  EyeIcon,
  FilesIcon,
  HouseSimpleIcon,
  ImageSquareIcon,
  LayoutIcon,
  ListBulletsIcon,
  PaletteIcon,
  PenNibIcon,
  QuestionIcon,
  QuotesIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  WaveSineIcon,
  SquareHalfBottomIcon,
  SquaresFourIcon,
  StackIcon,
  TagIcon,
  TextAaIcon,
  TextHOneIcon,
} from "@phosphor-icons/react/ssr";
import type { SectionKind } from "./live";

export type IconType = typeof BrowserIcon;

export const SECTION_ICON: Record<SectionKind, IconType> = {
  nav: BrowserIcon,
  hero: TextHOneIcon,
  logos: SealCheckIcon,
  story: BookOpenTextIcon,
  features: SquaresFourIcon,
  steps: FootprintsIcon,
  interactive: HandPointingIcon,
  stats: ChartBarIcon,
  testimonials: QuotesIcon,
  security: ShieldCheckIcon,
  pricing: TagIcon,
  faq: QuestionIcon,
  changelog: ClockCounterClockwiseIcon,
  cta: CursorClickIcon,
  divider: WaveSineIcon,
  footer: SquareHalfBottomIcon,
};

export const ICON = {
  overview: HouseSimpleIcon,
  studio: PenNibIcon,
  pro: DiamondIcon,
  templates: LayoutIcon,
  components: StackIcon,
  preview: EyeIcon,
  spec: ListBulletsIcon,
  pages: FilesIcon,
  export: ExportIcon,
  figma: FigmaLogoIcon,
  code: CodeIcon,
  theme: PaletteIcon,
  accent: DropIcon,
  shape: BoundingBoxIcon,
  content: TextAaIcon,
  layout: LayoutIcon,
  visual: ImageSquareIcon,
};

/** The icon for a kind of section, in the shared duotone style. */
export function SectionGlyph({ kind, size = 15, className }: { kind: SectionKind; size?: number; className?: string }) {
  const I = SECTION_ICON[kind];
  return <I size={size} weight="duotone" className={className} />;
}
