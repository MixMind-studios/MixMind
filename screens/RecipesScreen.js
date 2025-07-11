import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  FlatList,
  Modal,
  ActionSheetIOS,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { shareRecipe, shareToFacebook, shareToTwitter, shareToInstagram, shareToWhatsApp } from '../utils/sharing';
import axios from 'axios';

const { API_BASE_URL } = require('../config');

export default function RecipesScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    loadRecipes();
    loadFavorites();
  }, []);

  const loadRecipes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/recipes`);
      setRecipes(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recipes');
    }
  };

  const loadFavorites = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFavorites(userData.favorites || []);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (recipeId) => {
    if (!currentUser) return;

    const isFavorite = favorites.includes(recipeId);
    const canAddMore = userProfile?.isPremium || favorites.length < 3;

    if (!isFavorite && !canAddMore) {
      Alert.alert(
        'Upgrade Required',
        'Free users can only save 3 favorites. Upgrade to Premium for unlimited favorites!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('PremiumUpgrade') }
        ]
      );
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (isFavorite) {
        await updateDoc(userRef, {
          favorites: arrayRemove(recipeId)
        });
        setFavorites(prev => prev.filter(id => id !== recipeId));
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(recipeId)
        });
        setFavorites(prev => [...prev, recipeId]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const handleShare = async (recipe) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Share via System', 'Facebook', 'Twitter', 'WhatsApp', 'Copy Recipe'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          try {
            switch (buttonIndex) {
              case 1:
                await shareRecipe(recipe);
                Alert.alert('Success', 'Recipe shared successfully!');
                break;
              case 2:
                await shareToFacebook(recipe);
                break;
              case 3:
                await shareToTwitter(recipe);
                break;
              case 4:
                await shareToWhatsApp(recipe);
                break;
              case 5:
                await shareToInstagram(recipe);
                Alert.alert('Success', 'Recipe copied to clipboard!');
                break;
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to share recipe');
          }
        }
      );
    } else {
      Alert.alert(
        'Share Recipe',
        'Choose how to share this recipe:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'System Share', onPress: () => handleSystemShare(recipe) },
          { text: 'Facebook', onPress: () => shareToFacebook(recipe) },
          { text: 'Twitter', onPress: () => shareToTwitter(recipe) },
          { text: 'WhatsApp', onPress: () => shareToWhatsApp(recipe) },
          { text: 'Copy Text', onPress: () => handleCopyShare(recipe) }
        ]
      );
    }
  };

  const handleSystemShare = async (recipe) => {
    try {
      const result = await shareRecipe(recipe);
      if (result === 'copied') {
        Alert.alert('Success', 'Recipe copied to clipboard!');
      } else {
        Alert.alert('Success', 'Recipe shared successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share recipe');
    }
  };

  const handleCopyShare = async (recipe) => {
    try {
      await shareToInstagram(recipe);
      Alert.alert('Success', 'Recipe copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy recipe');
    }
  };

  const deleteRecipe = async (recipeId) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/recipes/${recipeId}`);
              await loadRecipes();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          }
        }
      ]
    );
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'ai_generated':
        return '🧠';
      case 'image_analyzed':
        return '📸';
      default:
        return '👤';
    }
  };

  const getSourceText = (source) => {
    switch (source) {
      case 'ai_generated':
        return 'AI Generated';
      case 'image_analyzed':
        return 'Photo Analysis';
      default:
        return 'Manual';
    }
  };

  const renderRecipe = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => {
        setSelectedRecipe(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.recipeHeader}>
        <Text style={styles.recipeName}>{item.name}</Text>
        <View style={styles.recipeActions}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => handleShare(item)}
          >
            <Ionicons name="share-outline" size={20} color="#8B5CF6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons
              name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
              size={20}
              color={favorites.includes(item.id) ? '#EF4444' : '#9CA3AF'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteRecipe(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.recipeDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.recipeInfo}>
        <View style={styles.recipeTags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.difficulty}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.prep_time}</Text>
          </View>
          <View style={styles.sourceTag}>
            <Text style={styles.sourceText}>
              {getSourceIcon(item.source)} {getSourceText(item.source)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧠 MixMind Recipes</Text>
        <Text style={styles.subtitle}>
          {userProfile?.isPremium ? 
            `${favorites.length} favorites saved` : 
            `${favorites.length}/3 favorites saved`
          }
        </Text>
      </View>

      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recipes yet</Text>
            <Text style={styles.emptySubtext}>Generate some cocktails to get started!</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Recipe Details</Text>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => selectedRecipe && handleShare(selectedRecipe)}
            >
              <Ionicons name="share-outline" size={24} color="#8B5CF6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => selectedRecipe && toggleFavorite(selectedRecipe.id)}
            >
              <Ionicons
                name={selectedRecipe && favorites.includes(selectedRecipe.id) ? 'heart' : 'heart-outline'}
                size={24}
                color={selectedRecipe && favorites.includes(selectedRecipe.id) ? '#EF4444' : '#9CA3AF'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedRecipe && (
              <>
                <Text style={styles.modalRecipeName}>{selectedRecipe.name}</Text>
                <Text style={styles.modalRecipeDescription}>{selectedRecipe.description}</Text>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Ingredients:</Text>
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <Text key={index} style={styles.modalIngredient}>
                      • {ingredient.amount} {ingredient.name}
                    </Text>
                  ))}
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Instructions:</Text>
                  {selectedRecipe.instructions.map((instruction, index) => (
                    <Text key={index} style={styles.modalInstruction}>
                      {index + 1}. {instruction}
                    </Text>
                  ))}
                </View>
                
                <View style={styles.modalTags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{selectedRecipe.difficulty}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{selectedRecipe.prep_time}</Text>
                  </View>
                  {selectedRecipe.glass_type && (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{selectedRecipe.glass_type}</Text>
                    </View>
                  )}
                  <View style={styles.sourceTag}>
                    <Text style={styles.sourceText}>
                      {getSourceIcon(selectedRecipe.source)} {getSourceText(selectedRecipe.source)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  listContainer: {
    padding: 20,
  },
  recipeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  recipeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButton: {
    padding: 4,
  },
  favoriteButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    lineHeight: 18,
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  sourceTag: {
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sourceText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalRecipeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalRecipeDescription: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalIngredient: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 6,
    lineHeight: 20,
  },
  modalInstruction: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 8,
    lineHeight: 20,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
});
