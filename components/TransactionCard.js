import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';

const TransactionCard = ({ transaction }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.transactionHeader}>
          <Title>₹{parseFloat(transaction.amount).toFixed(2)}</Title>
          <Chip icon="tag">{transaction.category}</Chip>
        </View>
        <Paragraph>To: {transaction.payee} ({transaction.upi_id})</Paragraph>
        {transaction.notes && <Paragraph>Note: {transaction.notes}</Paragraph>}
        <Paragraph style={styles.date}>{formatDate(transaction.transaction_date)}</Paragraph>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontStyle: 'italic',
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
});

export default TransactionCard;