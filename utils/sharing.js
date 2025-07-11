import * as Sharing from 'expo-sharing';

// Social Media Sharing Utilities
export const shareRecipe = async (recipe) => {
  try {
    const shareContent = generateShareContent(recipe);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(shareContent.url, {
        mimeType: 'text/plain',
        dialogTitle: shareContent.title,
        UTI: 'public.plain-text'
      });
    } else {
      // Fallback for web or unsupported platforms
      if (navigator.share) {
        await navigator.share({
          title: shareContent.title,
          text: shareContent.text,
          url: shareContent.url
        });
      } else {
        // Copy to clipboard fallback
        await navigator.clipboard.writeText(shareContent.text);
        return 'copied';
      }
    }
    return 'shared';
  } catch (error) {
    console.error('Error sharing recipe:', error);
    throw error;
  }
};

const generateShareContent = (recipe) => {
  const title = `🧠 MixMind Recipe: ${recipe.name}`;
  const ingredients = recipe.ingredients.map(ing => `• ${ing.amount} ${ing.name}`).join('\n');
  const instructions = recipe.instructions.map((inst, index) => `${index + 1}. ${inst}`).join('\n');
  
  const text = `${title}

${recipe.description}

🥃 Ingredients:
${ingredients}

📝 Instructions:
${instructions}

⏱️ Prep Time: ${recipe.prep_time}
🎯 Difficulty: ${recipe.difficulty}
${recipe.glass_type ? `🥂 Glass: ${recipe.glass_type}` : ''}

Created with MixMind - Smart cocktail mixing powered by AI
Get the app: https://play.google.com/store/apps/details?id=com.mixmind.app`;

  return {
    title,
    text,
    url: 'https://play.google.com/store/apps/details?id=com.mixmind.app'
  };
};

// Share to specific platforms
export const shareToFacebook = async (recipe) => {
  const shareContent = generateShareContent(recipe);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.mixmind.app')}&quote=${encodeURIComponent(shareContent.text)}`;
  
  if (typeof window !== 'undefined') {
    window.open(facebookUrl, '_blank');
  }
};

export const shareToTwitter = async (recipe) => {
  const shareContent = generateShareContent(recipe);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent.text)}&url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.mixmind.app')}&hashtags=MixMind,Cocktails,AI`;
  
  if (typeof window !== 'undefined') {
    window.open(twitterUrl, '_blank');
  }
};

export const shareToInstagram = async (recipe) => {
  // Instagram doesn't support direct text sharing, so we'll use clipboard
  const shareContent = generateShareContent(recipe);
  
  try {
    await navigator.clipboard.writeText(shareContent.text);
    return 'copied';
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    throw error;
  }
};

export const shareToWhatsApp = async (recipe) => {
  const shareContent = generateShareContent(recipe);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareContent.text)}`;
  
  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank');
  }
};
