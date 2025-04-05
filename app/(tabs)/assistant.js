import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  Banner,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

import { getAIResponse, analyzeTransactions } from '../../utils/groq';
import { getTransactions, getTransactionsByCategory, getMonthlySpending } from '../../utils/transactionUtils';
import MessageBubble from '../../components/MessageBubble';
import ChatSuggestions from '../../components/ChatSuggestions';

export default function AIAssistantScreen() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your WalletWise AI assistant. How can I help you with your finances today?' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollViewRef = useRef();

  // Load transaction data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadTransactionData();
      return () => {};
    }, [])
  );

  const loadTransactionData = async () => {
    try {
      const transactions = await getTransactions();
      const categoriesData = await getTransactionsByCategory();
      const monthlyData = await getMonthlySpending();
      
      setTransactionData({
        transactions,
        categories: categoriesData,
        monthlySpending: monthlyData,
      });
    } catch (error) {
      console.error('Error loading transaction data:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputText,
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      // Prepare conversation history for AI
      const conversationHistory = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

      // Get AI response
      const response = await getAIResponse(
        [...conversationHistory, userMessage],
        transactionData
      );

      // Add AI response to messages
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: response },
      ]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setInputText(suggestion);
  };

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  const renderInitialInsights = () => {
    if (!transactionData || messages.length > 1 || !showSuggestions) return null;
    
    // Only show if we have transactions
    if (!transactionData.transactions || transactionData.transactions.length === 0) return null;
    
    return (
      <Card style={styles.insightsCard}>
        <Card.Title title="Initial Financial Insights" />
        <Card.Content>
          <Paragraph>
            Based on your {transactionData.transactions.length} transactions, here are some quick insights:
          </Paragraph>
          
          {transactionData.categories && transactionData.categories.length > 0 && (
            <>
              <Title style={styles.insightTitle}>Top Spending Categories:</Title>
              {transactionData.categories.slice(0, 3).map((category, index) => (
                <View key={index} style={styles.categoryRow}>
                  <Text>{category.name}</Text>
                  <Text>₹{parseFloat(category.amount).toFixed(2)}</Text>
                </View>
              ))}
            </>
          )}
          
          <Button 
            mode="contained" 
            style={styles.insightButton}
            onPress={() => {
              handleSuggestionPress('Give me detailed financial insights based on my spending patterns');
            }}
          >
            Get Detailed Insights
          </Button>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Banner
          visible={!transactionData || transactionData.transactions.length === 0}
          actions={[
            {
              label: 'Got it',
              onPress: () => console.log('Banner dismissed'),
            },
          ]}
          icon="information"
        >
          Make transactions in the Payments tab to get personalized financial insights.
        </Banner>
        
        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.messagesContainer}
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator animating={true} color="#6200ee" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
            
            {renderInitialInsights()}
            
            {/* Add extra padding at the bottom to ensure content is not hidden */}
            <View style={styles.bottomPadding} />
          </ScrollView>
          
          {showSuggestions && (
            <ChatSuggestions
              visible={showSuggestions}
              onSuggestionPress={handleSuggestionPress}
            />
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              style={styles.input}
              placeholder="Ask about your finances..."
              mode="outlined"
              multiline
              maxHeight={100}
              blurOnSubmit={false}
              right={
                <TextInput.Icon
                  icon="send"
                  onPress={handleSendMessage}
                  disabled={isLoading || !inputText.trim()}
                />
              }
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  inputContainer: {
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
    // Add elevation and shadow to make it stand out
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  input: {
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6200ee',
  },
  insightsCard: {
    marginVertical: 16,
  },
  insightTitle: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  insightButton: {
    marginTop: 16,
  },
  bottomPadding: {
    height: 120, // Add extra padding at the bottom
  },
});