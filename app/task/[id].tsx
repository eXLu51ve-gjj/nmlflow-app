import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store';
import { tasksAPI, projectsAPI } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, tasks, setTasks, projects, setProjects, teamMembers } = useStore();
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const task = tasks.find(t => t.id === id);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksData, projectsData] = await Promise.all([
        tasksAPI.getAll(),
        projectsAPI.getAll(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColumnName = (status: string) => {
    for (const project of projects) {
      const col = project.columns?.find(c => c.id === status);
      if (col) return col.name.ru;
    }
    return status;
  };

  const getColumns = () => {
    const project = projects.find(p => p.id === task?.projectId);
    return project?.columns || [];
  };

  const handleCall = () => {
    if (task?.phone) {
      Linking.openURL(`tel:${task.phone}`);
    }
  };

  const handleMap = () => {
    if (task?.address) {
      const encoded = encodeURIComponent(task.address);
      Linking.openURL(`https://maps.google.com/?q=${encoded}`);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;
    
    try {
      await tasksAPI.update(task.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      Alert.alert('Успешно', 'Статус обновлён');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить статус');
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !task) return;
    
    setSendingComment(true);
    try {
      await tasksAPI.addComment(task.id, comment.trim());
      await loadData();
      setComment('');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить комментарий');
    } finally {
      setSendingComment(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      default: return colors.success;
    }
  };

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'high': return 'Срочно';
      case 'medium': return 'Средний';
      default: return 'Низкий';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.loadingText}>Задача не найдена</Text>
          <Button title="Назад" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const columns = getColumns();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Задача</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Title & Priority */}
        <View style={styles.titleRow}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '30' }]}>
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
            <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
              {getPriorityText(task.priority)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.title}>{task.title}</Text>

        {/* Status */}
        <GlassCard style={styles.statusCard}>
          <Text style={styles.statusLabel}>Статус</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.statusButtons}>
              {columns.map(col => (
                <TouchableOpacity
                  key={col.id}
                  style={[
                    styles.statusBtn,
                    task.status === col.id && styles.statusBtnActive
                  ]}
                  onPress={() => handleStatusChange(col.id)}
                >
                  <Text style={[
                    styles.statusBtnText,
                    task.status === col.id && styles.statusBtnTextActive
                  ]}>
                    {col.name.ru}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </GlassCard>

        {/* Info */}
        {(task.address || task.phone || task.deadline) && (
          <GlassCard style={styles.infoCard}>
            {task.address && (
              <TouchableOpacity style={styles.infoRow} onPress={handleMap}>
                <Ionicons name="location" size={18} color={colors.primary} />
                <Text style={styles.infoText}>{task.address}</Text>
                <Ionicons name="open-outline" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            
            {task.phone && (
              <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                <Ionicons name="call" size={18} color={colors.success} />
                <Text style={styles.infoText}>{task.phone}</Text>
                <Ionicons name="open-outline" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            
            {task.deadline && (
              <View style={styles.infoRow}>
                <Ionicons name="time" size={18} color={colors.warning} />
                <Text style={styles.infoText}>
                  {new Date(task.deadline).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Description */}
        {task.description && (
          <GlassCard>
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.description}>{task.description}</Text>
          </GlassCard>
        )}

        {/* Attachments */}
        {task.attachments?.length > 0 && (
          <GlassCard>
            <Text style={styles.sectionTitle}>Вложения ({task.attachments.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.attachments}>
                {task.attachments.map((att, i) => (
                  <Image key={i} source={{ uri: att }} style={styles.attachment} />
                ))}
              </View>
            </ScrollView>
          </GlassCard>
        )}

        {/* Comments */}
        <GlassCard>
          <Text style={styles.sectionTitle}>Комментарии ({task.comments?.length || 0})</Text>
          
          {task.comments?.map(c => {
            const author = teamMembers.find(m => m.id === c.authorId);
            return (
              <View key={c.id} style={styles.comment}>
                <Image 
                  source={{ uri: author?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${c.authorName}` }} 
                  style={styles.commentAvatar} 
                />
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>{c.authorName}</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(c.createdAt).toLocaleString('ru-RU')}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Add Comment */}
          <View style={styles.addComment}>
            <TextInput
              style={styles.commentInput}
              placeholder="Написать комментарий..."
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!comment.trim() || sendingComment) && styles.sendBtnDisabled]}
              onPress={handleAddComment}
              disabled={!comment.trim() || sendingComment}
            >
              <Ionicons name="send" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  priorityText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
  },
  statusCard: {
    paddingVertical: spacing.md,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statusBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  statusBtnTextActive: {
    color: colors.text,
    fontWeight: '500',
  },
  infoCard: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    color: colors.text,
    fontSize: fontSize.sm,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  attachments: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  attachment: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
  },
  comment: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  commentContent: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  commentAuthor: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  commentText: {
    color: colors.text,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  commentTime: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  addComment: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSize.sm,
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
