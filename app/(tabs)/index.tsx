import { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, Dimensions, Modal, TextInput, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { useStore } from '@/store';
import { tasksAPI, workdaysAPI, settingsAPI, teamAPI, chatAPI, projectsAPI, leadsAPI, getServerUrl } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import TablerIcon from '@/components/TablerIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 2;
const CHART_HEIGHT = 280;
const CENTER_X = CHART_WIDTH / 2;
const CENTER_Y = CHART_HEIGHT / 2;
const BASE_RADIUS = 70;
const INNER_RADIUS = 35;
const CENTER_CIRCLE_RADIUS = 30;

interface Activity {
  id: string;
  type: string;
  action: string;
  subject: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
}

// Translate actions to Russian
const translateAction = (action: string): string => {
  const translations: Record<string, string> = {
    'created': 'создал',
    'updated': 'обновил',
    'deleted': 'удалил',
    'completed': 'завершил',
    'assigned': 'назначил',
    'commented': 'прокомментировал',
    'moved': 'переместил',
    'archived': 'архивировал',
  };
  return translations[action.toLowerCase()] || action;
};

export default function HomeScreen() {
  const { user, tasks, setTasks, workDays, setWorkDays, salaryPayday, setSalaryPayday, teamMembers, setTeamMembers, setChatMessages, projects, setProjects, showAllTasks } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [leads, setLeads] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    description: '', 
    address: '', 
    phone: '',
    projectId: '',
    status: '',
    assigneeIds: [] as string[],
  });
  const [creating, setCreating] = useState(false);
  const [chartAnimated, setChartAnimated] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  // Animate chart when activities load
  useEffect(() => {
    if (activities.length > 0 && !chartAnimated) {
      setChartAnimated(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [activities]);

  // Set default project when projects load
  useEffect(() => {
    if (projects.length > 0 && !newTask.projectId) {
      const firstProject = projects[0];
      setNewTask(prev => ({
        ...prev,
        projectId: firstProject.id,
        status: firstProject.columns?.[0]?.id || 'todo',
      }));
    }
  }, [projects]);

  const loadData = async () => {
    try {
      const [tasksData, workdaysData, settingsData, teamData, messagesData, projectsData] = await Promise.all([
        tasksAPI.getAll(),
        workdaysAPI.getAll(),
        settingsAPI.get(),
        teamAPI.getAll(),
        chatAPI.getMessages(user?.id).catch(() => []),
        projectsAPI.getAll().catch(() => []),
      ]);
      
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setWorkDays(Array.isArray(workdaysData) ? workdaysData : []);
      setTeamMembers(Array.isArray(teamData) ? teamData : []);
      setChatMessages(Array.isArray(messagesData) ? messagesData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      
      if (settingsData?.salaryPayday) {
        setSalaryPayday(settingsData.salaryPayday);
      }
      
      const messages = Array.isArray(messagesData) ? messagesData : [];
      const recent = messages.slice(-5).filter((m: any) => m.authorId !== user?.id);
      setUnreadMessages(recent.length);

      // Load admin data
      if (isAdmin) {
        const [leadsData, activitiesData] = await Promise.all([
          leadsAPI.getAll().catch(() => []),
          fetch(`${await getServerUrl()}/api/activities?limit=1000`)
            .then(r => r.json()).catch(() => []),
        ]);
        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Pie chart data - activity by team member
  const pieData = useMemo(() => {
    const activityByUser: Record<string, { name: string; count: number; color: string }> = {};
    const chartColors = ['#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
    
    activities.forEach(a => {
      if (!activityByUser[a.userName]) {
        const colorIndex = Object.keys(activityByUser).length % chartColors.length;
        activityByUser[a.userName] = { name: a.userName, count: 0, color: chartColors[colorIndex] };
      }
      activityByUser[a.userName].count++;
    });
    
    return Object.values(activityByUser).sort((a, b) => b.count - a.count);
  }, [activities]);

  const totalActivities = pieData.reduce((sum, d) => sum + d.count, 0);
  const maxPercent = pieData.length > 0 ? pieData[0].count / totalActivities : 0;

  // Generate pie chart with lines like website
  const generatePieChart = () => {
    if (pieData.length === 0) return null;
    
    const segments: { path: string; color: string; percent: number; midAngle: number; name: string; segRadius: number }[] = [];
    let cumulativePercent = 0;
    
    pieData.forEach((slice, index) => {
      const percent = slice.count / totalActivities;
      
      // Dynamic radius based on percentage
      const extraRadius = (percent / maxPercent) * 30;
      const segRadius = BASE_RADIUS + extraRadius;
      
      // Gap between segments
      const gapPx = 2;
      const outerGapAngle = gapPx / segRadius;
      const innerGapAngle = gapPx / INNER_RADIUS;
      
      const startAngle = 2 * Math.PI * cumulativePercent - Math.PI / 2;
      const endAngle = 2 * Math.PI * (cumulativePercent + percent) - Math.PI / 2;
      
      // Outer arc with gap
      const startX = CENTER_X + Math.cos(startAngle + outerGapAngle) * segRadius;
      const startY = CENTER_Y + Math.sin(startAngle + outerGapAngle) * segRadius;
      const endX = CENTER_X + Math.cos(endAngle - outerGapAngle) * segRadius;
      const endY = CENTER_Y + Math.sin(endAngle - outerGapAngle) * segRadius;
      
      // Inner arc with gap
      const innerStartX = CENTER_X + Math.cos(startAngle + innerGapAngle) * INNER_RADIUS;
      const innerStartY = CENTER_Y + Math.sin(startAngle + innerGapAngle) * INNER_RADIUS;
      const innerEndX = CENTER_X + Math.cos(endAngle - innerGapAngle) * INNER_RADIUS;
      const innerEndY = CENTER_Y + Math.sin(endAngle - innerGapAngle) * INNER_RADIUS;
      
      cumulativePercent += percent;
      const actualAngle = (endAngle - outerGapAngle) - (startAngle + outerGapAngle);
      const largeArcFlag = actualAngle > Math.PI ? 1 : 0;
      
      const pathData = [
        `M ${innerStartX} ${innerStartY}`,
        `L ${startX} ${startY}`,
        `A ${segRadius} ${segRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `L ${innerEndX} ${innerEndY}`,
        `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
        'Z',
      ].join(' ');
      
      const midPercent = cumulativePercent - percent / 2;
      const midAngle = 2 * Math.PI * midPercent - Math.PI / 2;
      
      segments.push({
        path: pathData,
        color: slice.color,
        percent,
        midAngle,
        name: slice.name,
        segRadius,
      });
    });
    
    return (
      <>
        {/* Segments */}
        {segments.map((seg, index) => (
          <G key={`seg-${index}`}>
            <Path
              d={seg.path}
              fill={seg.color}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={1.5}
            />
            {/* Percentage on segment if > 5% */}
            {seg.percent > 0.05 && (() => {
              const labelRadius = (seg.segRadius + INNER_RADIUS) / 2;
              const labelX = CENTER_X + Math.cos(seg.midAngle) * labelRadius;
              const labelY = CENTER_Y + Math.sin(seg.midAngle) * labelRadius;
              return (
                <SvgText
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                >
                  {Math.round(seg.percent * 100)}%
                </SvgText>
              );
            })()}
          </G>
        ))}
        
        {/* Lines with labels */}
        {segments.map((seg, index) => {
          const lineStartRadius = seg.segRadius + 5;
          const lineEndRadius = seg.segRadius + 35;
          const lineStartX = CENTER_X + Math.cos(seg.midAngle) * lineStartRadius;
          const lineStartY = CENTER_Y + Math.sin(seg.midAngle) * lineStartRadius;
          const lineEndX = CENTER_X + Math.cos(seg.midAngle) * lineEndRadius;
          const lineEndY = CENTER_Y + Math.sin(seg.midAngle) * lineEndRadius;
          
          // Horizontal line direction
          const isRight = seg.midAngle > -Math.PI / 2 && seg.midAngle < Math.PI / 2;
          const horizontalEndX = isRight ? lineEndX + 35 : lineEndX - 35;
          
          return (
            <G key={`line-${index}`}>
              {/* Diagonal line */}
              <Line
                x1={lineStartX}
                y1={lineStartY}
                x2={lineEndX}
                y2={lineEndY}
                stroke={seg.color}
                strokeWidth={1.5}
              />
              {/* Horizontal line */}
              <Line
                x1={lineEndX}
                y1={lineEndY}
                x2={horizontalEndX}
                y2={lineEndY}
                stroke={seg.color}
                strokeWidth={1.5}
              />
              {/* Dot at end */}
              <Circle
                cx={horizontalEndX}
                cy={lineEndY}
                r={2.5}
                fill={seg.color}
              />
              {/* Name label */}
              <SvgText
                x={isRight ? horizontalEndX + 6 : horizontalEndX - 6}
                y={lineEndY}
                textAnchor={isRight ? 'start' : 'end'}
                alignmentBaseline="middle"
                fill="white"
                fontSize={10}
              >
                {seg.name.split(' ')[0]}
              </SvgText>
            </G>
          );
        })}
        
        {/* Center circle */}
        <Circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={CENTER_CIRCLE_RADIUS}
          fill={colors.backgroundLight}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1.5}
        />
        <SvgText
          x={CENTER_X}
          y={CENTER_Y - 6}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="white"
          fontSize={18}
          fontWeight="bold"
        >
          {totalActivities}
        </SvgText>
        <SvgText
          x={CENTER_X}
          y={CENTER_Y + 10}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill={colors.textMuted}
          fontSize={9}
        >
          действий
        </SvgText>
      </>
    );
  };

  const getSalaryPeriod = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let startDate: Date, endDate: Date;
    if (salaryPayday === 1) {
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0);
    } else {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      startDate = new Date(prevYear, prevMonth, salaryPayday);
      endDate = new Date(currentYear, currentMonth, salaryPayday - 1);
    }
    return { startDate, endDate };
  };

  const calculateSalary = () => {
    if (!user?.teamMemberId) return 0;
    const member = teamMembers.find(m => m.id === user.teamMemberId);
    if (!member) return 0;
    const { startDate, endDate } = getSalaryPeriod();
    const myDays = workDays.filter(wd => {
      if (wd.memberId !== user.teamMemberId) return false;
      const wdDate = new Date(wd.date);
      return wdDate >= startDate && wdDate <= endDate;
    });
    let total = 0;
    myDays.forEach(wd => {
      let dayPay = member.dailyRate || 0;
      if (wd.isDouble) dayPay *= 2;
      if (wd.withCar) dayPay += member.carBonus || 0;
      total += dayPay;
    });
    return total;
  };

  const selectedProject = projects.find(p => p.id === newTask.projectId);
  const projectColumns = selectedProject?.columns || [];

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Ошибка', 'Введите название задачи');
      return;
    }
    if (!newTask.projectId) {
      Alert.alert('Ошибка', 'Выберите проект');
      return;
    }
    setCreating(true);
    try {
      await tasksAPI.create({
        title: newTask.title,
        description: newTask.description,
        address: newTask.address,
        phone: newTask.phone,
        projectId: newTask.projectId,
        status: newTask.status || projectColumns[0]?.id || 'todo',
        assigneeIds: newTask.assigneeIds,
      });
      setNewTask({ title: '', description: '', address: '', phone: '', projectId: projects[0]?.id || '', status: projects[0]?.columns?.[0]?.id || '', assigneeIds: [] });
      setShowAddTaskModal(false);
      await loadData();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать задачу');
    } finally {
      setCreating(false);
    }
  };

  const toggleAssignee = (memberId: string) => {
    setNewTask(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(memberId)
        ? prev.assigneeIds.filter(id => id !== memberId)
        : [...prev.assigneeIds, memberId],
    }));
  };

  const myTasks = showAllTasks 
    ? tasks 
    : tasks.filter(t => t.assigneeIds?.includes(user?.teamMemberId || ''));
  const pendingTasks = myTasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const activeLeads = leads.filter(l => l.status !== 'closed').length;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const getActivityIcon = (type: string, action: string) => {
    if (action.toLowerCase() === 'deleted') return 'trash';
    if (action.toLowerCase() === 'created') return 'plus';
    if (action.toLowerCase() === 'updated') return 'pencil';
    switch (type) {
      case 'task': return 'clipboard';
      case 'lead': return 'user';
      case 'team': return 'users';
      default: return 'activity';
    }
  };

  const getActivityColor = (action: string) => {
    if (action.toLowerCase() === 'deleted') return colors.error;
    if (action.toLowerCase() === 'created') return colors.success;
    if (action.toLowerCase() === 'updated') return colors.info;
    return colors.primary;
  };

  return (
    <ScreenWrapper title="Главная">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* User Info */}
        <View style={styles.userSection}>
          <Image source={{ uri: user?.avatar || `https://api.dicebear.com/9.x/initials/png?seed=${user?.name}` }} style={styles.avatar} />
          <View>
            <Text style={styles.greeting}>Привет, {user?.name?.split(' ')[0]}!</Text>
            <Text style={styles.role}>{isAdmin ? 'Администратор' : 'Сотрудник'}</Text>
          </View>
        </View>

        {isAdmin ? (
          <>
            {/* Admin Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCardSmall, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                <TablerIcon name="users" size={20} color="#6366f1" />
                <Text style={styles.statValueSmall}>{leads.length}</Text>
                <Text style={styles.statLabelSmall}>Лидов</Text>
              </View>
              <View style={[styles.statCardSmall, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <TablerIcon name="circle-check" size={20} color="#10b981" />
                <Text style={styles.statValueSmall}>{completedTasks}</Text>
                <Text style={styles.statLabelSmall}>Выполнено</Text>
              </View>
              <View style={[styles.statCardSmall, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <TablerIcon name="clock" size={20} color="#f59e0b" />
                <Text style={styles.statValueSmall}>{pendingTasks.length}</Text>
                <Text style={styles.statLabelSmall}>В работе</Text>
              </View>
              <View style={[styles.statCardSmall, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <TablerIcon name="flame" size={20} color="#8b5cf6" />
                <Text style={styles.statValueSmall}>{activeLeads}</Text>
                <Text style={styles.statLabelSmall}>Активных</Text>
              </View>
            </View>

            {/* Pie Chart - Team Activity */}
            <GlassCard style={styles.chartCard}>
              <Text style={styles.chartTitle}>Активность команды</Text>
              <Animated.View style={[styles.pieContainer, { transform: [{ scale: scaleAnim }] }]}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                  {generatePieChart()}
                </Svg>
              </Animated.View>
              {/* Legend */}
              <View style={styles.legend}>
                {pieData.slice(0, 4).map((item, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.legendPercent}>{Math.round((item.count / totalActivities) * 100)}%</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction} onPress={() => setShowAddTaskModal(true)}>
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <TablerIcon name="plus" size={20} color="#10b981" />
                </View>
                <Text style={styles.quickActionText}>Новая задача</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/crm' as any)}>
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <TablerIcon name="users" size={20} color="#6366f1" />
                </View>
                <Text style={styles.quickActionText}>CRM</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/tasks')}>
                <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <TablerIcon name="layout-kanban" size={20} color="#f59e0b" />
                </View>
                <Text style={styles.quickActionText}>Задачи</Text>
              </TouchableOpacity>
            </View>

            {/* Activity Log */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Журнал действий</Text>
              {activities.length === 0 ? (
                <GlassCard><Text style={styles.emptyText}>Нет активности</Text></GlassCard>
              ) : (
                activities.slice(0, 10).map(activity => (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: `${getActivityColor(activity.action)}20` }]}>
                      <TablerIcon name={getActivityIcon(activity.type, activity.action) as any} size={16} color={getActivityColor(activity.action)} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityText}>
                        <Text style={styles.activityUser}>{activity.userName}</Text> {translateAction(activity.action)}
                      </Text>
                      <Text style={styles.activitySubject} numberOfLines={1}>{activity.subject}</Text>
                      <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <>
            {/* Employee View - Salary Card */}
            <GlassCard style={styles.salaryCard}>
              <Text style={styles.salaryLabel}>Зарплата за период</Text>
              <Text style={styles.salaryAmount}>{calculateSalary().toLocaleString()} ₽</Text>
              <TouchableOpacity onPress={() => router.push('/salary')} style={styles.salaryLink}>
                <Text style={styles.salaryLinkText}>Подробнее</Text>
                <TablerIcon name="chevron-right" size={14} color={colors.primary} />
              </TouchableOpacity>
            </GlassCard>

            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statCard} onPress={() => router.push('/tasks')}>
                <View style={[styles.statIcon, { backgroundColor: colors.infoBg }]}>
                  <TablerIcon name="clipboard" size={18} color={colors.info} />
                </View>
                <Text style={styles.statValue}>{pendingTasks.length}</Text>
                <Text style={styles.statLabel}>Задач</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.statCard} onPress={() => router.push('/chat')}>
                <View style={[styles.statIcon, { backgroundColor: colors.successBg }]}>
                  <TablerIcon name="message" size={18} color={colors.success} />
                </View>
                <Text style={styles.statValue}>{unreadMessages}</Text>
                <Text style={styles.statLabel}>Новых</Text>
              </TouchableOpacity>
              
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.warningBg }]}>
                  <TablerIcon name="calendar" size={18} color={colors.warning} />
                </View>
                <Text style={styles.statValue}>{workDays.filter(wd => wd.memberId === user?.teamMemberId).length}</Text>
                <Text style={styles.statLabel}>Дней</Text>
              </View>
            </View>
          </>
        )}

        {/* Recent Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{showAllTasks ? 'Задачи' : 'Мои задачи'}</Text>
            <TouchableOpacity onPress={() => router.push('/tasks')}>
              <Text style={styles.sectionLink}>Все →</Text>
            </TouchableOpacity>
          </View>
          
          {pendingTasks.length === 0 ? (
            <GlassCard><Text style={styles.emptyText}>Нет активных задач</Text></GlassCard>
          ) : (
            pendingTasks.slice(0, 3).map(task => (
              <TouchableOpacity key={task.id} style={styles.taskCard} onPress={() => router.push('/tasks')}>
                <View style={styles.taskHeader}>
                  <View style={[styles.priorityDot, { backgroundColor: task.priority === 'high' ? colors.error : task.priority === 'medium' ? colors.warning : colors.success }]} />
                  <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                </View>
                {task.address && (
                  <View style={styles.taskMeta}>
                    <TablerIcon name="map-pin" size={12} color={colors.textMuted} />
                    <Text style={styles.taskMetaText} numberOfLines={1}>{task.address}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Team Online */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Команда онлайн</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamScroll}>
            {teamMembers.filter(m => m.isOnline).map(member => (
              <View key={member.id} style={styles.teamMember}>
                <View style={styles.teamAvatarContainer}>
                  <Image source={{ uri: member.avatar }} style={styles.teamAvatar} />
                  <View style={styles.onlineDot} />
                </View>
                <Text style={styles.teamName} numberOfLines={1}>{member.name.split(' ')[0]}</Text>
              </View>
            ))}
            {teamMembers.filter(m => m.isOnline).length === 0 && (
              <Text style={styles.emptyText}>Никого нет онлайн</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={showAddTaskModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Новая задача</Text>
                <TouchableOpacity onPress={() => setShowAddTaskModal(false)}>
                  <TablerIcon name="x" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Project Select */}
              <Text style={styles.inputLabel}>Проект</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectRow}>
                {projects.map(project => (
                  <TouchableOpacity
                    key={project.id}
                    style={[styles.selectOption, newTask.projectId === project.id && styles.selectOptionActive]}
                    onPress={() => setNewTask(prev => ({ 
                      ...prev, 
                      projectId: project.id,
                      status: project.columns?.[0]?.id || 'todo',
                    }))}
                  >
                    <Text style={[styles.selectOptionText, newTask.projectId === project.id && styles.selectOptionTextActive]}>
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Column Select */}
              <Text style={styles.inputLabel}>Колонка</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectRow}>
                {projectColumns.map((col: any) => (
                  <TouchableOpacity
                    key={col.id}
                    style={[styles.selectOption, newTask.status === col.id && styles.selectOptionActive]}
                    onPress={() => setNewTask(prev => ({ ...prev, status: col.id }))}
                  >
                    <Text style={[styles.selectOptionText, newTask.status === col.id && styles.selectOptionTextActive]}>
                      {typeof col.name === 'string' ? col.name : col.name?.ru || col.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Assignees */}
              <Text style={styles.inputLabel}>Исполнители</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectRow}>
                {teamMembers.map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.assigneeOption, newTask.assigneeIds.includes(member.id) && styles.assigneeOptionActive]}
                    onPress={() => toggleAssignee(member.id)}
                  >
                    <Image source={{ uri: member.avatar }} style={styles.assigneeAvatar} />
                    <Text style={[styles.assigneeText, newTask.assigneeIds.includes(member.id) && styles.assigneeTextActive]} numberOfLines={1}>
                      {member.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Название задачи"
                placeholderTextColor={colors.textMuted}
                value={newTask.title}
                onChangeText={t => setNewTask({ ...newTask, title: t })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Описание"
                placeholderTextColor={colors.textMuted}
                value={newTask.description}
                onChangeText={t => setNewTask({ ...newTask, description: t })}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Адрес"
                placeholderTextColor={colors.textMuted}
                value={newTask.address}
                onChangeText={t => setNewTask({ ...newTask, address: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Телефон"
                placeholderTextColor={colors.textMuted}
                value={newTask.phone}
                onChangeText={t => setNewTask({ ...newTask, phone: t })}
                keyboardType="phone-pad"
              />
              <TouchableOpacity 
                style={[styles.createBtn, creating && styles.createBtnDisabled]} 
                onPress={handleCreateTask}
                disabled={creating}
              >
                <Text style={styles.createBtnText}>{creating ? 'Создание...' : 'Создать'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}


const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  userSection: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: spacing.md, borderWidth: 2, borderColor: colors.primary },
  greeting: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  role: { color: colors.textMuted, fontSize: fontSize.xs },
  
  // Admin Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCardSmall: { width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 3) / 4, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: 'center' },
  statValueSmall: { color: colors.text, fontSize: fontSize.lg, fontWeight: 'bold', marginTop: spacing.xs },
  statLabelSmall: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  
  // Pie Chart
  chartCard: { marginBottom: spacing.lg, alignItems: 'center', paddingHorizontal: 0 },
  chartTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', alignSelf: 'flex-start', marginBottom: spacing.sm, paddingHorizontal: spacing.md },
  pieContainer: { alignItems: 'center', justifyContent: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: spacing.sm, gap: spacing.sm, paddingHorizontal: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
  legendText: { color: colors.textSecondary, fontSize: fontSize.xs, maxWidth: 60 },
  legendPercent: { color: colors.textMuted, fontSize: fontSize.xs, marginLeft: spacing.xs },
  
  // Quick Actions
  quickActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  quickAction: { flex: 1, backgroundColor: colors.glass, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.md, alignItems: 'center' },
  quickActionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xs },
  quickActionText: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: 'center' },
  
  // Activity Log
  activityItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.glass, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.sm, marginBottom: spacing.sm },
  activityIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  activityContent: { flex: 1 },
  activityText: { color: colors.textSecondary, fontSize: fontSize.sm },
  activityUser: { color: colors.text, fontWeight: '500' },
  activitySubject: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  activityTime: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  
  // Employee View
  salaryCard: { alignItems: 'center', marginBottom: spacing.lg, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
  salaryLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  salaryAmount: { color: colors.success, fontSize: 32, fontWeight: 'bold', marginVertical: spacing.sm },
  salaryLink: { flexDirection: 'row', alignItems: 'center' },
  salaryLinkText: { color: colors.primary, fontSize: fontSize.sm },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: { flex: 1, backgroundColor: colors.glass, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.md, alignItems: 'center' },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: 'bold' },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  
  // Sections
  section: { marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  sectionLink: { color: colors.primary, fontSize: fontSize.sm },
  
  // Tasks
  taskCard: { backgroundColor: colors.glass, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.md, marginBottom: spacing.sm },
  taskHeader: { flexDirection: 'row', alignItems: 'center' },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  taskTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '500', flex: 1 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, marginLeft: spacing.lg },
  taskMetaText: { color: colors.textMuted, fontSize: fontSize.xs, marginLeft: spacing.xs },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  
  // Team
  teamScroll: { marginTop: spacing.sm },
  teamMember: { alignItems: 'center', marginRight: spacing.lg },
  teamAvatarContainer: { position: 'relative' },
  teamAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.background },
  teamName: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: spacing.xs, maxWidth: 50 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalScroll: { flex: 1 },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.backgroundLight, borderRadius: borderRadius.xl, padding: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  inputLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs, marginTop: spacing.sm },
  selectRow: { marginBottom: spacing.sm },
  selectOption: { backgroundColor: colors.glass, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm },
  selectOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  selectOptionText: { color: colors.textSecondary, fontSize: fontSize.sm },
  selectOptionTextActive: { color: colors.text, fontWeight: '500' },
  assigneeOption: { alignItems: 'center', backgroundColor: colors.glass, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.sm, marginRight: spacing.sm, minWidth: 60 },
  assigneeOptionActive: { backgroundColor: colors.primary + '30', borderColor: colors.primary },
  assigneeAvatar: { width: 32, height: 32, borderRadius: 16, marginBottom: spacing.xs },
  assigneeText: { color: colors.textSecondary, fontSize: 10 },
  assigneeTextActive: { color: colors.text },
  input: { backgroundColor: colors.glass, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: fontSize.md, marginBottom: spacing.md, marginTop: spacing.sm },
  textArea: { height: 80, textAlignVertical: 'top' },
  createBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
});
