/**
 * AI Context Builder
 *
 * Intelligently builds context for AI prompts by injecting relevant
 * reference materials while staying under token limits.
 *
 * This is critical for preventing hallucinations - the AI is given
 * authoritative sources to cite rather than making things up.
 */

import type { ChatMessage } from "@/types/ai-session";

// Reference data types
interface NotationEntry {
  id: string;
  notation: string;
  meaning: string;
  confusedWith?: string;
  trap?: string;
  examples?: string[];
  category: string;
  apUnit: number;
}

interface GoldenWord {
  term: string;
  definition: string;
  formalDefinition?: string;
  examples?: any[];
  commonMisconceptions?: string[];
  relatedTerms?: string[];
}

interface CommonMistake {
  id: string;
  mistake: string;
  correct: string;
  explanation: string;
  examples?: any[];
  severity: string;
}

interface ReferenceMaterial {
  notation: NotationEntry[];
  goldenWords: GoldenWord[];
  commonMistakes: CommonMistake[];
}

interface ContextBuildOptions {
  maxTokens?: number; // Maximum tokens for context
  prioritizeRecent?: boolean; // Prioritize recent conversation
  includeAllMistakes?: boolean; // Include all common mistakes
}

/**
 * Context Builder - Assembles relevant reference materials
 */
export class ContextBuilder {
  private static notationCache: NotationEntry[] | null = null;
  private static goldenWordsCache: Map<string, GoldenWord[]> | null = null;
  private static mistakesCache: Map<string, CommonMistake[]> | null = null;

  /**
   * Load notation table
   */
  private static async loadNotationTable(): Promise<NotationEntry[]> {
    if (this.notationCache) {
      return this.notationCache;
    }

    try {
      const response = await fetch("/data/reference/notation-table.json");
      const data = await response.json();
      this.notationCache = data.notations || [];
      return this.notationCache!; // Non-null assertion since we just set it
    } catch (error) {
      console.error("Failed to load notation table:", error);
      return [];
    }
  }

  /**
   * Load golden words (key terms)
   */
  private static async loadGoldenWords(): Promise<Map<string, GoldenWord[]>> {
    if (this.goldenWordsCache) {
      return this.goldenWordsCache;
    }

    try {
      const response = await fetch("/data/reference/golden-words.json");
      const data = await response.json();

      const cache = new Map<string, GoldenWord[]>();

      // Organize by category
      Object.entries(data.categories || {}).forEach(([category, catData]: [string, any]) => {
        cache.set(category, catData.words || []);
      });

      this.goldenWordsCache = cache;
      return cache;
    } catch (error) {
      console.error("Failed to load golden words:", error);
      return new Map();
    }
  }

  /**
   * Load common mistakes
   */
  private static async loadCommonMistakes(): Promise<Map<string, CommonMistake[]>> {
    if (this.mistakesCache) {
      return this.mistakesCache;
    }

    try {
      const response = await fetch("/data/reference/common-mistakes.json");
      const data = await response.json();

      const cache = new Map<string, CommonMistake[]>();

      // Organize by category
      Object.entries(data.categories || {}).forEach(([category, catData]: [string, any]) => {
        cache.set(category, catData.mistakes || []);
      });

      this.mistakesCache = cache;
      return cache;
    } catch (error) {
      console.error("Failed to load common mistakes:", error);
      return new Map();
    }
  }

  /**
   * Extract mathematical concepts from problem text
   */
  private static extractConcepts(text: string): {
    notation: string[];
    terms: string[];
    categories: Set<string>;
  } {
    const textLower = text.toLowerCase();

    // Detect notation patterns
    const notation: string[] = [];
    const notationPatterns = [
      { pattern: /f\(x\)|g\(x\)|h\(x\)/g, id: "func-notation" },
      { pattern: /f\s*∘\s*g|f\s*compose\s*g/gi, id: "composite-func" },
      { pattern: /f\^{?-1}?|inverse/gi, id: "inverse-func" },
      { pattern: /\\?sin\^{?-1}?|arcsin/gi, id: "inverse-sine" },
      { pattern: /\\?cos\^{?-1}?|arccos/gi, id: "inverse-cosine" },
      { pattern: /\\?tan\^{?-1}?|arctan/gi, id: "inverse-tangent" },
      { pattern: /\\ln|natural\s+log/gi, id: "natural-log" },
      { pattern: /\\log(?!_)|log\s*\(/gi, id: "common-log" },
      { pattern: /derivative|f'|dy\/dx/gi, id: "derivative-notation-prime" },
      { pattern: /\\lim|limit/gi, id: "limit-notation" },
      { pattern: /\|[^|]+\||absolute\s+value/g, id: "absolute-value" },
      { pattern: /\\sum|summation|sigma/gi, id: "summation" },
      { pattern: /factorial|!/g, id: "factorial" },
      { pattern: /\[[\d,\s]+\]|interval/g, id: "interval-closed" },
      { pattern: /parametric|x\s*=.*t.*y\s*=/gi, id: "parametric" },
      { pattern: /polar|r\s*=/gi, id: "polar" },
    ];

    notationPatterns.forEach(({ pattern, id }) => {
      if (pattern.test(text)) {
        notation.push(id);
      }
    });

    // Detect key terms
    const terms: string[] = [];
    const termPatterns = [
      "domain",
      "range",
      "function",
      "inverse",
      "one-to-one",
      "even function",
      "odd function",
      "continuous",
      "discontinuous",
      "radian",
      "degree",
      "period",
      "amplitude",
      "phase shift",
      "unit circle",
      "logarithm",
      "exponential",
      "growth",
      "decay",
      "limit",
      "derivative",
      "rate of change",
      "asymptote",
      "arithmetic sequence",
      "geometric sequence",
      "convergence",
      "divergence",
    ];

    termPatterns.forEach((term) => {
      if (textLower.includes(term)) {
        terms.push(term);
      }
    });

    // Detect categories
    const categories = new Set<string>();
    if (/(sin|cos|tan|trig)/i.test(text)) categories.add("trigonometry");
    if (/(log|ln|exp|e\^)/i.test(text)) categories.add("exponential");
    if (/(function|f\(|domain|range)/i.test(text)) categories.add("functions");
    if (/(limit|derivative|dy\/dx)/i.test(text)) categories.add("calculus");
    if (/(sequence|series|sum)/i.test(text)) categories.add("sequences");
    if (!categories.size) categories.add("algebra");

    return { notation, terms, categories };
  }

  /**
   * Build context from conversation history
   */
  private static extractConversationContext(
    messages: ChatMessage[]
  ): {
    mentionedNotation: Set<string>;
    mentionedTerms: Set<string>;
    studentErrors: string[];
  } {
    const mentionedNotation = new Set<string>();
    const mentionedTerms = new Set<string>();
    const studentErrors: string[] = [];

    messages.forEach((msg) => {
      const concepts = this.extractConcepts(msg.content);
      concepts.notation.forEach((n) => mentionedNotation.add(n));
      concepts.terms.forEach((t) => mentionedTerms.add(t));

      // Track citations to see what was already referenced
      msg.citations?.forEach((citation) => {
        if (citation.type === "notation") {
          mentionedNotation.add(citation.title);
        } else if (citation.type === "golden-word") {
          mentionedTerms.add(citation.title);
        }
      });
    });

    return {
      mentionedNotation,
      mentionedTerms,
      studentErrors,
    };
  }

  /**
   * Build context for AI prompt
   */
  static async buildContext(
    problemText: string,
    conversationHistory: ChatMessage[] = [],
    options: ContextBuildOptions = {}
  ): Promise<ReferenceMaterial> {
    const {
      maxTokens = 4000,
      includeAllMistakes = false,
    } = options;

    // Extract concepts from problem
    const problemConcepts = this.extractConcepts(problemText);

    // Extract conversation context
    const conversationContext = this.extractConversationContext(conversationHistory);

    // Load all reference materials
    const [notationTable, goldenWordsMap, mistakesMap] = await Promise.all([
      this.loadNotationTable(),
      this.loadGoldenWords(),
      this.loadCommonMistakes(),
    ]);

    // Build relevant notation list
    const relevantNotation: NotationEntry[] = [];
    const notationIds = new Set([
      ...problemConcepts.notation,
      ...conversationContext.mentionedNotation,
    ]);

    notationIds.forEach((id) => {
      const entry = notationTable.find((n) => n.id === id);
      if (entry) {
        relevantNotation.push(entry);
      }
    });

    // Add notation from relevant categories
    problemConcepts.categories.forEach((category) => {
      notationTable
        .filter((n) => n.category === category)
        .slice(0, 3) // Top 3 per category
        .forEach((n) => {
          if (!relevantNotation.find((rn) => rn.id === n.id)) {
            relevantNotation.push(n);
          }
        });
    });

    // Build relevant golden words list
    const relevantGoldenWords: GoldenWord[] = [];
    problemConcepts.categories.forEach((category) => {
      const words = goldenWordsMap.get(category) || [];
      words.forEach((word) => {
        if (
          problemConcepts.terms.includes(word.term) ||
          conversationContext.mentionedTerms.has(word.term)
        ) {
          relevantGoldenWords.push(word);
        }
      });
    });

    // If still need more context, add top terms from each category
    if (relevantGoldenWords.length < 5) {
      problemConcepts.categories.forEach((category) => {
        const words = goldenWordsMap.get(category) || [];
        words.slice(0, 2).forEach((word) => {
          if (!relevantGoldenWords.find((w) => w.term === word.term)) {
            relevantGoldenWords.push(word);
          }
        });
      });
    }

    // Build common mistakes list
    const relevantMistakes: CommonMistake[] = [];

    if (includeAllMistakes) {
      // Include high-severity mistakes from all relevant categories
      problemConcepts.categories.forEach((category) => {
        const mistakes = mistakesMap.get(category) || [];
        mistakes
          .filter((m) => m.severity === "high")
          .forEach((m) => relevantMistakes.push(m));
      });
    } else {
      // Only include most relevant mistakes
      problemConcepts.categories.forEach((category) => {
        const mistakes = mistakesMap.get(category) || [];
        mistakes.slice(0, 3).forEach((m) => relevantMistakes.push(m));
      });
    }

    // Estimate token usage and trim if necessary
    const estimatedTokens =
      relevantNotation.length * 100 +
      relevantGoldenWords.length * 150 +
      relevantMistakes.length * 120;

    if (estimatedTokens > maxTokens) {
      // Prioritize: keep all notation, trim golden words and mistakes
      const notationTokens = relevantNotation.length * 100;
      const remainingTokens = maxTokens - notationTokens;

      const goldenWordsToKeep = Math.floor(remainingTokens * 0.4 / 150);
      const mistakesToKeep = Math.floor(remainingTokens * 0.6 / 120);

      relevantGoldenWords.splice(goldenWordsToKeep);
      relevantMistakes.splice(mistakesToKeep);
    }

    return {
      notation: relevantNotation,
      goldenWords: relevantGoldenWords,
      commonMistakes: relevantMistakes,
    };
  }

  /**
   * Format context for prompt injection
   */
  static formatContextForPrompt(material: ReferenceMaterial): string {
    let context = "";

    // Format notation
    if (material.notation.length > 0) {
      context += "## Notation Reference\n\n";
      material.notation.forEach((n) => {
        context += `**${n.notation}** [ID: ${n.id}]\n`;
        context += `- Meaning: ${n.meaning}\n`;
        if (n.confusedWith) {
          context += `- Often confused with: ${n.confusedWith}\n`;
        }
        if (n.trap) {
          context += `- Common trap: ${n.trap}\n`;
        }
        if (n.examples && n.examples.length > 0) {
          context += `- Example: ${n.examples[0]}\n`;
        }
        context += "\n";
      });
    }

    // Format golden words
    if (material.goldenWords.length > 0) {
      context += "## Key Terms (Golden Words)\n\n";
      material.goldenWords.forEach((gw) => {
        context += `**${gw.term}**\n`;
        context += `- Definition: ${gw.definition}\n`;
        if (gw.commonMisconceptions && gw.commonMisconceptions.length > 0) {
          context += `- Common misconception: ${gw.commonMisconceptions[0]}\n`;
        }
        if (gw.relatedTerms && gw.relatedTerms.length > 0) {
          context += `- Related: ${gw.relatedTerms.join(", ")}\n`;
        }
        context += "\n";
      });
    }

    // Format common mistakes
    if (material.commonMistakes.length > 0) {
      context += "## Common Mistakes to Avoid\n\n";
      material.commonMistakes.forEach((m) => {
        context += `**${m.id}** [Severity: ${m.severity}]\n`;
        context += `- ❌ WRONG: ${m.mistake}\n`;
        context += `- ✓ CORRECT: ${m.correct}\n`;
        context += `- Why: ${m.explanation}\n`;
        context += "\n";
      });
    }

    return context;
  }

  /**
   * Get specific notation entry
   */
  static async getNotation(id: string): Promise<NotationEntry | null> {
    const table = await this.loadNotationTable();
    return table.find((n) => n.id === id) || null;
  }

  /**
   * Get specific golden word
   */
  static async getGoldenWord(term: string): Promise<GoldenWord | null> {
    const map = await this.loadGoldenWords();

    for (const words of map.values()) {
      const found = words.find((w) => w.term.toLowerCase() === term.toLowerCase());
      if (found) return found;
    }

    return null;
  }

  /**
   * Get specific common mistake
   */
  static async getCommonMistake(id: string): Promise<CommonMistake | null> {
    const map = await this.loadCommonMistakes();

    for (const mistakes of map.values()) {
      const found = mistakes.find((m) => m.id === id);
      if (found) return found;
    }

    return null;
  }

  /**
   * Clear caches (for testing or updates)
   */
  static clearCache(): void {
    this.notationCache = null;
    this.goldenWordsCache = null;
    this.mistakesCache = null;
  }
}
