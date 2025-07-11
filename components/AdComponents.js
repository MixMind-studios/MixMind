// Placeholder Ad Components for Initial Release
// AdMob will be integrated in Version 1.1

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder Banner Ad Component
export const BannerAdComponent = ({ style }) => {
  return (
    <View style={[styles.placeholderBanner, style]}>
      <Text style={styles.placeholderText}>Ad Space - Coming Soon</Text>
    </View>
  );
};

// Placeholder Interstitial Ad Hook
export const useInterstitialAd = () => {
  return { 
    showAd: () => console.log('Interstitial ad would show here'), 
    loaded: false 
  };
};

// Placeholder Rewarded Ad Hook
export const useRewardedAd = () => {
  return { 
    showAd: () => console.log('Rewarded ad would show here'), 
    loaded: false, 
    earned: false, 
    resetEarned: () => {} 
  };
};

// Placeholder Ad Configuration
export const initializeAds = async () => {
  console.log('Ads will be initialized in Version 1.1');
};

const styles = StyleSheet.create({
  placeholderBanner: {
    height: 50,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
