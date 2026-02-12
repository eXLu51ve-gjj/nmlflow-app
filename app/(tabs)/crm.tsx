import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Linking, Modal, Animated, PanResponder, Image } from 'react-native';
import { leadsAPI } from '@/lib/api';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import TablerIcon from '@/components/TablerIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

const CRM_COLUMNS = [
  { id: 'leads', name: 'Лиды', color: '#8b5cf6' },
  { id: 'negotiation', name: 'Переговоры', color: '#3b82f6' },
  { id: 'proposal', name: 'Предложение', color: '#f59e0b' },
  { id: 'closed', name: 'Закрыто', color: '#10b981' },
];

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address?: string;
  value: number;
  status: string;
  avatar?: string;
  history: any[];
  createdAt: string;
}

export default function CRMScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const horizontalScrollRef = useState<ScrollView | null>(null);

  const slideAnim = useState(new Animated.Value(SCREEN_HEIGHT))[0];
  const panY = useState(new Animated.Value(0))[0];

  const panResponder = useState(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SWIPE_THRESHOLD) closeLeadModal();
        else Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  )[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await leadsAPI.getAll();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load leads:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setModalVisible(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };

  const closeLeadModal = () => {
    Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => {
      setModalVisible(false);
      setSelectedLead(null);
      panY.setValue(0);
    });
  };

  const handleCall = () => {
    if (selectedLead?.phone) Linking.openURL(`tel:${selectedLead.phone}`);
  };

  const handleMap = () => {
    if (selectedLead?.address) {
      const encoded = encodeURIComponent(selectedLead.address);
      Linking.openURL(`https://maps.google.com/?q=${encoded}`);
    }
  };

  const handleEmail = () => {
    if (selectedLead?.email) Linking.openURL(`mailto:${selectedLead.email}`);
  };

  const getLeadsForColumn = (columnId: string) => {
    return leads.filter(l => l.status === columnId);
  };

  const currentColumn = CRM_COLUMNS[currentColumnIndex];
  const filteredLeads = getLeadsForColumn(currentColumn?.id || 'leads');

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentColumnIndex && index >= 0 && index < CRM_COLUMNS.length) {
      setCurrentColumnIndex(index);
    }
  };

  const scrollToColumn = (index: number) => {
    // @ts-ignore
    horizontalScrollRef[0]?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentColumnIndex(index);
  };

  const getStatusColor = (status: string) => {
    const col = CRM_COLUMNS.find(c => c.id === status);
    return col?.color || '#8b5cf6';
  };

  const renderLeadCard = (lead: Lead) => {
    const statusColor = getStatusColor(lead.status);
    return (
      <TouchableOpacity key={lead.id} style={styles.leadCard} onPress={() => openLeadModal(lead)} activeOpacity={0.7}>
        <View style={styles.leadRow}>
          <Image 
            source={{ uri: lead.avatar || `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(lead.name)}&backgroundColor=7c3aed` }} 
            style={styles.leadAvatar}
          />
          <View style={styles.leadInfo}>
            <Text style={styles.leadName} numberOfLines={1}>{lead.name}</Text>
            <Text style={styles.leadCompany} numberOfLines={1}>{lead.company}</Text>
          </View>
          {lead.value > 0 && (
            <View style={[styles.valueBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.valueText, { color: statusColor }]}>{lead.value.toLocaleString()} ₽</Text>
            </View>
          )}
        </View>
        <View style={styles.leadMeta}>
          {lead.phone && (
            <View style={styles.metaItem}>
              <TablerIcon name="phone" size={14} color={colors.textMuted} />
              <Text style={styles.metaText}>{lead.phone}</Text>
            </View>
          )}
          {lead.email && (
            <View style={styles.metaItem}>
              <TablerIcon name="mail" size={14} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>{lead.email}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const rightAction = (
    <Text style={styles.countText}>{filteredLeads.length}</Text>
  );

  return (
    <ScreenWrapper title="CRM" rightAction={rightAction}>
      {/* Column tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {CRM_COLUMNS.map((col, index) => {
            const isActive = currentColumnIndex === index;
            const count = getLeadsForColumn(col.id).length;
            return (
              <TouchableOpacity 
                key={col.id} 
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => scrollToColumn(index)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{col.name}</Text>
                <View style={[styles.tabBadge, isActive && { backgroundColor: col.color }]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Swipeable columns */}
      <ScrollView
        ref={(ref) => { horizontalScrollRef[0] = ref; }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.horizontalScroll}
      >
        {CRM_COLUMNS.map((col) => {
          const columnLeads = getLeadsForColumn(col.id);
          return (
            <View key={col.id} style={styles.columnPage}>
              <ScrollView 
                style={styles.scroll} 
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
              >
                {columnLeads.length === 0 ? (
                  <View style={styles.empty}>
                    <View style={styles.emptyIconContainer}>
                      <TablerIcon name="users" size={48} color={colors.textMuted} />
                    </View>
                    <Text style={styles.emptyText}>Нет лидов</Text>
                    <Text style={styles.emptySubtext}>Лиды появятся здесь</Text>
                  </View>
                ) : (
                  columnLeads.map(lead => renderLeadCard(lead))
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Sheet Modal */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeLeadModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeLeadModal} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: Animated.add(slideAnim, panY) }] }]}>
            <View {...panResponder.panHandlers} style={styles.sheetHandleArea}>
              <View style={styles.sheetHandle} />
            </View>
            {selectedLead && (
              <ScrollView style={styles.sheetContent} showsVerticalScrollIndicator={false}>
                <View style={styles.sheetHeader}>
                  <Image 
                    source={{ uri: selectedLead.avatar || `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(selectedLead.name)}&backgroundColor=7c3aed` }} 
                    style={styles.sheetAvatar}
                  />
                  <View style={styles.sheetHeaderInfo}>
                    <Text style={styles.sheetTitle}>{selectedLead.name}</Text>
                    <Text style={styles.sheetCompany}>{selectedLead.company}</Text>
                    {selectedLead.value > 0 && (
                      <View style={[styles.valueBadgeLarge, { backgroundColor: getStatusColor(selectedLead.status) + '20' }]}>
                        <Text style={[styles.valueTextLarge, { color: getStatusColor(selectedLead.status) }]}>
                          {selectedLead.value.toLocaleString()} ₽
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  {selectedLead.phone && (
                    <TouchableOpacity style={styles.detailItem} onPress={handleCall}>
                      <View style={[styles.detailIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <TablerIcon name="phone" size={18} color="#10b981" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Телефон</Text>
                        <Text style={styles.detailValue}>{selectedLead.phone}</Text>
                      </View>
                      <TablerIcon name="external-link" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                  {selectedLead.email && (
                    <TouchableOpacity style={styles.detailItem} onPress={handleEmail}>
                      <View style={[styles.detailIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                        <TablerIcon name="mail" size={18} color="#3b82f6" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{selectedLead.email}</Text>
                      </View>
                      <TablerIcon name="external-link" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                  {selectedLead.address && (
                    <TouchableOpacity style={styles.detailItem} onPress={handleMap}>
                      <View style={[styles.detailIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                        <TablerIcon name="map-pin" size={18} color="#8b5cf6" />
                      </View>
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Адрес</Text>
                        <Text style={styles.detailValue}>{selectedLead.address}</Text>
                      </View>
                      <TablerIcon name="external-link" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.sheetSection}>
                  <Text style={styles.sectionLabel}>Статус</Text>
                  <View style={styles.statusRow}>
                    {CRM_COLUMNS.map(col => (
                      <View 
                        key={col.id} 
                        style={[
                          styles.statusItem, 
                          selectedLead.status === col.id && { backgroundColor: col.color + '30', borderColor: col.color }
                        ]}
                      >
                        <Text style={[styles.statusItemText, selectedLead.status === col.id && { color: col.color }]}>
                          {col.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={{ height: 60 }} />
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}


const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, flexGrow: 1 },
  horizontalScroll: { flex: 1 },
  columnPage: { width: SCREEN_WIDTH, flex: 1 },
  tabsContainer: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  tabs: { paddingHorizontal: spacing.md, gap: spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, gap: spacing.xs },
  tabActive: { backgroundColor: colors.glass },
  tabText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500' },
  tabTextActive: { color: colors.text },
  tabBadge: { backgroundColor: colors.glass, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.sm, minWidth: 20, alignItems: 'center' },
  tabBadgeText: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600' },
  tabBadgeTextActive: { color: colors.text },
  countText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '500' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.glass, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyText: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  emptySubtext: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs },
  leadCard: { backgroundColor: colors.glass, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.md, marginBottom: spacing.md },
  leadRow: { flexDirection: 'row', alignItems: 'center' },
  leadAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: spacing.md },
  leadInfo: { flex: 1 },
  leadName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  leadCompany: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  valueBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  valueText: { fontSize: fontSize.sm, fontWeight: '600' },
  leadMeta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { color: colors.textMuted, fontSize: fontSize.xs },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: SCREEN_HEIGHT * 0.85 },
  sheetHandleArea: { alignItems: 'center', paddingVertical: spacing.md },
  sheetHandle: { width: 40, height: 4, backgroundColor: colors.glassBorder, borderRadius: 2 },
  sheetContent: { paddingHorizontal: spacing.lg },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  sheetAvatar: { width: 64, height: 64, borderRadius: 32, marginRight: spacing.md },
  sheetHeaderInfo: { flex: 1 },
  sheetTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  sheetCompany: { color: colors.textMuted, fontSize: fontSize.md, marginTop: 2 },
  valueBadgeLarge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md, marginTop: spacing.sm, alignSelf: 'flex-start' },
  valueTextLarge: { fontSize: fontSize.md, fontWeight: '700' },
  detailsGrid: { gap: spacing.sm, marginBottom: spacing.lg },
  detailItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass, padding: spacing.md, borderRadius: borderRadius.md },
  detailIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  detailTextContainer: { flex: 1 },
  detailLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  detailValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '500', marginTop: 2 },
  sheetSection: { marginBottom: spacing.lg },
  sectionLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
  statusItemText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500' },
});
