import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';

export default function PendingApprovalScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signOut } = useAuth();

  return (
    <View className="flex-1 bg-surface items-center justify-center px-8">
      <AnimatedEntrance index={0}>
        <View className="items-center">
          {/* Animated Icon */}
          <View className="w-28 h-28 rounded-full items-center justify-center mb-8 bg-surface-container-high">
            <View className="w-20 h-20 rounded-full items-center justify-center bg-amber-100 dark:bg-amber-900/40">
              <MaterialIcons name="hourglass-top" size={40} color="#f59e0b" />
            </View>
          </View>

          {/* Title */}
          <Text className="font-headline font-bold text-3xl text-on-surface text-center mb-3">
            Application Submitted
          </Text>

          {/* Description */}
          <Text className="font-body text-on-surface-variant text-center text-base leading-6 mb-8 max-w-[300px]">
            Your business registration is being reviewed by our team. This usually takes 24-48 hours.
          </Text>

          {/* Status Card */}
          <View className="w-full rounded-3xl p-6 mb-8 bg-surface-container-lowest border-outline-variant/10">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-8 h-8 rounded-full bg-amber-100 items-center justify-center">
                <MaterialIcons name="pending" size={18} color="#f59e0b" />
              </View>
              <Text className="font-headline font-bold text-base text-on-surface">
                Status: Pending Review
              </Text>
            </View>

            <View className="flex-col gap-3">
              {[
                { label: 'Application received', done: true },
                { label: 'Under review', done: false, active: true },
                { label: 'Approved & ready', done: false },
              ].map((item, idx) => (
                <View key={idx} className="flex-row items-center gap-3">
                  <View className={`w-6 h-6 rounded-full items-center justify-center ${item.done
                      ? 'bg-green-500'
                      : item.active
                        ? 'bg-amber-400'
                        : 'bg-surface-container-high'
                    }`}>
                    {item.done ? (
                      <MaterialIcons name="check" size={14} color="white" />
                    ) : item.active ? (
                      <MaterialIcons name="more-horiz" size={14} color="white" />
                    ) : null}
                  </View>
                  <Text className={`font-body text-sm ${item.done
                      ? 'text-green-600 font-semibold'
                      : item.active
                        ? 'text-amber-600 font-semibold'
                        : 'text-on-surface-variant'
                    }`}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info */}
          <Text className="font-body text-on-surface-variant text-center text-xs leading-5 mb-8">
            We'll notify you as soon as your business is approved.{'\n'}
            You can start posting deals immediately after approval.
          </Text>

          {/* Sign Out */}
          <AnimatedButton
            className="px-8 py-3 rounded-full border-outline-variant/30"
            onPress={() => signOut()}
          >
            <Text className="font-body font-semibold text-on-surface-variant">Sign Out</Text>
          </AnimatedButton>
        </View>
      </AnimatedEntrance>
    </View>
  );
}
