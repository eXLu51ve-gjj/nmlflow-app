import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { useStore } from '@/store';
import { teamAPI, leadsAPI, activitiesAPI } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import TablerIcon from '@/components/TablerIcon';

export default function AdminScreen() {
  const { user, tasks, teamMembers, setTeamMembers } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const isAdmin = user?.isAdmin || user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [teamData, leadsData, activitiesData] = await Promise.all([
        teamAPI.getAll(), leadsAPI.getAll(), activitiesAPI.getAll(),
      ]);
      setTeamMembers(teamData);
      setLeads(leadsData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!isAdmin) {
    return (
      <ScreenWrapper title="Админ-панель">
        <View style={styles.accessDenied}>
          <TablerIcon name="lock" size={48} color={colors.error} />
          <Text style={styles.accessDeniedText}>Доступ запрещён</Text>
          <Text style={styles.accessDeniedSubtext}>Только для администраторов</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const onlineCount = teamMembers.filter(m => m.isOnline).length;
  const totalLeadsValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);

  return (
    <ScreenWrapper title="Админ-панель">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <TablerIcon name="users" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{teamMembers.length}</Text>
            <Text style={styles.statLabel}>Сотрудников</Text>
          </GlassCard>
          
          <GlassCard style={styles.statCard}>
            <View style={styles.onlineIndicator}><View style={styles.onlineDot} /></View>
            <Text style={styles.statValue}>{onlineCount}</Text>
            <Text style={styles.statLabel}>Онлайн</Text>
          </GlassCard>
          
          <GlassCard style={styles.statCard}>
            <TablerIcon name="clipboard" size={20} color={colors.info} />
            <Text style={styles.statValue}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Задач</Text>
          </GlassCard>
          
          <GlassCard style={styles.statCard}>
            <TablerIcon name="briefcase" size={20} color={colors.success} />
            <Text style={styles.statValue}>{leads.length}</Text>
            <Text style={styles.statLabel}>Лидов</Text>
          </GlassCard>
        </View>

        {/* CRM Value */}
        <GlassCard style={styles.crmCard}>
          <Text style={styles.crmLabel}>Общая сумма CRM</Text>
          <Text style={styles.crmValue}>{totalLeadsValue.toLocaleString()} ₽</Text>
        </GlassCard>

        {/* Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Команда</Text>
          {teamMembers.map(member => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatarContainer}>
                <Image source={{ uri: member.avatar }} style={styles.memberAvatar} />
                {member.isOnline && <View style={styles.memberOnline} />}
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              <View style={styles.memberBadges}>
                {member.isAdmin && (
                  <View style={styles.adminBadge}><TablerIcon name="shield" size={10} color={colors.warning} /></View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Последняя активность</Text>
          {activities.slice(0, 5).map((activity, index) => (
            <View key={activity.id || index} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityUser}>{activity.userName || 'Система'}</Text>
                  {' '}{activity.action}{' '}
                  <Text style={styles.activitySubject}>{activity.subject}</Text>
                </Text>
                <Text style={styles.activityTime}>{new Date(activity.timestamp).toLocaleString('ru-RU')}</Text>
              </View>
            </View>
          ))}
          {activities.length === 0 && <Text style={styles.emptyText}>Нет активности</Text>}
        </View>

        {/* Note */}
        <View style={styles.note}>
          <TablerIcon name="info-circle" size={16} color={colors.textMuted} />
          <Text style={styles.noteText}>Полное управление доступно в веб-версии</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  accessDenied: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  accessDeniedText: { color: colors.error, fontSize: fontSize.xl, fontWeight: 'bold', marginTop: spacing.md },
  accessDeniedSubtext: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { width: '48%', alignItems: 'center', paddingVertical: spacing.md },
  statValue: { color: colors.text, fontSize: fontSize.xxl, fontWeight: 'bold', marginTop: spacing.sm },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  onlineIndicator: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  crmCard: {
    alignItems: 'center', marginBottom: spacing.xl,
    backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  crmLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  crmValue: { color: colors.success, fontSize: fontSize.title, fontWeight: 'bold', marginTop: spacing.xs },
  section: { marginBottom: spacing.xl },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.md },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder,
    padding: spacing.sm, marginBottom: spacing.sm,
  },
  memberAvatarContainer: { position: 'relative' },
  memberAvatar: { width: 36, height: 36, borderRadius: 18 },
  memberOnline: {
    position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
    borderRadius: 5, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.background,
  },
  memberInfo: { flex: 1, marginLeft: spacing.sm },
  memberName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '500' },
  memberEmail: { color: colors.textMuted, fontSize: fontSize.xs },
  memberBadges: { flexDirection: 'row', alignItems: 'center' },
  adminBadge: { backgroundColor: colors.warning + '30', padding: spacing.xs, borderRadius: borderRadius.sm },
  memberRate: { color: colors.textSecondary, fontSize: fontSize.xs },
  activityItem: { flexDirection: 'row', marginBottom: spacing.sm },
  activityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6, marginRight: spacing.sm },
  activityContent: { flex: 1 },
  activityText: { color: colors.textSecondary, fontSize: fontSize.sm },
  activityUser: { color: colors.text, fontWeight: '500' },
  activitySubject: { color: colors.primaryLight },
  activityTime: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  noteText: { color: colors.textMuted, fontSize: fontSize.xs, marginLeft: spacing.xs },
});
