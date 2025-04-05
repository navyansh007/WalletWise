import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar } from 'react-native-paper';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <View 
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
      ]}
    >
      <View style={styles.avatarContainer}>
        {isUser ? (
          <Avatar.Icon size={40} icon="account" />
        ) : (
          <Avatar.Icon size={40} icon="robot" style={styles.assistantAvatar} />
        )}
      </View>
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={isUser ? styles.userMessageText : styles.assistantMessageText}>
          {message.content}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '100%',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    marginLeft: 50,
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
    marginRight: 50,
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  assistantAvatar: {
    backgroundColor: '#6200ee',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#6200ee',
    borderBottomRightRadius: 4,
    marginLeft: 8,
  },
  assistantBubble: {
    backgroundColor: '#e1e1e1',
    borderBottomLeftRadius: 4,
    marginRight: 8,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#000',
  },
});

export default MessageBubble;