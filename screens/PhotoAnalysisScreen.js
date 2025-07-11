import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

import { API_BASE_URL } from '../config';

export default function PhotoAnalysisScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [imageAnalysisResult, setImageAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canUse, setCanUse] = useState(true);

  const { currentUser, userProfile, canUseAI, updateAICredits } = useAuth();

  const checkAIUsage = async () => {
    if (currentUser) {
      const canUseAIFeature = await canUseAI(currentUser.uid);
      setCanUse(canUseAIFeature);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageAnalysisResult(null);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!canUse && !userProfile?.isPremium) {
      Alert.alert(
        'Upgrade Required',
        'You\'ve reached your free AI limit. Upgrade to Premium for unlimited AI analysis!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {/* Navigate to upgrade */} }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      // Convert image to base64 for analysis
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        
        try {
          const analysisResponse = await axios.post(`${API_BASE_URL}/analyze-ingredients`, {
            image_base64: base64
          });
          
          setImageAnalysisResult(analysisResponse.data);
          
          // Update AI credits for non-premium users
          if (!userProfile?.isPremium) {
            await updateAICredits(currentUser.uid);
            await checkAIUsage();
          }
        } catch (error) {
          Alert.alert('Error', 'Failed to analyze image');
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert('Error', 'Failed to process image');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🧠 MixMind Vision</Text>
          <Text style={styles.subtitle}>
            {userProfile?.isPremium ? 
              'Premium: Unlimited AI vision analysis' : 
              `Free: ${canUse ? 'AI analysis available' : 'AI limit reached'}`
            }
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Your Ingredients</Text>
          <Text style={styles.description}>
            Take or upload a photo of your ingredients and let MixMind's AI create the perfect cocktail recipe!
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="image" size={24} color="#FFFFFF" />
              <Text style={styles.imageButtonText}>Choose Image</Text>
            </TouchableOpacity>
          </View>

          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={[styles.analyzeButton, (!canUse && !userProfile?.isPremium) && styles.buttonDisabled]}
                onPress={analyzeImage}
                disabled={loading || (!canUse && !userProfile?.isPremium)}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="search" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Analyze Ingredients</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {imageAnalysisResult && (
            <View style={styles.recipeCard}>
              <Text style={styles.recipeName}>{imageAnalysisResult.name}</Text>
              <Text style={styles.recipeDescription}>{imageAnalysisResult.description}</Text>
              
              <View style={styles.recipeSection}>
                <Text style={styles.recipeSectionTitle}>Ingredients:</Text>
                {imageAnalysisResult.ingredients.map((ingredient, index) => (
                  <Text key={index} style={styles.recipeIngredient}>
                    • {ingredient.amount} {ingredient.name}
                  </Text>
                ))}
              </View>
              
              <View style={styles.recipeSection}>
                <Text style={styles.recipeSectionTitle}>Instructions:</Text>
                {imageAnalysisResult.instructions.map((instruction, index) => (
                  <Text key={index} style={styles.recipeInstruction}>
                    {index + 1}. {instruction}
                  </Text>
                ))}
              </View>
              
              <View style={styles.recipeTags}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{imageAnalysisResult.difficulty}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{imageAnalysisResult.prep_time}</Text>
                </View>
                {imageAnalysisResult.glass_type && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{imageAnalysisResult.glass_type}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
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
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  imageButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
    gap: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  analyzeButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
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
    marginTop: 20,
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
});
