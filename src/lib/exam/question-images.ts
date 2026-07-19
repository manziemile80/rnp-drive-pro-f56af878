// Maps a question number to the PDF page image that shows its road sign.
// The image bundles multiple signs and the full page context because the
// original PDF didn't isolate them per question.
const modules = import.meta.glob("@/assets/questions/page*.png.asset.json", {
  eager: true,
}) as Record<string, { default: { url: string } }>;

const pageUrl: Record<number, string> = {};
for (const [path, mod] of Object.entries(modules)) {
  const m = path.match(/page(\d+)\.png/);
  if (m) pageUrl[Number(m[1])] = mod.default.url;
}

// Question number -> PDF page (derived from the source PDF layout)
const questionToPage: Record<number, number> = {
  230: 63, 238: 67, 241: 68, 242: 68, 246: 70, 247: 70, 248: 71, 250: 71,
  252: 72, 257: 74, 258: 75, 261: 76, 274: 81, 391: 128, 394: 131, 403: 135,
  404: 135, 407: 136, 408: 137, 409: 137, 411: 138, 412: 139, 414: 139,
  415: 140, 416: 140, 417: 141, 418: 141, 420: 142, 421: 142, 423: 143,
  426: 144, 428: 145, 429: 145,
};

export function getQuestionImage(qid: number): string | null {
  const page = questionToPage[qid];
  if (!page) return null;
  return pageUrl[page] ?? null;
}