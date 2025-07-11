import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { usePurchase } from '../contexts/PurchaseContext';
import { BannerAdComponent } from '../components/AdComponents';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProfileScreen({ navigation }) {
  const [userStats, setUserStats] = useState({
    recipesGenerated: 0,
    recipesAnalyzed: 0,
    totalRecipes: 0,
    favoritesCount: 0,
    aiCreditsUsed: 0,
    accountCreated: null
  });
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const { currentUser, userProfile, logout } = useAuth();
  const { restorePurchases } = usePurchase();

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserStats({
          recipesGenerated: userData.recipesGenerated || 0,
          recipesAnalyzed: userData.recipesAnalyzed || 0,
          totalRecipes: userData.totalRecipes || 0,
          favoritesCount: userData.favorites?.length || 0,
          aiCreditsUsed: userData.aiCreditsUsed || 0,
          accountCreated: userData.createdAt
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleUpgrade = () => {
    navigation.navigate('PremiumUpgrade');
  };

  const handleRestorePurchases = async () => {
    try {
      await restorePurchases();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases');
    }
  };

  const getAICreditsRemaining = () => {
    if (userProfile?.isPremium) return 'Unlimited';
    
    const accountCreated = new Date(userStats.accountCreated);
    const weeksSinceCreation = Math.floor((Date.now() - accountCreated.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const allowedCredits = (weeksSinceCreation + 1) * 2;
    const remaining = Math.max(0, allowedCredits - userStats.aiCreditsUsed);
    
    return `${remaining} remaining this week`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🧠 MixMind Profile</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Show ads for free users */}
        {!userProfile?.isPremium && (
          <BannerAdComponent style={styles.adBanner} />
        )}

        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile?.displayName || 'MixMind User'}</Text>
              <Text style={styles.profileEmail}>{currentUser?.email}</Text>
            </View>
            
            <View style={styles.subscriptionBadge}>
              <Text style={[styles.subscriptionText, userProfile?.isPremium && styles.premiumText]}>
                {userProfile?.isPremium ? '⭐ Premium' : '🆓 Free'}
              </Text>
            </View>
          </View>

          {!userProfile?.isPremium && (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Ionicons name="star" size={20} color="#FFFFFF" />
              <Text style={styles.upgradeText}>Upgrade to Premium</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your MixMind Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.totalRecipes}</Text>
              <Text style={styles.statLabel}>Total Recipes</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.favoritesCount}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.recipesGenerated}</Text>
              <Text style={styles.statLabel}>AI Generated</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{userStats.recipesAnalyzed}</Text>
              <Text style={styles.statLabel}>Photo Analyzed</Text>
            </View>
          </View>

          <View style={styles.aiUsageCard}>
            <Text style={styles.aiUsageTitle}>AI Usage</Text>
            <Text style={styles.aiUsageText}>
              {userProfile?.isPremium ? 
                'Unlimited AI generations with Premium' : 
                getAICreditsRemaining()
              }
            </Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={20} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#374151', true: '#8B5CF6' }}
              thumbColor={darkMode ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={20} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#374151', true: '#8B5CF6' }}
              thumbColor={notifications ? '#FFFFFF' : '#9CA3AF'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleRestorePurchases}>
            <View style={styles.settingInfo}>
              <Ionicons name="refresh" size={20} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Restore Purchases</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle" size={20} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text" size={20} color="#9CA3AF" />
              <Text style={styles.settingLabel}>Terms & Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>MixMind v1.0.0</Text>
          <Text style={styles.footerSubtext}>Smart cocktail mixing powered by AI</Text>
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    padding: 8,
  },
  profileSection: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  subscriptionBadge: {
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  premiumText: {
    color: '#FFD700',
  },
  upgradeButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  aiUsageCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  aiUsageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiUsageText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  settingsSection: {
    padding: 20,
  },
  settingItem: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: '#4B5563',
  },
  adBanner: {
    marginVertical: 8,
  },
});
