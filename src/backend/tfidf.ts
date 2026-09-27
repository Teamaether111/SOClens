/**
 * Local TF-IDF Vectorizer & Cosine Similarity Engine
 *
 * Implements scikit-learn equivalent TF-IDF vectorization and pairwise cosine similarity
 * running purely locally on each CSE's submitted investigation notes.
 * No pretrained model, no external NLP service.
 */

export class LocalTfidfVectorizer {
  private vocabulary: Map<string, number> = new Map();
  private idf: number[] = [];
  private stopWords: Set<string> = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could',
    'did', 'do', 'does', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has',
    'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into',
    'is', 'it', 'its', 'itself', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
    'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so',
    'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
    'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'were', 'weren\'t',
    'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'won\'t', 'would', 'you', 'your', 'yours'
  ]);

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2 && !this.stopWords.has(token));
  }

  /**
   * Fit on documents and compute IDF
   */
  public fit(documents: string[]): this {
    this.vocabulary.clear();
    const docCount = documents.length;
    if (docCount === 0) return this;

    // Document frequency per term
    const dfMap: Map<string, number> = new Map();

    for (const doc of documents) {
      const tokens = new Set(this.tokenize(doc));
      for (const token of tokens) {
        dfMap.set(token, (dfMap.get(token) || 0) + 1);
      }
    }

    // Assign vocab index
    let idx = 0;
    for (const [term] of dfMap.entries()) {
      this.vocabulary.set(term, idx++);
    }

    // Scikit-learn smooth_idf: idf(t) = log((1 + n) / (1 + df(t))) + 1
    this.idf = new Array(this.vocabulary.size);
    for (const [term, index] of this.vocabulary.entries()) {
      const df = dfMap.get(term) || 1;
      this.idf[index] = Math.log((1 + docCount) / (1 + df)) + 1;
    }

    return this;
  }

  /**
   * Transform document into TF-IDF normalized vector
   */
  public transform(document: string): number[] {
    const vector = new Array(this.vocabulary.size).fill(0);
    if (this.vocabulary.size === 0) return vector;

    const tokens = this.tokenize(document);
    if (tokens.length === 0) return vector;

    // Term Frequency (raw count)
    for (const token of tokens) {
      const idx = this.vocabulary.get(token);
      if (idx !== undefined) {
        vector[idx] += 1;
      }
    }

    // Standard Scikit-learn TF-IDF: tf * idf
    for (let i = 0; i < vector.length; i++) {
      if (vector[i] > 0) {
        vector[i] = vector[i] * this.idf[i];
      }
    }

    // L2 Normalization (Euclidean norm)
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Fit and transform in one step
   */
  public fitTransform(documents: string[]): number[][] {
    this.fit(documents);
    return documents.map(doc => this.transform(doc));
  }
}

/**
 * Computes cosine similarity between two normalized vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

/**
 * Computes mean pairwise cosine similarity across all documents of a CSE
 */
export function computeMeanPairwiseSimilarity(documents: string[]): {
  meanSimilarity: number;
  maxSimilarity: number;
  pairwiseMatrix: number[][];
  sampleFlaggedPairs: { docIdx1: number; docIdx2: number; similarity: number }[];
} {
  const filteredDocs = documents.filter(d => d && d.trim().length > 0);
  if (filteredDocs.length < 2) {
    return {
      meanSimilarity: 0,
      maxSimilarity: 0,
      pairwiseMatrix: [],
      sampleFlaggedPairs: []
    };
  }

  const vectorizer = new LocalTfidfVectorizer();
  const vectors = vectorizer.fitTransform(filteredDocs);
  const n = vectors.length;

  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  let pairCount = 0;
  let totalSim = 0;
  let maxSim = 0;
  const samplePairs: { docIdx1: number; docIdx2: number; similarity: number }[] = [];

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0;
    for (let j = i + 1; j < n; j++) {
      const sim = cosineSimilarity(vectors[i], vectors[j]);
      matrix[i][j] = sim;
      matrix[j][i] = sim;
      totalSim += sim;
      pairCount++;
      if (sim > maxSim) maxSim = sim;

      if (sim >= 0.85 && samplePairs.length < 5) {
        samplePairs.push({ docIdx1: i, docIdx2: j, similarity: Number(sim.toFixed(3)) });
      }
    }
  }

  const meanSimilarity = pairCount > 0 ? totalSim / pairCount : 0;

  return {
    meanSimilarity: Number(meanSimilarity.toFixed(4)),
    maxSimilarity: Number(maxSim.toFixed(4)),
    pairwiseMatrix: matrix,
    sampleFlaggedPairs: samplePairs
  };
}
