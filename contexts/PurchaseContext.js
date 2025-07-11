import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  initConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
  endConnection,
} from 'react-native-iap';
import { Alert, Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PurchaseContext = createContext();

export function usePurchase() {
  return useContext(PurchaseContext);
}

// Product IDs - these should match your Google Play Console
const productIds = Platform.select({
  ios: ['com.mixmind.app.premium_monthly', 'com.mixmind.app.premium_yearly'],
  android: ['premium_subscription', 'premium_yearly_subscription'],
});

export function PurchaseProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchaseUpdateSubscription, setPurchaseUpdateSubscription] = useState(null);
  const [purchaseErrorSubscription, setPurchaseErrorSubscription] = useState(null);
  
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    initializePurchasing();
    return () => {
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
      }
      endConnection();
    };
  }, []);

  const initializePurchasing = async () => {
    try {
      await initConnection();
      await loadProducts();
      await restorePurchases();
      setupPurchaseListeners();
    } catch (error) {
      console.error('Failed to initialize purchasing:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const products = await getProducts({ skus: productIds });
      setProducts(products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const setupPurchaseListeners = () => {
    const updateSubscription = purchaseUpdatedListener(async (purchase) => {
      console.log('Purchase successful:', purchase);
      
      try {
        await processPurchase(purchase);
        await finishTransaction({ purchase, isConsumable: false });
        
        Alert.alert(
          'Purchase Successful!',
          'Welcome to MixMind Premium! You now have unlimited access to all features.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Failed to process purchase:', error);
        Alert.alert('Error', 'Failed to process purchase. Please contact support.');
      }
    });

    const errorSubscription = purchaseErrorListener((error) => {
      console.error('Purchase error:', error);
      if (error.code !== 'E_USER_CANCELLED') {
        Alert.alert('Purchase Error', error.message);
      }
      setLoading(false);
    });

    setPurchaseUpdateSubscription(updateSubscription);
    setPurchaseErrorSubscription(errorSubscription);
  };

  const processPurchase = async (purchase) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        isPremium: true,
        subscriptionId: purchase.transactionId,
        subscriptionDate: new Date().toISOString(),
        productId: purchase.productId,
      });

      console.log('User premium status updated');
    } catch (error) {
      console.error('Failed to update user premium status:', error);
      throw error;
    }
  };

  const restorePurchases = async () => {
    try {
      const purchases = await getAvailablePurchases();
      
      if (purchases.length > 0) {
        for (const purchase of purchases) {
          await processPurchase(purchase);
        }
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
    }
  };

  const purchasePremium = async (productId) => {
    if (userProfile?.isPremium) {
      Alert.alert('Already Premium', 'You already have premium access!');
      return;
    }

    setLoading(true);
    
    try {
      await requestPurchase({ sku: productId });
    } catch (error) {
      console.error('Failed to request purchase:', error);
      Alert.alert('Purchase Error', 'Failed to initiate purchase. Please try again.');
      setLoading(false);
    }
  };

  const getPremiumProducts = () => {
    return products.filter(product => 
      productIds.includes(product.productId)
    );
  };

  const getMonthlyProduct = () => {
    return products.find(product => 
      product.productId.includes('monthly') || product.productId === 'premium_subscription'
    );
  };

  const getYearlyProduct = () => {
    return products.find(product => 
      product.productId.includes('yearly') || product.productId === 'premium_yearly_subscription'
    );
  };

  const value = {
    products,
    loading,
    purchasePremium,
    restorePurchases,
    getPremiumProducts,
    getMonthlyProduct,
    getYearlyProduct,
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
}
