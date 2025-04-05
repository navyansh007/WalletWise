import { useState, useCallback } from 'react';
import { saveTransaction as saveTransactionToDb, getTransactions as getTransactionsFromDb } from '../utils/transactionUtils';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactionsFromDb();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTransaction = useCallback(async (transaction) => {
    try {
      setError(null);
      const result = await saveTransactionToDb(transaction);
      await fetchTransactions(); // Refresh the list after saving
      return result;
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError('Failed to save transaction');
      throw err;
    }
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    saveTransaction,
  };
};