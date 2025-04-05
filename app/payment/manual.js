import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { TextInput, Button, Title, HelperText, Divider, Menu, List, Text } from 'react-native-paper';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { isUpiIdValid, initiateUpiPayment } from '../../utils/upiUtils';
import { saveTransaction } from '../../utils/transactionUtils';
import PaymentConfirmationModal from '../../components/PaymentConfirmationModal';

// Predefined categories with icons - Ensure these match the expected database values
const categories = [
  { id: 'Food', name: 'Food', icon: 'food' },
  { id: 'Transportation', name: 'Transportation', icon: 'bus' },
  { id: 'Shopping', name: 'Shopping', icon: 'shopping' },
  { id: 'Entertainment', name: 'Entertainment', icon: 'movie-open' },
  { id: 'Utilities', name: 'Utilities', icon: 'lightbulb' },
  { id: 'Rent', name: 'Rent', icon: 'home' },
  { id: 'Healthcare', name: 'Healthcare', icon: 'medical-bag' },
  { id: 'Education', name: 'Education', icon: 'school' },
  { id: 'Travel', name: 'Travel', icon: 'airplane' },
  { id: 'Subscriptions', name: 'Subscriptions', icon: 'youtube-subscription' },
  { id: 'Other', name: 'Other', icon: 'tag' }
];

export default function ManualPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Initialize payment form data with empty values
  const [paymentData, setPaymentData] = useState({
    upiId: '',
    payee: '',
    amount: '',
    notes: '',
    category: 'Food', // Default category - Using exact case as expected in database
  });
  
  // Form validation errors
  const [errors, setErrors] = useState({
    upiId: '',
    amount: '',
  });

  // Category selection menu state
  const [menuVisible, setMenuVisible] = useState(false);

  // Modal state
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle URL parameters - run only once on initial mount
  useEffect(() => {
    const upiId = params?.upiId || '';
    const payee = params?.payee || '';
    const amount = params?.amount || '';
    const notes = params?.notes || '';
    const category = params?.category || 'Food'; // Match case with the database
    
    // Only update if we have at least one value from params
    if (upiId || payee || amount || notes) {
      setPaymentData({
        upiId,
        payee,
        amount,
        notes,
        category
      });
    }
  }, []); // Empty dependency array - only run on mount

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      upiId: '',
      amount: '',
    };
    
    if (!isUpiIdValid(paymentData.upiId)) {
      newErrors.upiId = 'Please enter a valid UPI ID (e.g., name@upi)';
      isValid = false;
    }
    
    if (!paymentData.amount || isNaN(paymentData.amount) || parseFloat(paymentData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleInitiatePayment = async () => {
    if (!validateForm()) return;
    
    // Log the payment data for debugging
    console.log('Payment data before initiation:', paymentData);
    
    setIsLoading(true);
    
    try {
      // Initiate UPI payment
      const success = await initiateUpiPayment(paymentData);
      
      if (success) {
        // Show confirmation modal
        setConfirmationVisible(true);
      } else {
        alert('Failed to initiate payment. Please check if you have a UPI app installed.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred while processing your payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentConfirmation = async (isSuccessful) => {
    setConfirmationVisible(false);
    
    if (isSuccessful) {
      try {
        // Log the payment data again before saving to database
        console.log('Payment data before saving to database:', paymentData);
        
        // Save transaction to database with category
        await saveTransaction({
          ...paymentData,
          category: paymentData.category, // Explicitly set category
        });
        
        // Navigate to home screen
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Payment was successful but we couldn\'t save the record. Please try again.');
      }
    } else {
      // Payment was not successful, just go back to home screen
      router.replace('/(tabs)');
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setPaymentData(prev => {
      const updatedData = {
        ...prev,
        [field]: value
      };
      console.log(`Updated ${field} to ${value}. New paymentData:`, updatedData);
      return updatedData;
    });
  };

  // Get selected category object
  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === paymentData.category) || categories[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Payment Details' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title style={styles.title}>Enter Payment Details</Title>
        
        <TextInput
          label="UPI ID"
          value={paymentData.upiId}
          onChangeText={(text) => handleInputChange('upiId', text)}
          style={styles.input}
          mode="outlined"
          error={!!errors.upiId}
        />
        {errors.upiId ? <HelperText type="error">{errors.upiId}</HelperText> : null}
        
        <TextInput
          label="Payee Name"
          value={paymentData.payee}
          onChangeText={(text) => handleInputChange('payee', text)}
          style={styles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Amount (₹)"
          value={paymentData.amount}
          onChangeText={(text) => handleInputChange('amount', text)}
          keyboardType="numeric"
          style={styles.input}
          mode="outlined"
          error={!!errors.amount}
        />
        {errors.amount ? <HelperText type="error">{errors.amount}</HelperText> : null}
        
        {/* Category Selector */}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>Category</Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button 
                mode="outlined" 
                onPress={() => setMenuVisible(true)}
                style={styles.categoryButton}
                icon={() => (
                  <MaterialCommunityIcons
                    name={getSelectedCategory().icon}
                    size={24}
                    color="#6200ee"
                  />
                )}
              >
                {getSelectedCategory().name}
              </Button>
            }
          >
            {categories.map((category) => (
              <Menu.Item
                key={category.id}
                onPress={() => {
                  handleInputChange('category', category.id);
                  setMenuVisible(false);
                }}
                title={category.name}
                leadingIcon={category.icon}
              />
            ))}
          </Menu>
        </View>
        
        {/* Display current category for debugging */}
        <Text style={styles.debugText}>
          Selected category: {paymentData.category}
        </Text>
        
        <TextInput
          label="Notes"
          value={paymentData.notes}
          onChangeText={(text) => handleInputChange('notes', text)}
          style={styles.input}
          mode="outlined"
          multiline
        />
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="outlined" 
            onPress={() => router.back()}
            style={[styles.button, styles.cancelBtn]}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            mode="contained" 
            onPress={handleInitiatePayment}
            style={[styles.button, styles.payBtn]}
            loading={isLoading}
            disabled={isLoading}
          >
            Pay Now
          </Button>
        </View>
      </ScrollView>
      
      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        visible={confirmationVisible}
        paymentData={paymentData}
        onConfirm={handlePaymentConfirmation}
        onDismiss={() => setConfirmationVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: '#6200ee',
    marginLeft: 12,
  },
  categoryButton: {
    width: '100%',
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelBtn: {
    borderColor: '#6200ee',
  },
  payBtn: {
    backgroundColor: '#6200ee',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  }
});