export type OserNodeType =
  | "document"
  | "section"
  | "heading"
  | "paragraph"
  | "text"
  | "emphasis"
  | "strong"
  | "inlineCode"
  | "link"
  | "horizontalRule"
  | "blockquote"
  | "list"
  | "listItem"
  | "codeBlock"
  | "table"
  | "tableRow"
  | "tableCell"
  | "figure"
  | "image";

export type OserDocument = {
  type: "document";
  version: "0.1";
  metadata: DocumentMetadata;
  children: BlockNode[];
  assets?: DocumentAssetRef[];
  sourceMap?: SourceMapEntry[];
};

export type DocumentMetadata = {
  title?: string;
  language?: string;
  createdAt?: string;
  sourceFormat?: string;
  [key: string]: string | number | boolean | undefined;
};

export type BlockNode =
  | SectionNode
  | HeadingNode
  | ParagraphNode
  | HorizontalRuleNode
  | BlockquoteNode
  | ListNode
  | CodeBlockNode
  | TableNode
  | FigureNode;

export type InlineNode = TextNode | EmphasisNode | StrongNode | InlineCodeNode | LinkNode | ImageNode;

export type SectionNode = {
  type: "section";
  id?: string;
  children: BlockNode[];
};

export type HeadingNode = {
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: InlineNode[];
};

export type ParagraphNode = {
  type: "paragraph";
  children: InlineNode[];
};

export type TextNode = {
  type: "text";
  value: string;
};

export type EmphasisNode = {
  type: "emphasis";
  children: InlineNode[];
};

export type StrongNode = {
  type: "strong";
  children: InlineNode[];
};

export type InlineCodeNode = {
  type: "inlineCode";
  value: string;
};

export type LinkNode = {
  type: "link";
  href: string;
  title?: string;
  children: InlineNode[];
};

export type HorizontalRuleNode = {
  type: "horizontalRule";
};

export type BlockquoteNode = {
  type: "blockquote";
  children: BlockNode[];
};

export type ListNode = {
  type: "list";
  ordered: boolean;
  start?: number;
  children: ListItemNode[];
};

export type ListItemNode = {
  type: "listItem";
  children: BlockNode[];
};

export type CodeBlockNode = {
  type: "codeBlock";
  value: string;
  language?: string;
};

export type TableNode = {
  type: "table";
  rows: TableRowNode[];
};

export type TableRowNode = {
  type: "tableRow";
  cells: TableCellNode[];
};

export type TableCellNode = {
  type: "tableCell";
  children: BlockNode[];
  header?: boolean;
};

export type FigureNode = {
  type: "figure";
  children: Array<ImageNode | ParagraphNode>;
  caption?: ParagraphNode;
};

export type ImageNode = {
  type: "image";
  src: string;
  alt?: string;
  title?: string;
};

export type DocumentAssetRef = {
  id: string;
  src: string;
  mediaType?: string;
  alt?: string;
};

export type SourceMapEntry = {
  nodePath: string;
  sourceFormat: string;
  sourceLocation?: {
    line?: number;
    column?: number;
    offset?: number;
  };
};
