export interface ExtractedContent {
  title: string;
  text: string;
  theorems: string[];
  definitions: string[];
  formulas: string[];
  tags: string[];
  category: "theorem" | "definition" | "formula" | "note" | "concept";
}

// Pattern for identifying theorems/definitions/formulas in Chinese and English
const THEOREM_PATTERNS = [
  /定理[：:\s]*([^。\n]+(?:。|$))/gi,
  /Theorem[：:\s]*([^.\n]+(?:\.|$))/gi,
  /性质[：:\s]*([^。\n]+(?:。|$))/gi,
  /引理[：:\s]*([^。\n]+(?:。|$))/gi,
  /推论[：:\s]*([^。\n]+(?:。|$))/gi,
  /Lemma[：:\s]*([^.\n]+(?:\.|$))/gi,
  /Corollary[：:\s]*([^.\n]+(?:\.|$))/gi,
];

const DEFINITION_PATTERNS = [
  /定义[：:\s]*([^。\n]+(?:。|$))/gi,
  /Definition[：:\s]*([^.\n]+(?:\.|$))/gi,
  /概念[：:\s]*([^。\n]+(?:。|$))/gi,
  /称为[^。\n]*/gi,
  /叫做[^。\n]*/gi,
  /是指[^。\n]*/gi,
];

const FORMULA_PATTERNS = [
  /\$\$([\s\S]*?)\$\$/g,
  /\$([^$\n]+)\$/g,
  /\\\[([\s\S]*?)\\\]/g,
  /\\\(([\s\S]*?)\\\)/g,
];

export function parseHtmlContent(html: string): ExtractedContent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const title =
    doc.querySelector("title")?.textContent ||
    doc.querySelector("h1")?.textContent ||
    "Untitled";

  const text = doc.body?.textContent || "";

  return extractFromText(text, title);
}

export async function extractFromPptx(arrayBuffer: ArrayBuffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideTexts: string[] = [];
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || "0");
      return numA - numB;
    });
  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async("string");
    const texts: string[] = [];
    const regex = /<a:t[^>]*>([^<]*)<\/a:t>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const t = match[1].trim();
      if (t) texts.push(t);
    }
    const mathRegex = /<m:t[^>]*>([^<]*)<\/m:t>/g;
    while ((match = mathRegex.exec(xml)) !== null) {
      const t = match[1].trim();
      if (t) texts.push(t);
    }
    if (texts.length > 0) slideTexts.push(texts.join("\n"));
  }
  return slideTexts.join("\n\n---\n\n");
}

export function extractMathFromHtml(html: string): string[] {
  const formulas: string[] = [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const mathElements = doc.querySelectorAll(".math, .formula, [class*='math'], mjx-container");
  mathElements.forEach((el) => {
    const t = el.textContent?.trim();
    if (t) formulas.push(t);
  });
  return formulas;
}

function extractFromText(text: string, title: string): ExtractedContent {
  const theorems: string[] = [];
  const definitions: string[] = [];
  const formulas: string[] = [];

  for (const pattern of THEOREM_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const t = m[1]?.trim();
      if (t && !theorems.includes(t)) theorems.push(t);
    }
  }

  for (const pattern of DEFINITION_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const t = m[1]?.trim() || m[0]?.trim();
      if (t && !definitions.includes(t)) definitions.push(t);
    }
  }

  for (const pattern of FORMULA_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      const t = m[1]?.trim();
      if (t && !formulas.includes(t)) formulas.push(t);
    }
  }

  const allTags = [...theorems, ...definitions, ...formulas]
    .flatMap((s) => s.split(/[\s,，、]+/))
    .filter((s) => s.length > 1)
    .slice(0, 10);

  const hasTheorem = theorems.length > 0;
  const hasDefinition = definitions.length > 0;
  const hasFormula = formulas.length > 0;

  let category: ExtractedContent["category"] = "note";
  if (hasTheorem && hasFormula) category = "theorem";
  else if (hasTheorem) category = "theorem";
  else if (hasDefinition) category = "definition";
  else if (hasFormula) category = "formula";
  else category = "concept";

  return {
    title,
    text: text.slice(0, 5000),
    theorems,
    definitions,
    formulas,
    tags: [...new Set(allTags)].slice(0, 8),
    category,
  };
}

export async function analyzeWithAI(text: string): Promise<ExtractedContent | null> {
  try {
    const prompt = `Analyze this educational content and extract structured information.

Content:
${text.slice(0, 2000)}

Return a JSON object with:
{
  "title": "content title",
  "theorems": ["list of theorems found"],
  "definitions": ["list of definitions found"],
  "formulas": ["list of mathematical formulas found"],
  "tags": ["relevant topic tags"],
  "category": "theorem" or "definition" or "formula" or "note" or "concept"
}

Return ONLY valid JSON, no other text.`;

    const res = await puter.ai.chat(prompt, { model: "gpt-5.4-nano" });
    const t = typeof res === "string" ? res : res.message?.content?.[0]?.text || res.message?.content || "{}";
    const parsed = JSON.parse(t);
    return {
      title: parsed.title || "Untitled",
      text: text.slice(0, 5000),
      theorems: Array.isArray(parsed.theorems) ? parsed.theorems : [],
      definitions: Array.isArray(parsed.definitions) ? parsed.definitions : [],
      formulas: Array.isArray(parsed.formulas) ? parsed.formulas : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      category: parsed.category || "note",
    };
  } catch {
    return null;
  }
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}