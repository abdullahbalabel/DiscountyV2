import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';
import { AnimatedButton } from './AnimatedButton';

let Haptics: any = null;
try { Haptics = require('expo-haptics'); } catch {}

interface RejectionReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reasonType: string, reasonDetail?: string) => Promise<void>;
}

const REASON_TYPES = [
  'cashier_unaware',
  'deal_expired',
  'terms_changed',
  'technical_issue',
  'other',
] as const;

export function RejectionReportModal({ visible, onClose, onSubmit }: RejectionReportModalProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = () => {
    setSelectedReason(null);
    setDetail('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    try {
      if (Haptics) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await onSubmit(selectedReason, selectedReason === 'other' ? detail : undefined);
      resetState();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReasonLabel = (reason: string) => {
    const key = `rejection.reason${reason.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
    return t(key);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{
          backgroundColor: colors.surfaceBg, borderRadius: 24, padding: 24, width: '100%', maxWidth: 400,
          maxHeight: '80%', ...Shadows.lg,
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.onSurface }}>
              {t('rejection.reportTitle')}
            </Text>
            <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
              <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Reason radio list */}
            {REASON_TYPES.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  onPress={() => setSelectedReason(reason)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingVertical: 14, paddingHorizontal: 12,
                    borderRadius: Radius.md,
                    backgroundColor: isSelected ? colors.primaryContainer : 'transparent',
                    marginBottom: 4,
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.outlineVariant,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && (
                      <View style={{
                        width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary,
                      }} />
                    )}
                  </View>
                  <Text style={{
                    fontFamily: isSelected ? 'Cairo_700Bold' : 'Cairo',
                    fontSize: 14, color: isSelected ? colors.primary : colors.onSurface, flex: 1,
                  }}>
                    {getReasonLabel(reason)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Detail input for "Other" */}
            {selectedReason === 'other' && (
              <TextInput
                value={detail}
                onChangeText={setDetail}
                placeholder={t('rejection.detailPlaceholder')}
                placeholderTextColor={colors.onSurfaceVariant}
                multiline
                maxLength={300}
                style={{
                  borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: Radius.md,
                  padding: 12, fontFamily: 'Cairo', fontSize: 14, color: colors.onSurface,
                  backgroundColor: colors.surfaceContainerLowest, minHeight: 80, textAlignVertical: 'top',
                  marginTop: 8,
                }}
              />
            )}
          </ScrollView>

          {/* Submit button */}
          <AnimatedButton
            variant="solid"
            disabled={!selectedReason || isSubmitting}
            style={{
              width: '100%', paddingVertical: 14, borderRadius: Radius.lg,
              alignItems: 'center', justifyContent: 'center', marginTop: 16,
              opacity: !selectedReason || isSubmitting ? 0.5 : 1,
              backgroundColor: colors.primary,
            }}
            onPress={handleSubmit}
          >
            <Text style={{ color: colors.onPrimary, fontFamily: 'Cairo_700Bold', fontSize: 15 }}>
              {isSubmitting ? t('common.sending') || '...' : t('rejection.submit')}
            </Text>
          </AnimatedButton>
        </View>
      </View>
    </Modal>
  );
}
