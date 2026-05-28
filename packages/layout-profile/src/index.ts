export type PageSizeName = "Letter" | "A4" | "custom";

export type PageSettings = {
  size: PageSizeName;
  width?: string;
  height?: string;
  orientation?: "portrait" | "landscape";
};

export type MarginSettings = {
  top: string;
  right: string;
  bottom: string;
  left: string;
};

export type TypographySettings = {
  bodyFontFamily: string;
  headingFontFamily?: string;
  baseFontSize: string;
  lineHeight: number | string;
  textColor?: string;
  mutedColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  maxWidth?: string;
};

export type HeadingStyleSettings = {
  fontFamily?: string;
  fontWeight?: number | string;
  lineHeight?: number | string;
  marginBefore?: string;
  marginAfter?: string;
  h1Size?: string;
  h2Size?: string;
  h3Size?: string;
  h4Size?: string;
  breakAfterAvoid?: boolean;
};

export type BlockStyleSettings = {
  paragraphSpacing?: string;
  listIndent?: string;
  listItemSpacing?: string;
  blockquoteBorder?: string;
  blockquoteColor?: string;
  blockquotePaddingLeft?: string;
  blockquoteBreakInsideAvoid?: boolean;
  sceneBreakSpacing?: string;
  sceneBreakWidth?: string;
};

export type FigureStyleSettings = {
  margin?: string;
  imageMaxWidth?: string;
  captionFontFamily?: string;
  captionFontSize?: string;
  captionColor?: string;
  captionSpacing?: string;
  breakInsideAvoid?: boolean;
};

export type TableStyleSettings = {
  fontFamily?: string;
  fontSize?: string;
  borderColor?: string;
  cellPadding?: string;
  headerFontWeight?: number | string;
  fullWidth?: boolean;
  breakInsideAvoid?: boolean;
};

export type PrintBehaviorSettings = {
  enabled?: boolean;
  breakHeadingsAfterAvoid?: boolean;
  avoidBreakInsideBlocks?: boolean;
  widows?: number;
  orphans?: number;
  printBackground?: boolean;
};

export type LayoutProfile = {
  schemaVersion: "oser.layout-profile/v0";
  id: string;
  name: string;
  description?: string;
  page: PageSettings;
  margins: MarginSettings;
  typography: TypographySettings;
  headings?: HeadingStyleSettings;
  blocks?: BlockStyleSettings;
  figures?: FigureStyleSettings;
  tables?: TableStyleSettings;
  print?: PrintBehaviorSettings;
};

const SYSTEM_FONT_STACK = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const SERIF_STACK = 'Georgia, "Times New Roman", serif';
const MONO_STACK = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export function layoutProfileToCss(profile: LayoutProfile): string {
  const textColor = profile.typography.textColor ?? "#111111";
  const mutedColor = profile.typography.mutedColor ?? "#555555";
  const backgroundColor = profile.typography.backgroundColor ?? "#ffffff";
  const accentColor = profile.typography.accentColor ?? textColor;
  const borderColor = profile.tables?.borderColor ?? "#b8b8b8";
  const headingFont = profile.headings?.fontFamily ?? profile.typography.headingFontFamily ?? SYSTEM_FONT_STACK;
  const captionFont = profile.figures?.captionFontFamily ?? SYSTEM_FONT_STACK;
  const tableFont = profile.tables?.fontFamily ?? SYSTEM_FONT_STACK;
  const paragraphSpacing = profile.blocks?.paragraphSpacing ?? "1rem";
  const print = profile.print ?? {};

  return [
    profileHeader(profile),
    rootCss({ textColor, mutedColor, backgroundColor, accentColor, borderColor }),
    pageCss(profile.page, profile.margins),
    baseCss(profile, { textColor, backgroundColor }),
    headingCss(profile, headingFont, print),
    blockCss(profile, paragraphSpacing, mutedColor, borderColor, print),
    codeCss(borderColor),
    figureCss(profile, captionFont, mutedColor, print),
    tableCss(profile, tableFont, borderColor, print),
    printCss(profile, print)
  ].join("\n\n");
}

function profileHeader(profile: LayoutProfile): string {
  return `/* Generated from OSER LayoutProfile: ${profile.id} (${profile.name}) */`;
}

function rootCss(tokens: {
  textColor: string;
  mutedColor: string;
  backgroundColor: string;
  accentColor: string;
  borderColor: string;
}): string {
  return `:root {
  color-scheme: light;
  --oser-profile-text: ${tokens.textColor};
  --oser-profile-muted: ${tokens.mutedColor};
  --oser-profile-background: ${tokens.backgroundColor};
  --oser-profile-accent: ${tokens.accentColor};
  --oser-profile-border: ${tokens.borderColor};
  --oser-profile-code-bg: #f5f7f9;
}`;
}

function pageCss(page: PageSettings, margins: MarginSettings): string {
  return `@page {
  size: ${pageSizeValue(page)};
  margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left};
}`;
}

function pageSizeValue(page: PageSettings): string {
  if (page.size === "custom") {
    if (!page.width || !page.height) {
      throw new Error("Custom page settings require width and height.");
    }
    return `${page.width} ${page.height}`;
  }

  const size = page.size === "A4" ? "A4" : "letter";
  return page.orientation === "landscape" ? `${size} landscape` : size;
}

function baseCss(profile: LayoutProfile, tokens: { textColor: string; backgroundColor: string }): string {
  const maxWidth = profile.typography.maxWidth ?? "42rem";

  return `html {
  background: ${tokens.backgroundColor};
  color: ${tokens.textColor};
  font-family: ${profile.typography.bodyFontFamily};
  font-size: ${profile.typography.baseFontSize};
  line-height: ${profile.typography.lineHeight};
}

body {
  margin: 0;
}

main {
  box-sizing: border-box;
  max-width: ${maxWidth};
  margin: 0 auto;
  padding: 4rem 1.5rem;
}`;
}

function headingCss(profile: LayoutProfile, headingFont: string, print: PrintBehaviorSettings): string {
  const headings = profile.headings ?? {};
  const breakAfterAvoid = headings.breakAfterAvoid ?? print.breakHeadingsAfterAvoid ?? true;

  return `h1,
h2,
h3,
h4,
h5,
h6 {
  ${breakAfterAvoid ? "break-after: avoid;\n  " : ""}color: var(--oser-profile-text);
  font-family: ${headingFont};
  font-weight: ${headings.fontWeight ?? 700};
  line-height: ${headings.lineHeight ?? 1.2};
  margin: ${headings.marginBefore ?? "2em"} 0 ${headings.marginAfter ?? "0.55em"};
}

h1 {
  font-size: ${headings.h1Size ?? "2.25rem"};
  margin-top: 0;
}

h2 {
  font-size: ${headings.h2Size ?? "1.55rem"};
}

h3 {
  font-size: ${headings.h3Size ?? "1.25rem"};
}

h4,
h5,
h6 {
  font-size: ${headings.h4Size ?? "1rem"};
}`;
}

function blockCss(
  profile: LayoutProfile,
  paragraphSpacing: string,
  mutedColor: string,
  borderColor: string,
  print: PrintBehaviorSettings
): string {
  const blocks = profile.blocks ?? {};
  const avoidBreak = blocks.blockquoteBreakInsideAvoid ?? print.avoidBreakInsideBlocks ?? true;

  return `p,
blockquote,
ul,
ol,
pre,
figure,
table {
  margin: 0 0 ${paragraphSpacing};
}

p,
li {
  orphans: ${print.orphans ?? 3};
  widows: ${print.widows ?? 3};
}

blockquote {
  ${avoidBreak ? "break-inside: avoid;\n  " : ""}border-left: ${blocks.blockquoteBorder ?? `0.2rem solid ${borderColor}`};
  color: ${blocks.blockquoteColor ?? mutedColor};
  padding-left: ${blocks.blockquotePaddingLeft ?? "1rem"};
}

blockquote > :last-child,
li > :last-child,
th > :last-child,
td > :last-child {
  margin-bottom: 0;
}

ul,
ol {
  padding-left: ${blocks.listIndent ?? "1.5rem"};
}

li + li {
  margin-top: ${blocks.listItemSpacing ?? "0.3rem"};
}

hr {
  border: 0;
  border-top: 1px solid var(--oser-profile-border);
  margin: ${blocks.sceneBreakSpacing ?? "2rem"} auto;
  width: ${blocks.sceneBreakWidth ?? "100%"};
}`;
}

function codeCss(borderColor: string): string {
  return `code {
  background: var(--oser-profile-code-bg);
  border-radius: 0.2rem;
  font-family: ${MONO_STACK};
  font-size: 0.88em;
  padding: 0.08em 0.25em;
}

pre {
  background: var(--oser-profile-code-bg);
  border: 1px solid ${borderColor};
  overflow-x: auto;
  padding: 1rem;
  white-space: pre-wrap;
}

pre code {
  background: transparent;
  border-radius: 0;
  display: block;
  line-height: 1.45;
  padding: 0;
}`;
}

function figureCss(profile: LayoutProfile, captionFont: string, mutedColor: string, print: PrintBehaviorSettings): string {
  const figures = profile.figures ?? {};
  const avoidBreak = figures.breakInsideAvoid ?? print.avoidBreakInsideBlocks ?? true;

  return `img {
  height: auto;
  max-width: ${figures.imageMaxWidth ?? "100%"};
}

figure {
  ${avoidBreak ? "break-inside: avoid;\n  " : ""}margin: ${figures.margin ?? "2rem 0"};
}

figure img {
  display: block;
}

figcaption {
  color: ${figures.captionColor ?? mutedColor};
  font-family: ${captionFont};
  font-size: ${figures.captionFontSize ?? "0.85rem"};
  line-height: 1.4;
  margin-top: ${figures.captionSpacing ?? "0.6rem"};
}`;
}

function tableCss(profile: LayoutProfile, tableFont: string, borderColor: string, print: PrintBehaviorSettings): string {
  const tables = profile.tables ?? {};
  const avoidBreak = tables.breakInsideAvoid ?? print.avoidBreakInsideBlocks ?? true;

  return `table {
  ${avoidBreak ? "break-inside: avoid;\n  " : ""}border-collapse: collapse;
  font-family: ${tableFont};
  font-size: ${tables.fontSize ?? "0.92rem"};
  width: ${tables.fullWidth === false ? "auto" : "100%"};
}

thead {
  display: table-header-group;
}

tr {
  break-inside: avoid;
}

th,
td {
  border-bottom: 1px solid ${borderColor};
  padding: ${tables.cellPadding ?? "0.55rem 0.7rem"};
  text-align: left;
  vertical-align: top;
}

th {
  font-weight: ${tables.headerFontWeight ?? 700};
}

th[data-align="center"],
td[data-align="center"] {
  text-align: center;
}

th[data-align="right"],
td[data-align="right"] {
  text-align: right;
}`;
}

function printCss(profile: LayoutProfile, print: PrintBehaviorSettings): string {
  if (print.enabled === false) {
    return "";
  }

  const printBackground = print.printBackground ? "\n    print-color-adjust: exact;\n    -webkit-print-color-adjust: exact;" : "";

  return `@media print {
  html {
    font-size: ${profile.typography.baseFontSize};${printBackground}
  }

  main {
    max-width: none;
    padding: 0;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  li {
    orphans: ${print.orphans ?? 3};
    widows: ${print.widows ?? 3};
  }

  a {
    color: var(--oser-profile-text);
  }
}`;
}

export const defaultLayoutProfile: LayoutProfile = {
  schemaVersion: "oser.layout-profile/v0",
  id: "default-editorial",
  name: "Default Editorial",
  page: { size: "Letter" },
  margins: { top: "0.85in", right: "0.75in", bottom: "0.85in", left: "0.75in" },
  typography: {
    bodyFontFamily: SERIF_STACK,
    headingFontFamily: SYSTEM_FONT_STACK,
    baseFontSize: "11pt",
    lineHeight: 1.45,
    maxWidth: "42rem"
  },
  print: { enabled: true, breakHeadingsAfterAvoid: true, avoidBreakInsideBlocks: true, widows: 3, orphans: 3 }
};
