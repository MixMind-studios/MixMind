import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { BannerAdComponent, useInterstitialAd } from '../components/AdComponents';
import axios from 'axios';

import { API_BASE_URL } from '../config';

export default function AIGeneratorScreen() {
  const [ingredients, setIngredients] = useState([]);
  const [cocktailPrompt, setCocktailPrompt] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canUse, setCanUse] = useState(true);

  const { currentUser, userProfile, canUseAI, updateAICredits } = useAuth();
  const { showAd: showInterstitialAd } = useInterstitialAd();

  useEffect(() => {
    loadIngredients();
    checkAIUsage();
  }, []);

  const loadIngredients = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ingredients`);
      setIngredients(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load ingredients');
    }
  };

  const checkAIUsage = async () => {
    if (currentUser) {
      const canUseAIFeature = await canUseAI(currentUser.uid);
      setCanUse(canUseAIFeature);
    }
  };

  const generateCocktail = async () => {
    if (!cocktailPrompt.trim()) {
      Alert.alert('Error', 'Please enter a cocktail request');
      return;
    }

    if (!canUse && !userProfile?.isPremium) {
      Alert.alert(
        'Upgrade Required',
        'You\'ve reached your free AI limit. Upgrade to Premium for unlimited AI cocktail generation!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {/* Navigate to upgrade */} }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-cocktail`, {
        prompt: cocktailPrompt,
        user_ingredients: selectedIngredients
      });
      setGeneratedRecipe(response.data);
      
      // Show interstitial ad for free users occasionally
      if (!userProfile?.isPremium && Math.random() < 0.3) {
        showInterstitialAd();
      }
      
      // Update AI credits for non-premium users
      if (!userProfile?.isPremium) {
        await updateAICredits(currentUser.uid);
        await checkAIUsage();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate cocktail recipe');
    }
    setLoading(false);
  };

  const toggleIngredient = (ingredientName) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredientName)
        ? prev.filter(name => name !== ingredientName)
        : [...prev, ingredientName]
    );
  };

  const renderIngredient = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.ingredientChip,
        selectedIngredients.includes(item.name) && styles.selectedChip
      ]}
      onPress={() => toggleIngredient(item.name)}
    >
      <Text style={[
        styles.chipText,
        selectedIngredients.includes(item.name) && styles.selectedChipText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🧠 MixMind AI Generator</Text>
          <Text style={styles.subtitle}>
            {userProfile?.isPremium ? 
              'Premium: Unlimited AI generations' : 
              `Free: ${canUse ? 'AI generation available' : 'AI limit reached'}`
            }
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
          <TextInput
            style={styles.promptInput}
            value={cocktailPrompt}
            onChangeText={setCocktailPrompt}
            placeholder="e.g., Something refreshing with gin for summer, or a strong whiskey cocktail for winter..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Ingredients (Optional)</Text>
          <FlatList
            data={ingredients}
            renderItem={renderIngredient}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Add ingredients to your inventory first</Text>
            }
          />
        </View>

        {/* Show banner ad for free users */}
        {!userProfile?.isPremium && (
          <BannerAdComponent style={styles.adBanner} />
        )}

        <TouchableOpacity
          style={[styles.generateButton, (!canUse && !userProfile?.isPremium) && styles.buttonDisabled]}
          onPress={generateCocktail}
          disabled={loading || (!canUse && !userProfile?.isPremium)}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Generate Cocktail</Text>
            </>
          )}
        </TouchableOpacity>

        {generatedRecipe && (
          <View style={styles.recipeCard}>
            <Text style={styles.recipeName}>{generatedRecipe.name}</Text>
            <Text style={styles.recipeDescription}>{generatedRecipe.description}</Text>
            
            <View style={styles.recipeSection}>
              <Text style={styles.recipeSectionTitle}>Ingredients:</Text>
              {generatedRecipe.ingredients.map((ingredient, index) => (
                <Text key={index} style={styles.recipeIngredient}>
                  • {ingredient.amount} {ingredient.name}
                </Text>
              ))}
            </View>
            
            <View style={styles.recipeSection}>
              <Text style={styles.recipeSectionTitle}>Instructions:</Text>
              {generatedRecipe.instructions.map((instruction, index) => (
                <Text key={index} style={styles.recipeInstruction}>
                  {index + 1}. {instruction}
                </Text>
              ))}
            </View>
            
            <View style={styles.recipeTags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{generatedRecipe.difficulty}</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{generatedRecipe.prep_time}</Text>
              </View>
              {generatedRecipe.glass_type && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{generatedRecipe.glass_type}</Text>
                </View>
              )}
            </View>
          </View>
        )}
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
    padding: 20,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  promptInput: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#374151',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  ingredientChip: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#374151',
    flex: 1,
    alignItems: 'center',
  },
  selectedChip: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  chipText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  selectedChipText: {
    color: '#FFFFFF',
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  generateButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#374151',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recipeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    marginTop: 0,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  recipeSection: {
    marginBottom: 16,
  },
  recipeSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  recipeIngredient: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  recipeInstruction: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  adBanner: {
    marginVertical: 8,
  },
});
