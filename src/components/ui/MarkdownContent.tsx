"use client";

import React from "react";

/**
 * Strips raw Markdown markers and citation brackets so table/card snippets
 * render cleanly in compact single-line UI surfaces.
 */
export function stripMarkdownInline(text: string): string {
  if (!text) return "";
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, "$1")
    .replace(/`([^`]+?)`/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

interface HighlightPiece {
  text: string;
  highlighted: boolean;
}

function splitByHighlights(text: string, highlightQuotes?: string[]): HighlightPiece[] {
  const quotes = (highlightQuotes ?? [])
    .map((q) => q.trim())
    .filter((q) => q.length >= 4);

  if (quotes.length === 0) {
    return [{ text, highlighted: false }];
  }

  // Locate non-overlapping case-exact matches in priority of longer quotes first
  const sortedQuotes = [...new Set(quotes)].sort((a, b) => b.length - a.length);
  const ranges: Array<{ start: number; end: number }> = [];

  for (const quote of sortedQuotes) {
    let searchFrom = 0;
    while (searchFrom < text.length) {
      const idx = text.indexOf(quote, searchFrom);
      if (idx === -1) break;
      const end = idx + quote.length;
      const overlaps = ranges.some((r) => !(end <= r.start || idx >= r.end));
      if (!overlaps) {
        ranges.push({ start: idx, end });
      }
      searchFrom = end;
    }
  }

  if (ranges.length === 0) {
    return [{ text, highlighted: false }];
  }

  ranges.sort((a, b) => a.start - b.start);
  const pieces: HighlightPiece[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) {
      pieces.push({ text: text.slice(cursor, r.start), highlighted: false });
    }
    pieces.push({ text: text.slice(r.start, r.end), highlighted: true });
    cursor = r.end;
  }
  if (cursor < text.length) {
    pieces.push({ text: text.slice(cursor), highlighted: false });
  }
  return pieces;
}

const INLINE_TOKEN_RE =
  /(\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*\n]+\*(?!\*)|`[^`\n]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\[\d{1,3}\])/g;

function renderInlineTokens(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(INLINE_TOKEN_RE);
  return parts
    .filter((part) => part.length > 0)
    .map((part, idx) => {
      const key = `${keyPrefix}-${idx}`;
      if (
        (part.startsWith("**") && part.endsWith("**") && part.length > 4) ||
        (part.startsWith("__") && part.endsWith("__") && part.length > 4)
      ) {
        return (
          <strong key={key} className="font-semibold text-[#111111]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <em key={key} className="italic text-[#262626]">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code
            key={key}
            className="rounded-[4px] bg-[#F5F5F5] px-1.5 py-0.5 font-mono text-[12px] text-[#111111]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("[") && part.includes("](http")) {
        const match = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(part);
        if (match) {
          return (
            <a
              key={key}
              href={match[2]}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#E9501F] underline underline-offset-2 hover:text-[#111111]"
            >
              {match[1]}
            </a>
          );
        }
      }
      if (/^\[\d{1,3}\]$/.test(part)) {
        return (
          <sup
            key={key}
            className="ml-0.5 inline-flex items-center rounded-[4px] bg-[#F5F5F5] px-1 py-0 text-[10px] font-medium text-[#737373] align-super"
          >
            {part.slice(1, -1)}
          </sup>
        );
      }
      return <React.Fragment key={key}>{part}</React.Fragment>;
    });
}

/**
 * Renders inline Markdown formatting (**bold**, `code`, links, [n] citations)
 * while preserving highlighted evidence quotes.
 */
export function InlineMarkdown({
  text,
  highlightQuotes,
}: {
  text: string;
  highlightQuotes?: string[];
}) {
  const pieces = splitByHighlights(text, highlightQuotes);
  return (
    <>
      {pieces.map((piece, idx) => {
        const rendered = renderInlineTokens(piece.text, `seg-${idx}`);
        if (!piece.highlighted) {
          return <React.Fragment key={`p-${idx}`}>{rendered}</React.Fragment>;
        }
        return (
          <mark
            key={`p-${idx}`}
            className="rounded-[5px] bg-[#FFF3EE] px-1 py-0.5 font-medium text-[#111111] ring-1 ring-[#F9C8B8]"
          >
            {rendered}
          </mark>
        );
      })}
    </>
  );
}

function isTableRowLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.includes("|", 1);
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  if (!trimmed) return false;
  return trimmed.split("|").every((cell) => /^:?-{2,}:?$/.test(cell.trim()));
}

function parsePipeCells(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

/**
 * Structured block Markdown renderer for Source Pool / Evidence drawers:
 * renders headings, GFM pipe tables, bullet/numbered lists, blockquotes,
 * bold emphasis, citations, and highlighted evidence spans cleanly.
 */
export function MarkdownDocument({
  content,
  highlightQuotes,
}: {
  content: string;
  highlightQuotes?: string[];
}) {
  if (!content.trim()) {
    return null;
  }

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={`hr-${i}`} className="my-4 border-[#E5E5E5]" />);
      i += 1;
      continue;
    }

    // Headings (# .. ####)
    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const body = headingMatch[2];
      if (level === 1) {
        blocks.push(
          <h2
            key={`h-${i}`}
            className="mt-5 mb-2.5 border-b border-[#E5E5E5] pb-1.5 text-[16px] font-bold tracking-tight text-[#111111] first:mt-0"
          >
            <InlineMarkdown text={body} highlightQuotes={highlightQuotes} />
          </h2>
        );
      } else if (level === 2) {
        blocks.push(
          <h3
            key={`h-${i}`}
            className="mt-5 mb-2 flex items-center gap-2 border-b border-[#F0F0F0] pb-1.5 text-[14px] font-bold text-[#111111] first:mt-0"
          >
            <span className="h-3.5 w-1 shrink-0 rounded-full bg-[#E9501F]" />
            <span>
              <InlineMarkdown text={body} highlightQuotes={highlightQuotes} />
            </span>
          </h3>
        );
      } else {
        blocks.push(
          <h4
            key={`h-${i}`}
            className="mt-4 mb-1.5 text-[13px] font-semibold text-[#111111] first:mt-0"
          >
            <InlineMarkdown text={body} highlightQuotes={highlightQuotes} />
          </h4>
        );
      }
      i += 1;
      continue;
    }

    // GFM Table
    if (
      isTableRowLine(trimmed) &&
      i + 1 < lines.length &&
      isTableSeparatorLine(lines[i + 1])
    ) {
      const headers = parsePipeCells(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRowLine(lines[i])) {
        rows.push(parsePipeCells(lines[i]));
        i += 1;
      }
      blocks.push(
        <div
          key={`tbl-${i}`}
          className="my-3 overflow-x-auto rounded-[8px] border border-[#E5E5E5] bg-white"
        >
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#111111]">
              <tr>
                {headers.map((h, hIdx) => (
                  <th
                    key={hIdx}
                    className="min-w-[110px] px-3 py-2 font-semibold whitespace-nowrap"
                  >
                    <InlineMarkdown text={h} highlightQuotes={highlightQuotes} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#FAFAFA]">
                  {headers.map((_, cIdx) => (
                    <td
                      key={cIdx}
                      className={`min-w-[110px] px-3 py-2 align-top leading-relaxed ${
                        cIdx === 0
                          ? "font-medium text-[#111111]"
                          : "text-[#4A4A4A]"
                      }`}
                    >
                      <InlineMarkdown
                        text={row[cIdx] ?? "-"}
                        highlightQuotes={highlightQuotes}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(
        <blockquote
          key={`bq-${i}`}
          className="my-3 rounded-r-[8px] border-l-[3px] border-[#111111] bg-[#FAFAFA] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#262626]"
        >
          <InlineMarkdown
            text={quoteLines.join(" ")}
            highlightQuotes={highlightQuotes}
          />
        </blockquote>
      );
      continue;
    }

    // Unordered list (- , * , • )
    if (/^[-*•]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*•]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="my-2.5 space-y-2 pl-1">
          {listItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#262626]"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E9501F]" />
              <span className="min-w-0 flex-1">
                <InlineMarkdown text={item} highlightQuotes={highlightQuotes} />
              </span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list (1. 2. ...)
    if (/^\d+\.\s+/.test(trimmed)) {
      const orderedItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        orderedItems.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="my-2.5 space-y-2 pl-1">
          {orderedItems.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#262626]"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[#F5F5F5] font-mono text-[11px] font-semibold text-[#111111]">
                {idx + 1}
              </span>
              <span className="min-w-0 flex-1">
                <InlineMarkdown text={item} highlightQuotes={highlightQuotes} />
              </span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph (consume consecutive non-special lines)
    const paraLines: string[] = [];
    while (i < lines.length) {
      const cur = lines[i].trim();
      if (
        !cur ||
        /^(#{1,4})\s+/.test(cur) ||
        /^[-*•]\s+/.test(cur) ||
        /^\d+\.\s+/.test(cur) ||
        cur.startsWith(">") ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(cur) ||
        (isTableRowLine(cur) &&
          i + 1 < lines.length &&
          isTableSeparatorLine(lines[i + 1]))
      ) {
        break;
      }
      paraLines.push(cur);
      i += 1;
    }
    blocks.push(
      <p key={`p-${i}`} className="my-2 text-[13px] leading-7 text-[#111111] first:mt-0">
        <InlineMarkdown
          text={paraLines.join(" ")}
          highlightQuotes={highlightQuotes}
        />
      </p>
    );
  }

  return <div className="space-y-1">{blocks}</div>;
}
