import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { usePurchase } from '../contexts/PurchaseContext';

export default function PremiumUpgradeScreen({ navigation }) {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  
  const { userProfile } = useAuth();
  const { loading, purchasePremium, getMonthlyProduct, getYearlyProduct } = usePurchase();
  
  const monthlyProduct = getMonthlyProduct();
  const yearlyProduct = getYearlyProduct();

  if (userProfile?.isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.premiumContainer}>
          <Ionicons name="star" size={64} color="#FFD700" />
          <Text style={styles.premiumTitle}>You're Premium!</Text>
          <Text style={styles.premiumSubtitle}>
            Enjoy unlimited access to all MixMind features
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back to App</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handlePurchase = async () => {
    const product = selectedPlan === 'monthly' ? monthlyProduct : yearlyProduct;
    if (product) {
      await purchasePremium(product.productId);
    } else {
      Alert.alert('Error', 'Product not available. Please try again later.');
    }
  };

  const premiumFeatures = [
    {
      icon: 'infinite',
      title: 'Unlimited AI Generations',
      description: 'Create as many cocktail recipes as you want with AI'
    },
    {
      icon: 'heart',
      title: 'Unlimited Favorites',
      description: 'Save and organize all your favorite recipes'
    },
    {
      icon: 'ban',
      title: 'Ad-Free Experience',
      description: 'Enjoy MixMind without any interruptions'
    },
    {
      icon: 'mic',
      title: 'Voice-Guided Mixing',
      description: 'Step-by-step voice instructions for perfect cocktails'
    },
    {
      icon: 'people',
      title: 'Party Planner Mode',
      description: 'Generate cocktail menus for events and gatherings'
    },
    {
      icon: 'journal',
      title: 'Personal Cocktail Journal',
      description: 'Rate, review, and track your mixing journey'
    },
    {
      icon: 'download',
      title: 'Offline Access',
      description: 'Access your saved recipes even without internet'
    },
    {
      icon: 'palette',
      title: 'Custom Themes',
      description: 'Personalize your app with exclusive themes'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>🧠 MixMind Premium</Text>
          <Text style={styles.subtitle}>
            Unlock the full potential of AI-powered cocktail mixing
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {premiumFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={24} color="#8B5CF6" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.pricingContainer}>
          <Text style={styles.pricingTitle}>Choose Your Plan</Text>
          
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'yearly' && styles.selectedPlan
            ]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>MOST POPULAR</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Yearly</Text>
              <Text style={styles.planPrice}>$39.99</Text>
              <Text style={styles.planPeriod}>per year</Text>
            </View>
            <Text style={styles.planSavings}>Save 17% compared to monthly</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.selectedPlan
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Monthly</Text>
              <Text style={styles.planPrice}>$3.99</Text>
              <Text style={styles.planPeriod}>per month</Text>
            </View>
            <Text style={styles.planDescription}>Perfect for trying premium features</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.upgradeButton, loading && styles.upgradeButtonDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="star" size={24} color="#FFFFFF" />
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            • Cancel anytime from your app store settings{'\n'}
            • Free trial for new subscribers{'\n'}
            • Instant access to all premium features
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  pricingContainer: {
    padding: 20,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#374151',
    position: 'relative',
  },
  selectedPlan: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF6',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planPeriod: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  planSavings: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  planDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonDisabled: {
    opacity: 0.7,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  premiumContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  premiumTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 20,
    marginBottom: 8,
  },
  premiumSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 40,
  },
  backButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
