import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { KanbanColumn, KanbanColumnProps } from './KanbanColumn';
import { TaskCardProps } from './TaskCard';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface Column {
  id: string;
  name: string;
  color?: string;
}

export interface KanbanBoardProps {
  columns: Column[];
  tasks: TaskCardProps[];
  onTaskPress?: (taskId: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

export function KanbanBoard({
  columns,
  tasks,
  onTaskPress,
  refreshing = false,
  onRefresh,
  initialPage = 0,
  onPageChange,
}: KanbanBoardProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const pagerRef = useRef<PagerView>(null);

  const handlePageSelected = (e: any) => {
    const page = e.nativeEvent.position;
    setCurrentPage(page);
    onPageChange?.(page);
  };

  // Group tasks by column/status
  const getTasksForColumn = (columnId: string): TaskCardProps[] => {
    return tasks.filter(task => (task as any).status === columnId);
  };

  return (
    <View style={styles.container}>
      {/* Column indicator dots */}
      <View style={styles.dotsContainer}>
        {columns.map((col, index) => (
          <View
            key={col.id}
            style={[
              styles.dot,
              currentPage === index && styles.dotActive,
              currentPage === index && col.color && { backgroundColor: col.color },
            ]}
          />
        ))}
      </View>

      {/* Current column name */}
      <View style={styles.columnNameContainer}>
        <Text style={styles.currentColumnName}>
          {columns[currentPage]?.name || ''}
        </Text>
        <Text style={styles.swipeHint}>
          {currentPage > 0 && '← '}
          Свайп для переключения
          {currentPage < columns.length - 1 && ' →'}
        </Text>
      </View>

      {/* Pager View */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialPage}
        onPageSelected={handlePageSelected}
        overdrag={true}
      >
        {columns.map((column) => (
          <View key={column.id} style={styles.page}>
            <KanbanColumn
              id={column.id}
              name={column.name}
              color={column.color}
              tasks={getTasksForColumn(column.id)}
              onTaskPress={onTaskPress}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          </View>
        ))}
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  columnNameContainer: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  currentColumnName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  swipeHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
});

export default KanbanBoard;
