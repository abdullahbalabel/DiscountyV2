import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import { supabase } from '../../lib/supabase';
import type { DealCondition } from '../../lib/types';

interface ConditionPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const CATEGORY_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  time: 'event-busy',
  quantity: 'groups',
  scope: 'restaurant',
  payment: 'payments',
  other: 'more-horiz',
};

export function ConditionPicker({ selectedIds, onChange }: ConditionPickerProps) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const [conditions, setConditions] = useState<DealCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['time', 'quantity', 'scope', 'payment', 'other']));

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('deal_conditions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (data) setConditions(data as DealCondition[]);
      setLoading(false);
    };
    load();
  }, []);

  const grouped = conditions.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {} as Record<string, DealCondition[]>);

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  const toggleCondition = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (conditions.length === 0) return null;

  const categories = ['time', 'quantity', 'scope', 'payment', 'other'];

  return (
    <View style={{ gap: 8 }}>
      {categories.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        const isExpanded = expandedCategories.has(cat);

        return (
          <View key={cat}>
            <Pressable
              onPress={() => toggleCategory(cat)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 8,
                paddingHorizontal: 4,
              }}
            >
              <MaterialIcons
                name={CATEGORY_ICONS[cat] || 'more-horiz'}
                size={16}
                color={colors.onSurfaceVariant}
              />
              <Text style={{
                fontFamily: 'Cairo_700Bold',
                fontSize: 13,
                color: colors.onSurface,
                flex: 1,
              }}>
                {t(`conditions.${cat}`)}
              </Text>
              <MaterialIcons
                name={isExpanded ? 'expand-less' : 'expand-more'}
                size={20}
                color={colors.iconDefault}
              />
            </Pressable>

            {isExpanded && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4, flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }}
              >
                {items.map((condition) => {
                  const isSelected = selectedIds.includes(condition.id);
                  const label = i18n.language === 'ar' ? condition.name_ar : condition.name;

                  return (
                    <Pressable
                      key={condition.id}
                      onPress={() => toggleCondition(condition.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: Radius.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: isSelected ? 'rgba(134,32,69,0.1)' : colors.surfaceContainerLowest,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.outlineVariant,
                      }}
                    >
                      <MaterialIcons
                        name={(condition.icon || 'check') as any}
                        size={14}
                        color={isSelected ? colors.primary : colors.iconDefault}
                      />
                      <Text style={{
                        fontFamily: 'Cairo_600SemiBold',
                        fontSize: 12,
                        color: isSelected ? colors.primary : colors.onSurfaceVariant,
                      }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        );
      })}
    </View>
  );
}
