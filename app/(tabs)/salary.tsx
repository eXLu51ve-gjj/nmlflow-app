import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useStore } from '@/store';
import { workdaysAPI, settingsAPI, teamAPI } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import TablerIcon from '@/components/TablerIcon';

export default function SalaryScreen() {
  const { user, workDays, setWorkDays, salaryPayday, setSalaryPayday, teamMembers, setTeamMembers } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth());
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workdaysData, settingsData, teamData] = await Promise.all([
        workdaysAPI.getAll(),
        settingsAPI.get(),
        teamAPI.getAll(),
      ]);
      setWorkDays(workdaysData);
      setTeamMembers(teamData);
      if (settingsData.salaryPayday) {
        setSalaryPayday(settingsData.salaryPayday);
      }
    } catch (error) {
      console.error('Failed to load salary data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getSalaryPeriod = () => {
    let startDate: Date, endDate: Date;
    if (salaryPayday === 1) {
      startDate = new Date(salaryYear, salaryMonth, 1);
      endDate = new Date(salaryYear, salaryMonth + 1, 0);
    } else {
      const prevMonth = salaryMonth === 0 ? 11 : salaryMonth - 1;
      const prevYear = salaryMonth === 0 ? salaryYear - 1 : salaryYear;
      startDate = new Date(prevYear, prevMonth, salaryPayday);
      endDate = new Date(salaryYear, salaryMonth, salaryPayday - 1);
    }
    
    const periodDays: { dateStr: string; day: number; isNewMonth: boolean }[] = [];
    const current = new Date(startDate);
    let lastMonth = current.getMonth();
    
    while (current <= endDate) {
      const isNewMonth = current.getMonth() !== lastMonth;
      const year = current.getFullYear();
      const month = current.getMonth();
      const day = current.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      periodDays.push({ dateStr, day, isNewMonth });
      lastMonth = current.getMonth();
      current.setDate(current.getDate() + 1);
    }
    
    return { startDate, endDate, periodDays };
  };

  const { startDate, endDate, periodDays } = getSalaryPeriod();
  
  const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const startDateStr = formatDateStr(startDate);
  const endDateStr = formatDateStr(endDate);
  
  const member = teamMembers.find(m => m.id === user?.teamMemberId);
  const dailyRate = member?.dailyRate || user?.dailyRate || 0;
  const carBonus = member?.carBonus || user?.carBonus || 0;

  const myWorkDays = workDays.filter(wd => {
    if (wd.memberId !== user?.teamMemberId) return false;
    return wd.date >= startDateStr && wd.date <= endDateStr;
  });

  const calculateSalary = () => {
    let total = 0;
    let days = 0;
    let carDays = 0;
    let doubleDays = 0;

    myWorkDays.forEach(wd => {
      let dayPay = dailyRate;
      if (wd.isDouble) {
        dayPay *= 2;
        doubleDays++;
      }
      if (wd.withCar) {
        dayPay += carBonus;
        carDays++;
      }
      total += dayPay;
      days++;
    });

    return { total, days, carDays, doubleDays };
  };

  const salary = calculateSalary();

  const formatDate = (d: Date) => `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  const periodStr = `${formatDate(startDate)} — ${formatDate(endDate)}`;

  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  const prevMonth = () => {
    if (salaryMonth === 0) {
      setSalaryMonth(11);
      setSalaryYear(salaryYear - 1);
    } else {
      setSalaryMonth(salaryMonth - 1);
    }
  };

  const nextMonth = () => {
    if (salaryMonth === 11) {
      setSalaryMonth(0);
      setSalaryYear(salaryYear + 1);
    } else {
      setSalaryMonth(salaryMonth + 1);
    }
  };

  const getWorkDay = (dateStr: string) => myWorkDays.find(wd => wd.date === dateStr);

  return (
    <ScreenWrapper title="Зарплата">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <TablerIcon name="chevron-left" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.monthInfo}>
            <Text style={styles.monthText}>{months[salaryMonth]} {salaryYear}</Text>
            <Text style={styles.periodText}>{periodStr}</Text>
          </View>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <TablerIcon name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Total Card */}
        <GlassCard style={styles.totalCard}>
          <Text style={styles.totalLabel}>Итого за период</Text>
          <Text style={styles.totalAmount}>{salary.total.toLocaleString()} ₽</Text>
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <TablerIcon name="calendar" size={16} color={colors.success} />
            <Text style={styles.statValue}>{salary.days}</Text>
            <Text style={styles.statLabel}>дней</Text>
          </View>
          <View style={styles.statItem}>
            <TablerIcon name="car" size={16} color={colors.warning} />
            <Text style={styles.statValue}>{salary.carDays}</Text>
            <Text style={styles.statLabel}>с доп.</Text>
          </View>
          <View style={styles.statItem}>
            <TablerIcon name="bolt" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{salary.doubleDays}</Text>
            <Text style={styles.statLabel}>x2</Text>
          </View>
        </View>

        {/* Calendar */}
        <GlassCard style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>Рабочие дни</Text>
          <View style={styles.daysGrid}>
            {periodDays.map((dayInfo, idx) => {
              const workDay = getWorkDay(dayInfo.dateStr);
              const todayStr = formatDateStr(new Date());
              const isToday = dayInfo.dateStr === todayStr;
              const isWorked = !!workDay;
              const hasCar = workDay?.withCar;
              const isDouble = workDay?.isDouble;

              return (
                <View key={idx} style={styles.dayWrapper}>
                  {dayInfo.isNewMonth && idx > 0 && <View style={styles.monthDivider} />}
                  <View style={[
                    styles.dayCell,
                    isWorked && isDouble && styles.dayCellDouble,
                    isWorked && hasCar && !isDouble && styles.dayCellCar,
                    isWorked && !hasCar && !isDouble && styles.dayCellWorked,
                    isToday && !isWorked && styles.dayCellToday,
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isWorked && styles.dayTextWorked,
                      isToday && !isWorked && styles.dayTextToday,
                    ]}>
                      {dayInfo.day}
                    </Text>
                    {isWorked && (hasCar || isDouble) && (
                      <View style={styles.dayIcons}>
                        {hasCar && <TablerIcon name="car" size={8} color={colors.warning} />}
                        {isDouble && <TablerIcon name="bolt" size={8} color={colors.primary} />}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Rates Info */}
        <View style={styles.ratesInfo}>
          <Text style={styles.rateText}>Ставка: {dailyRate} ₽/день</Text>
          <Text style={styles.rateText}>Доп. ставка: +{carBonus} ₽</Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success + '60' }]} />
            <Text style={styles.legendText}>Рабочий день</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning + '60' }]} />
            <Text style={styles.legendText}>С доп. ставкой</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary + '60' }]} />
            <Text style={styles.legendText}>Двойной день</Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  navBtn: { padding: spacing.sm },
  monthInfo: { alignItems: 'center' },
  monthText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  periodText: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  totalCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: spacing.lg,
  },
  totalLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  totalAmount: { color: colors.success, fontSize: 36, fontWeight: 'bold', marginTop: spacing.xs },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.lg },
  statItem: { alignItems: 'center' },
  statValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: 'bold', marginTop: spacing.xs },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  calendarCard: { marginBottom: spacing.lg },
  calendarTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.md },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  dayWrapper: { flexDirection: 'row', alignItems: 'center' },
  monthDivider: { width: 2, height: 28, backgroundColor: colors.primary + '50', marginHorizontal: spacing.xs },
  dayCell: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellWorked: { backgroundColor: colors.success + '40', borderWidth: 1, borderColor: colors.success + '60' },
  dayCellCar: { backgroundColor: colors.warning + '40', borderWidth: 1, borderColor: colors.warning + '60' },
  dayCellDouble: { backgroundColor: colors.primary + '40', borderWidth: 1, borderColor: colors.primary + '60' },
  dayCellToday: { borderWidth: 1, borderColor: colors.info },
  dayText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '500' },
  dayTextWorked: { color: colors.text },
  dayTextToday: { color: colors.info },
  dayIcons: { flexDirection: 'row', position: 'absolute', bottom: 2, gap: 1 },
  ratesInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  rateText: { color: colors.textMuted, fontSize: fontSize.xs },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 3, marginRight: spacing.xs },
  legendText: { color: colors.textMuted, fontSize: fontSize.xs },
});
