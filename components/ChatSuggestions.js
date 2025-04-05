import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Chip } from 'react-native-paper';

const ChatSuggestions = ({ visible, onSuggestionPress }) => {
  if (!visible) return null;

  const suggestions = [
    'What are my top spending categories?',
    'How much did I spend last month?',
    'Where can I save money?',
    'Give me financial advice based on my spending',
    'Show me my spending trends',
  ];

  return (
    <View style={styles.suggestionsContainer}>
      <Text style={styles.suggestionsTitle}>Suggested questions:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
        {suggestions.map((suggestion, index) => (
          <Chip
            key={index}
            style={styles.suggestionChip}
            onPress={() => onSuggestionPress(suggestion)}
            mode="outlined"
          >
            {suggestion}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  suggestionsContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  suggestionsTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  suggestionChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default ChatSuggestions;