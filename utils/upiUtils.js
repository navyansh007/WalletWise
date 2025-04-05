import * as Linking from 'expo-linking';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

export const isUpiIdValid = (upiId) => {
  // Basic UPI ID validation regex
  const upiRegex = /^[\w\.\-]+@[\w\-]+$/;
  return upiRegex.test(upiId);
};

export const parseQrCode = (qrData) => {
  try {
    // Typical UPI QR format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=CURRENCY&tn=NOTE
    const upiUrl = new URL(qrData);
    
    if (upiUrl.protocol !== 'upi:') {
      throw new Error('Not a valid UPI QR code');
    }

    const searchParams = new URLSearchParams(upiUrl.search);
    
    return {
      upiId: searchParams.get('pa') || '',
      payee: searchParams.get('pn') || '',
      amount: searchParams.get('am') || '',
      notes: searchParams.get('tn') || '',
      currency: searchParams.get('cu') || 'INR',
    };
  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
};

export const initiateUpiPayment = async (paymentData) => {
  try {
    const { upiId, payee, amount, notes } = paymentData;
    
    // Construct UPI URL
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payee)}&am=${amount}&cu=INR&tn=${encodeURIComponent(notes)}`;
    
    // On Android, we can check if the URL can be opened
    if (Platform.OS === 'android') {
      const canOpen = await Linking.canOpenURL(upiUrl);
      
      if (canOpen) {
        await Linking.openURL(upiUrl);
        return true;
      } else {
        // If direct linking doesn't work, try to use intent
        try {
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: upiUrl,
            flags: 1, // FLAG_ACTIVITY_NEW_TASK
          });
          return true;
        } catch (intentError) {
          console.error('Error launching intent:', intentError);
          return false;
        }
      }
    } 
    // For iOS, just try to open the URL
    else if (Platform.OS === 'ios') {
      await Linking.openURL(upiUrl);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error initiating UPI payment:', error);
    return false;
  }
};

// Handle deep linking back from UPI apps
export const setupDeepLinking = (callback) => {
  // Set up event listener for deep linking
  const subscription = Linking.addEventListener('url', ({ url }) => {
    // Handle the deep link
    // Note: UPI apps might not send a response through deep linking
    // We'll rely on manual confirmation as well
    callback(url);
  });
  
  return () => {
    // Cleanup function to remove event listener
    subscription.remove();
  };
};