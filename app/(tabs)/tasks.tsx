import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Animated, Dimensions, Modal, TextInput, Image, Linking, Alert, ActivityIndicator, PanResponder, FlatList } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '@/store';
import { tasksAPI, projectsAPI, getServerUrl } from '@/lib/api';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import TablerIcon from '@/components/TablerIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

const FIXED_COLUMNS = [
  { id: 'todo', name: 'К выполнению' },
  { id: 'in-progress', name: 'В работе' },
  { id: 'done', name: 'Готово' },
];

interface Task {
  id: string;
  title: string;
  description?: string;
  address?: string;
  phone?: string;
  status: string;
  priority?: string;
  deadline?: string;
  assigneeIds?: string[];
  tags: string[];
  comments: any[];
  attachments: string[];
  coverImage?: string;
  projectId: string;
  createdAt: string;
}

export default function TasksScreen() {
  const { user, tasks, setTasks, projects, setProjects, showAllTasks, teamMembers, selectedProjectId, setSelectedProjectId, uiOpacity } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const horizontalScrollRef = useRef<ScrollView>(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SWIPE_THRESHOLD) closeTaskModal();
        else Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  useEffect(() => {
    loadData();
    getServerUrl().then(url => setServerUrl(url || ''));
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) setSelectedProjectId(projects[0].id);
  }, [projects]);

  // Update selectedTask when tasks change
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks]);

  const loadData = async () => {
    try {
      const [tasksData, projectsData] = await Promise.all([tasksAPI.getAll(), projectsAPI.getAll()]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setModalVisible(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeTaskModal = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => {
      setModalVisible(false);
      setSelectedTask(null);
      setComment('');
      panY.setValue(0);
    });
  };

  const getProjectColumns = () => {
    const project = projects.find(p => p.id === selectedProjectId);
    return project?.columns || FIXED_COLUMNS.map(c => ({ id: c.id, name: { ru: c.name }, color: '#8b5cf6' }));
  };

  const getColumnName = (status: string): string => {
    const columns = getProjectColumns();
    const col = columns.find((c: any) => c.id === status);
    if (col?.name?.ru) return col.name.ru;
    if (typeof col?.name === 'string') return col.name;
    return status;
  };

  const myTasks = tasks.filter(t => {
    if (selectedProjectId && t.projectId !== selectedProjectId) return false;
    if (!showAllTasks && user?.teamMemberId) return t.assigneeIds?.includes(user.teamMemberId);
    return showAllTasks;
  });
  
  // Get project columns (without "Все")
  const allColumns = getProjectColumns();
  const currentColumn = allColumns[currentColumnIndex] || allColumns[0];
  const filteredTasks = myTasks.filter(t => t.status === currentColumn?.id);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentColumnIndex && index >= 0 && index < allColumns.length) {
      setCurrentColumnIndex(index);
    }
  };

  const scrollToColumn = (index: number) => {
    horizontalScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentColumnIndex(index);
  };

  const handleCall = () => {
    if (selectedTask?.phone) Linking.openURL(`tel:${selectedTask.phone}`);
  };

  const handleMap = () => {
    if (selectedTask?.address) {
      const encoded = encodeURIComponent(selectedTask.address);
      Linking.openURL(`https://maps.google.com/?q=${encoded}`);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTask || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await tasksAPI.update(selectedTask.id, { status: newStatus });
      const updatedTasks = tasks.map(t => t.id === selectedTask.id ? { ...t, status: newStatus } : t);
      setTasks(updatedTasks);
      setSelectedTask({ ...selectedTask, status: newStatus });
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить статус');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !selectedTask || sendingComment) return;
    setSendingComment(true);
    try {
      await tasksAPI.addComment(selectedTask.id, comment.trim());
      await loadData();
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) setSelectedTask(updatedTask);
      setComment('');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось добавить комментарий');
    } finally {
      setSendingComment(false);
    }
  };

  const handlePickImage = async () => {
    if (!selectedTask || uploadingImage) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingImage(true);
      try {
        const asset = result.assets[0];
        console.log('Uploading image...');
        
        const response = await fetch(`${serverUrl}/api/upload`, { 
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            base64: asset.base64,
            filename: `photo_${Date.now()}.jpg`,
          }),
        });
        
        console.log('Upload response status:', response.status);
        const data = await response.json();
        console.log('Upload response data:', data);
        
        if (data.url) {
          const newAttachments = [...(selectedTask.attachments || []), data.url];
          await tasksAPI.update(selectedTask.id, { attachments: newAttachments });
          const updatedTasks = tasks.map(t => t.id === selectedTask.id ? { ...t, attachments: newAttachments } : t);
          setTasks(updatedTasks);
          setSelectedTask({ ...selectedTask, attachments: newAttachments });
        } else {
          Alert.alert('Ошибка', data.error || 'Не удалось загрузить фото');
        }
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Ошибка', 'Не удалось загрузить фото');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return { name: 'flame' as const, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'medium': return { name: 'alert-circle' as const, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      default: return { name: 'circle-check' as const, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'done') return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' };
    if (status === 'in-progress') return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' };
    return { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa' };
  };

  const columns = getProjectColumns();
  const currentProject = projects.find(p => p.id === selectedProjectId);

  const rightAction = (
    <Text style={styles.countText}>{filteredTasks.length}</Text>
  );

  const handleTitlePress = () => {
    if (projects.length <= 1) return;
    const currentIndex = projects.findIndex(p => p.id === selectedProjectId);
    const nextIndex = (currentIndex + 1) % projects.length;
    setSelectedProjectId(projects[nextIndex].id);
    setCurrentColumnIndex(0);
    horizontalScrollRef.current?.scrollTo({ x: 0, animated: false });
  };

  const renderTaskCard = (task: Task, index: number, tasksInColumn: Task[]) => {
    const priority = getPriorityIcon(task.priority);
    const statusStyle = getStatusColor(task.status);
    const canMoveUp = index > 0;
    const canMoveDown = index < tasksInColumn.length - 1;
    
    const handleMoveUp = async (e: any) => {
      e.stopPropagation();
      if (!canMoveUp) return;
      const newOrder = [...tasksInColumn];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      const updatedTasks = tasks.map(t => {
        const orderIndex = newOrder.findIndex(nt => nt.id === t.id);
        if (orderIndex !== -1) {
          return { ...t, order: orderIndex };
        }
        return t;
      });
      setTasks(updatedTasks);
      // Save order to server
      try {
        await tasksAPI.update(task.id, { order: index - 1 });
        await tasksAPI.update(tasksInColumn[index - 1].id, { order: index });
      } catch (error) {
        console.error('Failed to update order:', error);
      }
    };
    
    const handleMoveDown = async (e: any) => {
      e.stopPropagation();
      if (!canMoveDown) return;
      const newOrder = [...tasksInColumn];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      const updatedTasks = tasks.map(t => {
        const orderIndex = newOrder.findIndex(nt => nt.id === t.id);
        if (orderIndex !== -1) {
          return { ...t, order: orderIndex };
        }
        return t;
      });
      setTasks(updatedTasks);
      try {
        await tasksAPI.update(task.id, { order: index + 1 });
        await tasksAPI.update(tasksInColumn[index + 1].id, { order: index });
      } catch (error) {
        console.error('Failed to update order:', error);
      }
    };
    
    return (
      <View key={task.id} style={styles.taskCardWrapper}>
        <TouchableOpacity style={[styles.taskCard, { backgroundColor: `rgba(30, 20, 50, ${uiOpacity})` }]} onPress={() => openTaskModal(task)} activeOpacity={0.7}>
          <View style={styles.taskRow}>
            <View style={[styles.priorityIcon, { backgroundColor: priority.bg }]}>
              <TablerIcon name={priority.name} size={18} color={priority.color} />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
              <View style={styles.taskMetaRow}>
                {task.address && (
                  <View style={[styles.taskMeta, { flex: 1, marginRight: 8 }]}>
                    <TablerIcon name="map-pin" size={14} color={colors.textMuted} />
                    <Text style={[styles.taskMetaText, { flex: 1 }]} numberOfLines={1}>{task.address}</Text>
                  </View>
                )}
                {task.phone && (
                  <View style={styles.taskMeta}>
                    <TablerIcon name="phone" size={14} color={colors.textMuted} />
                    <Text style={styles.taskMetaText}>{task.phone}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.moveButtons}>
              <TouchableOpacity onPress={handleMoveUp} disabled={!canMoveUp} style={[styles.moveBtn, !canMoveUp && styles.moveBtnDisabled]}>
                <TablerIcon name="chevron-up" size={16} color={canMoveUp ? colors.text : colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMoveDown} disabled={!canMoveDown} style={[styles.moveBtn, !canMoveDown && styles.moveBtnDisabled]}>
                <TablerIcon name="chevron-down" size={16} color={canMoveDown ? colors.text : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.taskBottom}>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{getColumnName(task.status)}</Text>
            </View>
            <View style={styles.taskStats}>
              <View style={styles.statItem}>
                <TablerIcon name="calendar" size={12} color={colors.textMuted} />
                <Text style={styles.statText}>{new Date(task.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</Text>
              </View>
              {task.comments?.length > 0 && (
                <View style={styles.statItem}>
                  <TablerIcon name="message" size={12} color={colors.textMuted} />
                  <Text style={styles.statText}>{task.comments.length}</Text>
                </View>
              )}
              {task.attachments?.length > 0 && (
                <View style={styles.statItem}>
                  <TablerIcon name="paperclip" size={12} color={colors.textMuted} />
                  <Text style={styles.statText}>{task.attachments.length}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const getTasksForColumn = (columnId: string) => {
    const filtered = myTasks.filter(t => t.status === columnId);
    return filtered.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  };

  return (
    <ScreenWrapper title={currentProject?.name || 'Задачи'} rightAction={rightAction} onTitlePress={projects.length > 1 ? handleTitlePress : undefined}>
      {/* Column tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {allColumns.map((col, index) => {
            const colName = typeof col.name === 'string' ? col.name : col.name?.ru || col.id;
            const isActive = currentColumnIndex === index;
            const taskCount = getTasksForColumn(col.id).length;
            return (
              <TouchableOpacity 
                key={col.id} 
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => scrollToColumn(index)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{colName}</Text>
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{taskCount}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Swipeable columns */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.horizontalScroll}
      >
        {allColumns.map((col, colIndex) => {
          const columnTasks = getTasksForColumn(col.id);
          return (
            <View key={col.id} style={styles.columnPage}>
              <ScrollView 
                style={styles.scroll} 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
              >
                {columnTasks.length === 0 ? (
                  <View style={styles.empty}>
                    <View style={styles.emptyIconContainer}>
                      <TablerIcon name="clipboard" size={48} color={colors.textMuted} />
                    </View>
                    <Text style={styles.emptyText}>Нет задач</Text>
                    <Text style={styles.emptySubtext}>Задачи появятся здесь</Text>
                  </View>
                ) : (
                  columnTasks.map((task, index) => renderTaskCard(task, index, columnTasks))
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Sheet Modal */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeTaskModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeTaskModal} />
          <Animated.View style={[styles.bottomSheet, { backgroundColor: `rgba(20, 15, 35, ${uiOpacity})`, transform: [{ translateY: Animated.add(slideAnim, panY) }] }]}>
            <View {...panResponder.panHandlers} style={styles.sheetHandleArea}>
              <View style={styles.sheetHandle} />
            </View>
            {selectedTask && (
              <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
                {selectedTask.coverImage && <Image source={{ uri: selectedTask.coverImage }} style={styles.coverImage} resizeMode="cover" />}
                <View style={styles.sheetHeader}>
                  <View style={[styles.priorityIconLarge, { backgroundColor: getPriorityIcon(selectedTask.priority).bg }]}>
                    <TablerIcon name={getPriorityIcon(selectedTask.priority).name} size={24} color={getPriorityIcon(selectedTask.priority).color} />
                  </View>
                  <View style={styles.sheetHeaderInfo}>
                    <Text style={styles.sheetTitle}>{selectedTask.title}</Text>
                    <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedTask.status).bg }]}>
                      <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedTask.status).text }]}>{getColumnName(selectedTask.status)}</Text>
                    </View>
                  </View>
                </View>
                {selectedTask.description && (
                  <View style={styles.sheetSection}>
                    <Text style={styles.sectionLabel}>Описание</Text>
                    <Text style={styles.sectionText}>{selectedTask.description}</Text>
                  </View>
                )}
                <View style={styles.detailsGrid}>
                  {selectedTask.address && (
                    <TouchableOpacity style={styles.detailItem} onPress={handleMap}>
                      <View style={[styles.detailIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                        <TablerIcon name="map-pin" size={18} color="#3b82f6" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Адрес</Text>
                        <Text style={styles.detailValue}>{selectedTask.address}</Text>
                      </View>
                      <TablerIcon name="external-link" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                  {selectedTask.phone && (
                    <TouchableOpacity style={styles.detailItem} onPress={handleCall}>
                      <View style={[styles.detailIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <TablerIcon name="phone" size={18} color="#10b981" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Телефон</Text>
                        <Text style={styles.detailValue}>{selectedTask.phone}</Text>
                      </View>
                      <TablerIcon name="external-link" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                  {selectedTask.deadline && (
                    <View style={styles.detailItem}>
                      <View style={[styles.detailIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <TablerIcon name="calendar" size={18} color="#f59e0b" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Дедлайн</Text>
                        <Text style={styles.detailValue}>{new Date(selectedTask.deadline).toLocaleDateString('ru-RU')}</Text>
                      </View>
                    </View>
                  )}
                </View>
                {selectedTask.tags?.length > 0 && (
                  <View style={styles.sheetSection}>
                    <Text style={styles.sectionLabel}>Теги</Text>
                    <View style={styles.tagsRow}>
                      {selectedTask.tags.map((tag, i) => (
                        <View key={i} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
                      ))}
                    </View>
                  </View>
                )}
                <View style={styles.sheetSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>Вложения ({selectedTask.attachments?.length || 0})</Text>
                    <TouchableOpacity style={styles.addAttachmentBtn} onPress={handlePickImage} disabled={uploadingImage}>
                      {uploadingImage ? <ActivityIndicator size="small" color={colors.primary} /> : (
                        <><TablerIcon name="camera" size={16} color={colors.primary} /><Text style={styles.addAttachmentText}>Добавить</Text></>
                      )}
                    </TouchableOpacity>
                  </View>
                  {selectedTask.attachments?.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.attachmentsRow}>
                        {selectedTask.attachments.map((att, i) => {
                          const imageUrl = att.startsWith('http') ? att : `${serverUrl}${att}`;
                          return <Image key={i} source={{ uri: imageUrl }} style={styles.attachmentImage} />;
                        })}
                      </View>
                    </ScrollView>
                  ) : (
                    <Text style={{ color: colors.textMuted, fontSize: fontSize.xs }}>Нет вложений</Text>
                  )}
                </View>
                <View style={styles.sheetSection}>
                  <Text style={styles.sectionLabel}>Статус</Text>
                  <View style={styles.statusButtons}>
                    {columns.map((col: any) => (
                      <TouchableOpacity key={col.id}
                        style={[styles.statusBtn, selectedTask.status === col.id && styles.statusBtnActive]}
                        onPress={() => handleStatusChange(col.id)} disabled={updatingStatus}>
                        <Text style={[styles.statusBtnText, selectedTask.status === col.id && styles.statusBtnTextActive]}>
                          {typeof col.name === 'string' ? col.name : col.name?.ru || col.id}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.sheetSection}>
                  <Text style={styles.sectionLabel}>Комментарии ({selectedTask.comments?.length || 0})</Text>
                  {selectedTask.comments?.map(c => {
                    const author = teamMembers.find(m => m.id === c.authorId);
                    return (
                      <View key={c.id} style={styles.comment}>
                        <Image source={{ uri: author?.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${c.authorName}` }} style={styles.commentAvatar} />
                        <View style={styles.commentContent}>
                          <Text style={styles.commentAuthor}>{c.authorName}</Text>
                          <Text style={styles.commentText}>{c.text}</Text>
                          <Text style={styles.commentTime}>{new Date(c.createdAt).toLocaleString('ru-RU')}</Text>
                        </View>
                      </View>
                    );
                  })}
                  <View style={styles.addComment}>
                    <TextInput style={styles.commentInput} placeholder="Написать комментарий..." placeholderTextColor={colors.textMuted}
                      value={comment} onChangeText={setComment} multiline />
                    <TouchableOpacity style={[styles.sendBtn, (!comment.trim() || sendingComment) && styles.sendBtnDisabled]}
                      onPress={handleAddComment} disabled={!comment.trim() || sendingComment}>
                      <TablerIcon name="arrow-up" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ height: 60 }} />
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeButtonBottom} onPress={closeTaskModal}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M7 7l5 5l5 -5" /><Path d="M7 13l5 5l5 -5" />
              </Svg>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}


const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, flexGrow: 1, justifyContent: 'flex-end' },
  horizontalScroll: { flex: 1 },
  columnPage: { width: SCREEN_WIDTH, flex: 1 },
  tabsContainer: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  tabs: { paddingHorizontal: spacing.md, gap: spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, gap: spacing.xs },
  tabActive: { backgroundColor: colors.glass },
  tabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500' },
  tabTextActive: { color: colors.text },
  tabBadge: { backgroundColor: colors.glass, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.sm, minWidth: 20, alignItems: 'center' },
  tabBadgeActive: { backgroundColor: colors.primary },
  tabBadgeText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  tabBadgeTextActive: { color: colors.text },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  filterBtn: { padding: spacing.xs },
  countText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '500' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.glass, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  emptySubtext: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
  taskCardWrapper: { marginBottom: spacing.md },
  taskCard: { backgroundColor: colors.glass, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.md },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  moveButtons: { flexDirection: 'column', marginLeft: spacing.sm },
  moveBtn: { padding: 4 },
  moveBtnDisabled: { opacity: 0.3 },
  priorityIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  taskInfo: { flex: 1 },
  taskTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginBottom: 4 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  taskMeta: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  taskMetaText: { color: colors.textMuted, fontSize: fontSize.sm, marginLeft: 4 },
  taskBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.glassBorder },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  statusText: { fontSize: fontSize.xs, fontWeight: '500' },
  taskStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { color: colors.textMuted, fontSize: fontSize.xs },
  filterModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  filterModalContent: { backgroundColor: colors.backgroundLight, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  filterModalTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  filterSection: { marginBottom: spacing.lg },
  filterSectionTitle: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.sm },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  filterOption: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 8, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
  filterOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterOptionText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '500' },
  filterOptionTextActive: { color: colors.text },
  filterApplyBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.md },
  filterApplyText: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  bottomSheet: { backgroundColor: colors.backgroundLight, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: SCREEN_HEIGHT * 0.85, paddingBottom: 20 },
  sheetHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center' },
  sheetHandleArea: { paddingVertical: spacing.md, alignItems: 'center' },
  closeButtonBottom: { alignSelf: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  sheetContent: { paddingHorizontal: spacing.lg },
  coverImage: { width: '100%', height: 180, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  priorityIconLarge: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  sheetHeaderInfo: { flex: 1 },
  sheetTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: 'bold', marginBottom: spacing.xs },
  statusBadgeLarge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
  statusTextLarge: { fontSize: fontSize.sm, fontWeight: '500' },
  sheetSection: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  sectionText: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  detailsGrid: { marginBottom: spacing.lg },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  detailIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  detailTextContainer: { flex: 1 },
  detailLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  detailValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '500' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { backgroundColor: colors.primary + '30', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  tagText: { color: colors.primaryLight, fontSize: fontSize.xs },
  addAttachmentBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  addAttachmentText: { color: colors.primary, fontSize: fontSize.sm },
  attachmentsRow: { flexDirection: 'row', gap: spacing.sm },
  attachmentImage: { width: 80, height: 80, borderRadius: borderRadius.md },
  statusButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  statusBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
  statusBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusBtnText: { color: colors.textSecondary, fontSize: fontSize.sm },
  statusBtnTextActive: { color: colors.text, fontWeight: '500' },
  comment: { flexDirection: 'row', marginBottom: spacing.md },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: spacing.sm },
  commentContent: { flex: 1, backgroundColor: colors.glass, borderRadius: borderRadius.md, padding: spacing.sm },
  commentAuthor: { color: colors.primaryLight, fontSize: fontSize.sm, fontWeight: '500' },
  commentText: { color: colors.text, fontSize: fontSize.sm, marginTop: 2 },
  commentTime: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  addComment: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm, gap: spacing.sm },
  commentInput: { flex: 1, backgroundColor: colors.glass, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: fontSize.sm, maxHeight: 80 },
  sendBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
