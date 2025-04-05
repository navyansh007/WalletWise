import supabase from './supabase';

/**
 * Save a transaction to the database
 * @param {Object} transaction - Transaction data
 * @param {string} transaction.upiId - UPI ID of the receiver
 * @param {string} transaction.payee - Name of the receiver
 * @param {string} transaction.amount - Amount paid
 * @param {string} transaction.notes - Optional notes about the transaction
 * @param {string} transaction.category - Category of the transaction
 * @returns {Promise<Object>} - Saved transaction data
 */
export const saveTransaction = async (transaction) => {
  try {
    // Check required fields
    if (!transaction.amount || !transaction.payee || !transaction.upiId) {
      throw new Error('Missing required transaction fields');
    }

    // Log the transaction for debugging
    console.log('Transaction being saved to database:', transaction);
    
    // Make sure category has the correct case and exists
    const category = transaction.category || 'Food';
    console.log('Category being used:', category);

    // Prepare transaction data
    const transactionData = {
      amount: parseFloat(transaction.amount),
      payee: transaction.payee,
      upi_id: transaction.upiId,
      notes: transaction.notes || '',
      category: category, // Explicitly set the category
      transaction_date: new Date().toISOString(),
    };

    console.log('Final transaction data being sent to Supabase:', transactionData);

    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Transaction saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
};

/**
 * Get all transactions
 * @param {number} limit - Maximum number of transactions to retrieve
 * @returns {Promise<Array>} - List of transactions
 */
export const getTransactions = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

/**
 * Get transactions grouped by category
 * @returns {Promise<Array>} - List of categories with total amounts
 */
export const getTransactionsByCategory = async () => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('category, amount');

    if (error) throw error;
    
    // Group transactions by category
    const categories = {};
    data.forEach(transaction => {
      const category = transaction.category || 'Food';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += parseFloat(transaction.amount);
    });
    
    return Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount (descending)
  } catch (error) {
    console.error('Error fetching transactions by category:', error);
    throw error;
  }
};

/**
 * Get monthly spending data
 * @returns {Promise<Array>} - Monthly spending data
 */
export const getMonthlySpending = async () => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('transaction_date, amount');

    if (error) throw error;
    
    // Group transactions by month
    const months = {};
    data.forEach(transaction => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = 0;
      }
      months[monthKey] += parseFloat(transaction.amount);
    });
    
    return Object.entries(months)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month)); // Sort by month (ascending)
  } catch (error) {
    console.error('Error fetching monthly spending:', error);
    throw error;
  }
};

/**
 * Get spending by category for a specific time period
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Promise<Array>} - Category spending data
 */
export const getCategorySpendingByPeriod = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('category, amount')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (error) throw error;
    
    // Group transactions by category
    const categories = {};
    data.forEach(transaction => {
      const category = transaction.category || 'Food';
      if (!categories[category]) {
        categories[category] = 0;
      }
      categories[category] += parseFloat(transaction.amount);
    });
    
    return Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount (descending)
  } catch (error) {
    console.error('Error fetching category spending by period:', error);
    throw error;
  }
};

export default {
  saveTransaction,
  getTransactions,
  getTransactionsByCategory,
  getMonthlySpending,
  getCategorySpendingByPeriod
};