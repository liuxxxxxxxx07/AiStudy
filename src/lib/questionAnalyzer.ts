export interface QuestionAnalysis {
  subject: string;
  course: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
}

export interface SimilarQuestion {
  question: string;
  answer: string;
}

const COURSE_KEYWORDS: Record<string, string[]> = {
  "高等数学": ["微积分", "导数", "积分", "极限", "微分方程", "泰勒", "拉格朗日", "定积分", "不定积分"],
  "线性代数": ["矩阵", "向量", "行列式", "特征值", "线性方程组", "正交", "秩"],
  "概率统计": ["概率", "统计", "期望", "方差", "正态分布", "贝叶斯", "假设检验"],
  "物理学": ["牛顿", "力学", "电磁", "光学", "热力学", "量子", "相对论", "速度", "加速度", "力"],
  "化学": ["化学反应", "分子", "原子", "元素", "化合价", "pH", "氧化还原"],
  "计算机科学": ["算法", "数据结构", "时间复杂度", "排序", "二叉树", "图", "递归", "编程"],
  "英语": ["grammar", "vocabulary", "reading", "writing", "tense", "preposition"],
};

const STEM_SUBJECTS = ["数学", "物理", "化学", "生物", "计算机", "工程", "统计"];

// Try to match based on keywords first (no API cost)
function localAnalysis(text: string): QuestionAnalysis | null {
  const lower = text.toLowerCase();
  const matchedCourses: string[] = [];

  for (const [course, keywords] of Object.entries(COURSE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matchedCourses.push(course);
    }
  }

  if (matchedCourses.length === 0) return null;

  const course = matchedCourses[0];
  let subject = "其他";
  if (["高等数学", "线性代数", "概率统计"].includes(course)) subject = "数学";
  else if (["物理学"].includes(course)) subject = "物理";
  else if (["化学"].includes(course)) subject = "化学";
  else if (["计算机科学"].includes(course)) subject = "计算机";

  const tags = matchedCourses;
  const difficulty: "easy" | "medium" | "hard" = text.length > 100 ? "hard" : text.length > 50 ? "medium" : "easy";

  return { subject, course, tags, difficulty };
}

export async function analyzeQuestion(text: string): Promise<QuestionAnalysis> {
  const local = localAnalysis(text);
  if (local) return local;

  // Fallback: Use Puter AI for analysis
  try {
    const prompt = `Analyze this STEM question and return a JSON object with:
{
  "subject": "one of: 数学, 物理, 化学, 生物, 计算机, 工程, 其他",
  "course": "the specific course name in Chinese",
  "tags": ["tag1", "tag2"],
  "difficulty": "easy|medium|hard"
}
Question: ${text.slice(0, 500)}
Return ONLY valid JSON, no other text.`;

    const res = await puter.ai.chat(prompt, { model: "gpt-5.4-nano" });
    const parsed = typeof res === "string" ? JSON.parse(res) : 
      typeof res.message?.content === "string" ? JSON.parse(res.message.content) : 
      JSON.parse(res.message?.content?.[0]?.text || "{}");
    
    return {
      subject: parsed.subject || "其他",
      course: parsed.course || "通用",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      difficulty: parsed.difficulty || "medium",
    };
  } catch {
    return { subject: "其他", course: "通用", tags: [], difficulty: "medium" };
  }
}

export async function generateSimilarQuestions(
  question: string,
  answer: string,
  count: number = 3
): Promise<SimilarQuestion[]> {
  try {
    const prompt = `You are a STEM tutor. Based on this question and answer, generate ${count} similar practice questions with answers.

Original question: ${question.slice(0, 300)}
Original answer: ${answer.slice(0, 500)}

Return a JSON array of objects with "question" and "answer" fields. Make the questions different but testing the same concept.
Return ONLY valid JSON array, no other text.`;

    const res = await puter.ai.chat(prompt, { model: "gpt-5.4-nano" });
    const text = typeof res === "string" ? res : res.message?.content?.[0]?.text || res.message?.content || "[]";
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.slice(0, count) : [];
  } catch {
    return [];
  }
}
