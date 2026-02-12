import React from 'react';
import { View, StyleSheet, ImageBackground, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenu } from '@/components/providers/MenuProvider';
import { useBackground } from '@/components/providers/BackgroundProvider';
import { useStore } from '@/store';
import { PRESET_IMAGES } from '@/components/settings/BackgroundPicker';
import TablerIcon from '@/components/TablerIcon';
import { colors, fontSize, spacing, borderRadius } from '@/constants/theme';

export { useStore } from '@/store';

interface ScreenWrapperProps {
  children: React.ReactNode;
  title: string;
  showMenuButton?: boolean;
  rightAction?: React.ReactNode;
  onTitlePress?: () => void;
}

export function ScreenWrapper({ children, title, showMenuButton = true, rightAction, onTitlePress }: ScreenWrapperProps) {
  const { backgroundId, backgrounds } = useBackground();
  const { customBackgroundUri, backgroundOverlay } = useStore();
  const insets = useSafeAreaInsets();
  const { openMenu } = useMenu();
  const currentBackground = backgrounds.find(b => b.id === backgroundId) || backgrounds[0];

  const renderBackground = () => {
    // Check for preset images
    if (backgroundId.startsWith('preset-')) {
      const preset = PRESET_IMAGES.find(p => p.id === backgroundId);
      if (preset) {
        return (
          <ImageBackground 
            source={preset.source} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        );
      }
    }
    
    // Custom image from gallery
    if (backgroundId === 'custom' && customBackgroundUri) {
      return (
        <ImageBackground 
          source={{ uri: customBackgroundUri }} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      );
    }
    
    // Gradient backgrounds
    return (
      <LinearGradient
        colors={currentBackground.colors as [string, string, ...string[]]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderBackground()}
      {/* Dark overlay */}
      <View style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${backgroundOverlay})` }]} />
      <View style={[styles.mainContent, { paddingTop: insets.top }]}>
        <View style={styles.scrollContent}>
          {children}
        </View>
        
        {/* Bottom Bar */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.bottomBarContent}>
            {/* Menu Button */}
            {showMenuButton && (
              <TouchableOpacity 
                onPress={openMenu}
                style={styles.menuButton}
                activeOpacity={0.7}
              >
                <TablerIcon name="menu-2" size={24} color={colors.text} />
              </TouchableOpacity>
            )}

            {/* Title */}
            {onTitlePress ? (
              <TouchableOpacity 
                style={styles.titleContainer}
                onPress={onTitlePress}
                activeOpacity={0.7}
              >
                <TablerIcon name="chevron-left" size={20} color={colors.text} style={styles.chevron} />
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <TablerIcon name="chevron-right" size={20} color={colors.text} style={styles.chevron} />
              </TouchableOpacity>
            ) : (
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
              </View>
            )}

            {/* Right Action */}
            <View style={styles.rightSection}>
              {rightAction}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  bottomBar: {
    backgroundColor: 'transparent',
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing.md,
  },
  menuButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  chevron: {
    opacity: 0.7,
  },
  rightSection: {
    minWidth: 48,
    alignItems: 'flex-end',
  },
});
