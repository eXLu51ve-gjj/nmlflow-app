import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useStore } from '@/store';
import { chatAPI, getServerUrl } from '@/lib/api';
import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import TablerIcon from '@/components/TablerIcon';

export default function ChatScreen() {
  const { user, chatMessages, setChatMessages, addChatMessage, teamMembers } = useStore();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🔥', '✅', '🎉'];

  useEffect(() => {
    loadMessages();
    getServerUrl().then(url => setServerUrl(url || ''));
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatMessages]);

  const loadMessages = async () => {
    try {
      const messages = await chatAPI.getMessages(user?.id);
      setChatMessages(Array.isArray(messages) ? messages : []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setChatMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text?: string, attachments?: string[]) => {
    const msgText = text || message.trim();
    if (!msgText && !attachments?.length) return;
    if (sending) return;
    
    setSending(true);
    try {
      const newMessage = await chatAPI.sendMessage(msgText, attachments);
      if (newMessage) addChatMessage(newMessage);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const formData = new FormData();
        formData.append('file', { uri: result.assets[0].uri, type: 'image/jpeg', name: `photo_${Date.now()}.jpg` } as any);
        const response = await fetch(`${serverUrl}/api/upload`, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.url) {
          await sendMessage('📷 Фото', [`${serverUrl}${data.url}`]);
        }
      } catch (e) {
        Alert.alert('Ошибка', 'Не удалось отправить фото');
      }
    }
  };

  const handleSendLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нет доступа к геолокации');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      await sendMessage(`📍 Моя геолокация: ${mapUrl}`);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось получить геолокацию');
    }
  };

  const onlineCount = (teamMembers || []).filter(m => m.isOnline).length;
  const messages = chatMessages || [];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Сегодня';
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const groupedMessages: { date: string; msgs: typeof messages }[] = [];
  let currentDate = '';
  messages.forEach(msg => {
    const msgDate = formatDate(msg.createdAt);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, msgs: [] });
    }
    if (groupedMessages.length > 0) groupedMessages[groupedMessages.length - 1].msgs.push(msg);
  });

  const rightAction = (
    <View style={styles.onlineBadge}>
      <View style={styles.onlineDot} />
      <Text style={styles.onlineText}>{onlineCount}</Text>
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper title="Чат" rightAction={rightAction}>
        <View style={styles.loading}><Text style={styles.loadingText}>Загрузка...</Text></View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Чат" rightAction={rightAction}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
          {groupedMessages.map((group, gi) => (
            <View key={gi}>
              <View style={styles.dateDivider}>
                <Text style={styles.dateText}>{group.date}</Text>
              </View>
              {group.msgs.map((msg) => {
                const isOwn = msg.authorId === user?.id;
                const avatarUrl = msg.authorAvatar && msg.authorAvatar.length > 0 
                  ? msg.authorAvatar 
                  : `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(msg.authorName)}&backgroundColor=7c3aed`;
                return (
                  <View key={msg.id} style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
                    {!isOwn && <Image source={{ uri: avatarUrl }} style={styles.messageAvatar} />}
                    <View style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}>
                      <View style={styles.messageHeader}>
                        <Text style={styles.messageTime}>{formatTime(msg.createdAt)}</Text>
                        {!isOwn && <Text style={styles.messageAuthor}>{msg.authorName}</Text>}
                      </View>
                      <Text style={styles.messageText}>{msg.text}</Text>
                      {msg.attachments?.length > 0 && (
                        <View style={styles.attachments}>
                          {msg.attachments.map((att: string, ai: number) => (
                            <TouchableOpacity key={ai} onPress={() => Linking.openURL(att)}>
                              <Image source={{ uri: att }} style={styles.attachmentImage} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
          {messages.length === 0 && (
            <View style={styles.empty}>
              <TablerIcon name="message" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Нет сообщений</Text>
            </View>
          )}
        </ScrollView>

        {showEmoji && (
          <View style={styles.emojiPicker}>
            {emojis.map((e, i) => (
              <TouchableOpacity key={i} onPress={() => { setMessage(m => m + e); setShowEmoji(false); }}>
                <Text style={styles.emoji}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.iconBtn} onPress={handlePickImage}>
            <TablerIcon name="paperclip" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleSendLocation}>
            <TablerIcon name="map-pin" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Сообщение..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowEmoji(!showEmoji)}>
            <TablerIcon name="mood-smile" size={20} color={showEmoji ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sendBtn, (!message.trim() || sending) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!message.trim() || sending}
          >
            <TablerIcon name="arrow-up" size={22} color={message.trim() ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginRight: spacing.xs },
  onlineText: { color: colors.textSecondary, fontSize: fontSize.xs },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textMuted, fontSize: fontSize.md },
  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: spacing.xs, paddingVertical: spacing.md, paddingBottom: spacing.xl },
  dateDivider: { alignItems: 'center', marginVertical: spacing.md },
  dateText: { color: colors.textMuted, fontSize: fontSize.xs, backgroundColor: colors.glass, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  messageRow: { flexDirection: 'row', marginBottom: spacing.sm, alignItems: 'flex-end', justifyContent: 'flex-start' },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: spacing.xs, flexShrink: 0 },
  messageBubble: { maxWidth: '80%', backgroundColor: colors.glass, borderRadius: borderRadius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.glassBorder },
  messageBubbleOwn: { backgroundColor: colors.primary + '25', borderColor: colors.primary + '40' },
  messageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  messageAuthor: { color: colors.primaryLight, fontSize: fontSize.xs, fontWeight: '600', marginLeft: spacing.xs },
  messageText: { color: colors.text, fontSize: fontSize.sm, lineHeight: 18 },
  messageTime: { color: colors.textMuted, fontSize: 10 },
  attachments: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm, gap: spacing.xs },
  attachmentImage: { width: 100, height: 100, borderRadius: borderRadius.sm },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2 },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, marginTop: spacing.md },
  emojiPicker: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.backgroundLight, padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  emoji: { fontSize: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, paddingBottom: spacing.md, gap: spacing.xs },
  iconBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, backgroundColor: colors.glass, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: fontSize.sm, maxHeight: 80 },
  sendBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
