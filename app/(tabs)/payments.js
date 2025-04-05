import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, StatusBar, ScrollView } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  FAB, 
  Portal, 
  ActivityIndicator,
  Chip,
  Text,
  Surface,
  Divider,
  Appbar,
  useTheme,
  IconButton,
  Avatar,
  Button
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { useTransactions } from '../../hooks/useTransactions';
import PaymentConfirmationModal from '../../components/PaymentConfirmationModal';
import TransactionCard from '../../components/TransactionCard';
import { setupDeepLinking } from '../../utils/upiUtils';

export default function PaymentsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { transactions, loading, fetchTransactions, saveTransaction } = useTransactions();
  const [fabOpen, setFabOpen] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Load transactions when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
      
      // Set up deep linking handler
      const unsubscribe = setupDeepLinking((url) => {
        // Handle deep link from UPI app
        if (pendingPayment) {
          setConfirmationVisible(true);
        }
      });
      
      return () => {
        unsubscribe();
      };
    }, [fetchTransactions, pendingPayment])
  );

  // Listen for payment data from payment screens
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      // Extract payment data from URL parameters if present
      try {
        const { queryParams } = Linking.parse(url);
        if (queryParams && queryParams.paymentData) {
          const paymentData = JSON.parse(decodeURIComponent(queryParams.paymentData));
          setPendingPayment(paymentData);
          setConfirmationVisible(true);
        }
      } catch (error) {
        console.error('Error parsing deep link:', error);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handlePaymentConfirmation = async (isSuccessful) => {
    setConfirmationVisible(false);
    
    if (isSuccessful && pendingPayment) {
      try {
        // Save transaction to database
        await saveTransaction(pendingPayment);
        
        // Refresh transaction list
        fetchTransactions();
        
        // Reset pending payment
        setPendingPayment(null);
        
      } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Failed to record transaction. Please try again.');
      }
    } else {
      // Reset pending payment if not successful
      setPendingPayment(null);
    }
  };

  // Filter transactions based on active filter
  const filteredTransactions = transactions.filter(transaction => {
    if (activeFilter === 'all') return true;
    return transaction.type === activeFilter;
  });

  // Calculate totals for the summary card
  const getTotalAmount = () => {
    if (!transactions.length) return 0;
    return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  // Get month name
  const getCurrentMonth = () => {
    return new Date().toLocaleString('default', { month: 'long' });
  };

  const renderHeader = () => (
    <>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Payments" subtitle="Manage your transactions" />
        <Appbar.Action icon="magnify" onPress={() => {}} />
        <Appbar.Action icon="bell-outline" onPress={() => {}} />
      </Appbar.Header>

      <Surface style={styles.summaryCard} elevation={4}>
        <View style={styles.summaryContent}>
          <View>
            <Text style={styles.summaryLabel}>Total Transactions</Text>
            <Text style={styles.summaryValue}>{transactions.length}</Text>
            <Text style={styles.summarySubtext}>{getCurrentMonth()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>₹{getTotalAmount().toLocaleString()}</Text>
            <Chip 
              icon="trending-up" 
              style={{backgroundColor: '#e8f5e9'}}
              textStyle={{color: '#2e7d32'}}
            >
              12% up
            </Chip>
          </View>
        </View>
      </Surface>

      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <Chip 
            selected={activeFilter === 'all'} 
            onPress={() => setActiveFilter('all')} 
            style={[styles.filterChip, activeFilter === 'all' && {backgroundColor: theme.colors.primary}]} 
            textStyle={activeFilter === 'all' ? {color: 'white'} : {}}
          >
            All
          </Chip>
          <Chip 
            selected={activeFilter === 'sent'} 
            onPress={() => setActiveFilter('sent')} 
            style={[styles.filterChip, activeFilter === 'sent' && {backgroundColor: theme.colors.primary}]}
            textStyle={activeFilter === 'sent' ? {color: 'white'} : {}}
            icon="arrow-up"
          >
            Sent
          </Chip>
          <Chip 
            selected={activeFilter === 'received'} 
            onPress={() => setActiveFilter('received')} 
            style={[styles.filterChip, activeFilter === 'received' && {backgroundColor: theme.colors.primary}]}
            textStyle={activeFilter === 'received' ? {color: 'white'} : {}}
            icon="arrow-down"
          >
            Received
          </Chip>
          <Chip 
            selected={activeFilter === 'pending'} 
            onPress={() => setActiveFilter('pending')} 
            style={[styles.filterChip, activeFilter === 'pending' && {backgroundColor: theme.colors.primary}]}
            textStyle={activeFilter === 'pending' ? {color: 'white'} : {}}
            icon="clock-outline"
          >
            Pending
          </Chip>
        </ScrollView>
      </View>

      <Title style={styles.sectionTitle}>Transaction History</Title>
    </>
  );

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Card.Content style={styles.emptyContent}>
        <Avatar.Icon size={80} icon="credit-card-outline" style={styles.emptyIcon} />
        <Title style={styles.emptyTitle}>No transactions yet</Title>
        <Paragraph style={styles.emptyParagraph}>
          Your transaction history will appear here once you make a payment or receive money.
        </Paragraph>
        <Card.Actions style={styles.emptyActions}>
          <Button 
            mode="contained"
            icon="cash-plus"
            onPress={() => router.push('/payment/manual')}
          >
            Make a Payment
          </Button>
        </Card.Actions>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading your transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader()}
          renderItem={({ item }) => (
            <TransactionCard transaction={item} />
          )}
          ListEmptyComponent={renderEmptyState()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* FAB for payment options */}
      <Portal>
        <FAB.Group
          open={fabOpen}
          icon={fabOpen ? 'close' : 'cash-plus'}
          actions={[
            {
              icon: 'qrcode-scan',
              label: 'Scan QR Code',
              color: theme.colors.primary,
              style: styles.fabAction,
              onPress: () => router.push('/payment/scan'),
            },
            {
              icon: 'bank-transfer',
              label: 'Bank Transfer',
              color: theme.colors.primary,
              style: styles.fabAction,
              onPress: () => router.push('/payment/transfer'),
            },
            {
              icon: 'cash',
              label: 'Manual Payment',
              color: theme.colors.primary,
              style: styles.fabAction,
              onPress: () => router.push('/payment/manual'),
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          fabStyle={styles.fab}
          color="white"
        />
      </Portal>

      {/* Payment Confirmation Dialog */}
      <PaymentConfirmationModal
        visible={confirmationVisible}
        paymentData={pendingPayment}
        onConfirm={(isSuccessful) => handlePaymentConfirmation(isSuccessful)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  appbar: {
    elevation: 0,
    backgroundColor: 'transparent',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  listContent: {
    paddingBottom: 80,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryCard: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  summaryContent: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryDivider: {
    height: '80%',
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  filterTitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
    height: 36,
  },
  emptyCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    backgroundColor: '#eeeeee',
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyParagraph: {
    textAlign: 'center',
    color: '#757575',
    marginBottom: 24,
  },
  emptyActions: {
    justifyContent: 'center',
  },
  separator: {
    height: 8,
    backgroundColor: 'transparent',
  },
  fab: {
    backgroundColor: '#6200ee',
  },
  fabAction: {
    backgroundColor: '#f3e5f5',
  },
});