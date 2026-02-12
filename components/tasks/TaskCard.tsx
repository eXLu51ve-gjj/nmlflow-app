import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import TablerIcon from '@/components/TablerIcon';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

export interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  address?: string;
  phone?: string;
  priority?: 'low' | 'medium' | 'high';
  deadline?: string;
  assigneeIds?: string[];
  tags?: string[];
  commentsCount?: number;
  attachmentsCount?: number;
  coverImage?: string;
  onPress?: () => void;
}

export function TaskCard({
  title,
  address,
  priority = 'low',
  deadline,
  commentsCount = 0,
  attachmentsCount = 0,
  coverImage,
  onPress,
}: TaskCardProps) {
  const getPriorityStyle = () => {
    switch (priority) {
      case 'high': return { icon: 'flame' as const, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'medium': return { icon: 'alert-circle' as const, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      default: return { icon: 'circle-check' as const, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
  };

  const priorityStyle = getPriorityStyle();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {coverImage && (
        <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
      )}
      
      <View style={styles.content}>
        {/* Priority indicator */}
        <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
          <TablerIcon name={priorityStyle.icon} size={12} color={priorityStyle.color} />
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>

        {/* Address */}
        {address && (
          <View style={styles.addressRow}>
            <TablerIcon name="map-pin" size={12} color={colors.textMuted} />
            <Text style={styles.addressText} numberOfLines={1}>{address}</Text>
          </View>
        )}

        {/* Footer with stats */}
        <View style={styles.footer}>
          {deadline && (
            <View style={styles.stat}>
              <TablerIcon name="clock" size={12} color={colors.textMuted} />
              <Text style={styles.statText}>
                {new Date(deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          )}
          
          <View style={styles.statsRight}>
            {commentsCount > 0 && (
              <View style={styles.stat}>
                <TablerIcon name="message" size={12} color={colors.textMuted} />
                <Text style={styles.statText}>{commentsCount}</Text>
              </View>
            )}
            {attachmentsCount > 0 && (
              <View style={styles.stat}>
                <TablerIcon name="paperclip" size={12} color={colors.textMuted} />
                <Text style={styles.statText}>{attachmentsCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 100,
  },
  content: {
    padding: spacing.sm,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addressText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginLeft: 4,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});

export default TaskCard;
