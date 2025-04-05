import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Text, Button, Surface, Title, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Predefined categories map for display purposes
const categoryMap = {
  food: { name: 'Food', icon: 'food' },
  transportation: { name: 'Transportation', icon: 'bus' },
  shopping: { name: 'Shopping', icon: 'shopping' },
  entertainment: { name: 'Entertainment', icon: 'movie-open' },
  utilities: { name: 'Utilities', icon: 'lightbulb' },
  rent: { name: 'Rent', icon: 'home' },
  healthcare: { name: 'Healthcare', icon: 'medical-bag' },
  education: { name: 'Education', icon: 'school' },
  travel: { name: 'Travel', icon: 'airplane' },
  subscriptions: { name: 'Subscriptions', icon: 'youtube-subscription' },
  other: { name: 'Other', icon: 'tag' }
};

const PaymentConfirmationModal = ({ visible, paymentData, onConfirm, onDismiss }) => {
  if (!paymentData) {
    return null;
  }

  const category = categoryMap[paymentData.category] || categoryMap.other;

  return (
    <Modal 
      visible={visible} 
      onDismiss={onDismiss} 
      contentContainerStyle={styles.modalContainer}
      dismissable={false}
    >
      <Surface style={styles.surface}>
        <Title style={styles.title}>Payment Confirmation</Title>
        
        <View style={styles.details}>
          <Text style={styles.amount}>₹{paymentData.amount}</Text>
          <Text style={styles.payee}>to {paymentData.payee}</Text>
          
          <Chip 
            icon={() => (
              <MaterialCommunityIcons
                name={category.icon}
                size={16}
                color="#6200ee"
              />
            )}
            style={styles.categoryChip}
          >
            {category.name}
          </Chip>
          
          {paymentData.notes && (
            <Text style={styles.notes}>Notes: {paymentData.notes}</Text>
          )}
        </View>
        
        <Text style={styles.message}>
          Was your payment successful?
        </Text>
        
        <View style={styles.buttonsContainer}>
          <Button 
            mode="outlined" 
            onPress={() => onConfirm(false)} 
            style={[styles.button, styles.noButton]}
          >
            No
          </Button>
          <Button 
            mode="contained" 
            onPress={() => onConfirm(true)} 
            style={styles.button}
          >
            Yes
          </Button>
        </View>
      </Surface>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
    margin: 20,
  },
  surface: {
    padding: 20,
    borderRadius: 8,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  details: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  payee: {
    fontSize: 16,
    marginBottom: 12,
  },
  categoryChip: {
    marginBottom: 8,
  },
  notes: {
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    margin: 8,
  },
  noButton: {
    borderColor: '#6200ee',
  }
});

export default PaymentConfirmationModal;