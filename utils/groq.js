import axios from 'axios';
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const getAIResponse = async (messages, transactionData) => {
  try {
    const systemMessage = {
      role: 'system',
      content: `You are a financial AI assistant helping users analyze their spending patterns and provide financial advice. Use Only Indian Rupees as currency. 
                Current transaction data: ${JSON.stringify(transactionData)}`
    };

    const response = await axios.post(GROQ_API_URL, {
      model: 'llama3-70b-8192',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1024,
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to get AI response');
  }
};

export const analyzeTransactions = async (transactions) => {
  try {
    const response = await axios.post(GROQ_API_URL, {
      model: 'llama3-70b-8192',
      messages: [{
        role: 'system',
        content: 'Analyze the following transaction data and provide insights.'
      }, {
        role: 'user',
        content: JSON.stringify(transactions)
      }],
      temperature: 0.7,
      max_tokens: 4096
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to analyze transactions');
  }
};