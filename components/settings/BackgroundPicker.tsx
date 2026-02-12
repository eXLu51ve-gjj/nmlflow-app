import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBackground, BACKGROUND_OPTIONS } from '@/components/providers/BackgroundProvider';
import TablerIcon from '@/components/TablerIcon';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { useStore } from '@/store';

const CUSTOM_BG_KEY = '@nmlflow/custom_background';

// Preset background images
export const PRESET_IMAGES = [
  { id: 'preset-1', source: require('@/assets/backgrounds/bg1.jpeg') },
  { id: 'preset-2', source: require('@/assets/backgrounds/bg2.jpeg') },
  { id: 'preset-3', source: require('@/assets/backgrounds/bg3.jpeg') },
  { id: 'preset-4', source: require('@/assets/backgrounds/bg4.jpeg') },
  { id: 'preset-5', source: require('@/assets/backgrounds/bg5.jpeg') },
];

export function BackgroundPicker() {
  const { backgroundId, setBackground } = useBackground();
  const { customBackgroundUri, setCustomBackgroundUri } = useStore();
  const [picking, setPicking] = useState(false);

  const handleSelect = async (id: string) => {
    try {
      await setBackground(id);
      if (!id.startsWith('preset-') && id !== 'custom') {
        setCustomBackgroundUri(null);
        await AsyncStorage.removeItem(CUSTOM_BG_KEY);
      }
    } catch (error) {
      console.error('Failed to set background:', error);
    }
  };

  const handlePickImage = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setCustomBackgroundUri(uri);
        await AsyncStorage.setItem(CUSTOM_BG_KEY, uri);
        await setBackground('custom');
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Фон приложения</Text>
      <Text style={styles.subtitle}>Выберите тему или своё изображение</Text>
      
      <View style={styles.grid}>
        {BACKGROUND_OPTIONS.map((option) => {
          const isSelected = backgroundId === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => handleSelect(option.id)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={option.colors as [string, string, ...string[]]}
                style={[styles.preview, isSelected && styles.previewSelected]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              >
                {isSelected && (
                  <View style={styles.checkmark}>
                    <TablerIcon name="check" size={12} color={colors.text} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
        
        {/* Preset background images */}
        {PRESET_IMAGES.map((preset) => {
          const isSelected = backgroundId === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              style={styles.option}
              onPress={() => handleSelect(preset.id)}
              activeOpacity={0.7}
            >
              <Image 
                source={preset.source} 
                style={[styles.preview, styles.imagePreview, isSelected && styles.previewSelected]} 
              />
              {isSelected && (
                <View style={[styles.checkmark, styles.checkmarkCustom]}>
                  <TablerIcon name="check" size={12} color={colors.text} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        
        {/* Custom image option */}
        <TouchableOpacity
          style={[styles.option, backgroundId === 'custom' && styles.optionSelected]}
          onPress={handlePickImage}
          activeOpacity={0.7}
        >
          {customBackgroundUri ? (
            <Image 
              source={{ uri: customBackgroundUri }} 
              style={[styles.preview, styles.customPreview, backgroundId === 'custom' && styles.previewSelected]} 
            />
          ) : (
            <View style={[styles.preview, styles.addCustom]}>
              <TablerIcon name="plus" size={20} color={colors.textMuted} />
            </View>
          )}
          {backgroundId === 'custom' && customBackgroundUri && (
            <View style={[styles.checkmark, styles.checkmarkCustom]}>
              <TablerIcon name="check" size={12} color={colors.text} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    position: 'relative',
  },
  optionSelected: {},
  preview: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewSelected: {
    borderColor: colors.primary,
  },
  customPreview: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imagePreview: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addCustom: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderStyle: 'dashed',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkCustom: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default BackgroundPicker;
