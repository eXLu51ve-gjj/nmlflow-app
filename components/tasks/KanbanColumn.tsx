import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { TaskCard, TaskCardProps } from './TaskCard';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface KanbanColumnProps {
  id: string;
  name: string;
  color?: string;
  tasks: TaskCardProps[];
  onTaskPress?: (taskId: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function KanbanColumn({
  name,
  color = colors.primary,
  tasks,
  onTaskPress,
  refreshing = false,
  onRefresh,
}: KanbanColumnProps) {
  return (
    <View style={styles.container}>
      {/* Column Header */}
      <View style={styles.header}>
        <View style={[styles.colorIndicator, { backgroundColor: color }]} />
        <Text style={styles.columnName}>{name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{tasks.length}</Text>
        </View>
      </View>

      {/* Tasks List */}
      <ScrollView
        style={styles.tasksList}
        contentContainerStyle={styles.tasksContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          ) : undefined
        }
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Нет задач</Text>
          </View>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              {...task}
              onPress={() => onTaskPress?.(task.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - spacing.lg * 2,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  colorIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  columnName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  tasksList: {
    flex: 1,
  },
  tasksContent: {
    paddingBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});

export default KanbanColumn;
