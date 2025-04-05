import axios from 'axios';

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';
const HUGGINGFACE_API_KEY = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;

/**
 * Generate embeddings using HuggingFace's API
 * @param {string} text - The text to generate an embedding for
 * @returns {Promise<number[]>} - A vector embedding of the text
 */
export const generateEmbedding = async (text) => {
  try {
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // The response is an array of arrays (batch of embeddings)
    // Since we're only sending one text, we get the first (and only) embedding
    return response.data[0];
  } catch (error) {
    console.error('HuggingFace API Error:', error.response?.data || error.message);
    throw new Error('Failed to generate embedding');
  }
};

/**
 * Calculate the cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Similarity score between 0 and 1
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
};

/**
 * Search through a list of transactions for those semantically similar to a query
 * @param {string} query - The search query
 * @param {Array} transactions - List of transactions with embeddings
 * @param {number} threshold - Minimum similarity score (0-1)
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} - Sorted array of transactions with similarity scores
 */
export const searchTransactionsLocally = async (query, transactions, threshold = 0.6, limit = 5) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Filter transactions that have embeddings
    const transactionsWithEmbeddings = transactions.filter(tx => tx.embedding);

    // Calculate similarity for each transaction
    const results = transactionsWithEmbeddings.map(tx => {
      const similarity = cosineSimilarity(queryEmbedding, tx.embedding);
      return { ...tx, similarity };
    });

    // Filter by threshold and sort by similarity (descending)
    return results
      .filter(tx => tx.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error('Error searching transactions locally:', error);
    return [];
  }
};

export default {
  generateEmbedding,
  cosineSimilarity,
  searchTransactionsLocally
};