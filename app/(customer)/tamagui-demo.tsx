import React, { useState } from 'react'
import { ScrollView, View, Switch, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassView } from '../../components/ui/GlassView'
import { AnimatedButton } from '../../components/ui/AnimatedButton'
import { DealCard } from '../../components/ui/DealCard'
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance'

export default function TamaguiDemoScreen() {
  const [inputValue, setInputValue] = useState('')
  const [switchValue, setSwitchValue] = useState(false)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff8f6' }}>
      <View style={{ padding: 16, gap: 24 }}>

        {/* Header */}
        <Text style={{ fontFamily: 'Cairo', fontSize: 30, fontWeight: '700', color: '#231917' }}>
          Component Library
        </Text>

        {/* ── Typography ── */}
        <Section title="Typography">
          <Text style={{ fontFamily: 'Cairo', fontSize: 36, fontWeight: '700', color: '#231917' }}>
            Heading 4xl
          </Text>
          <Text style={{ fontFamily: 'Cairo', fontSize: 24, fontWeight: '700', color: '#231917' }}>
            Heading 2xl
          </Text>
          <Text style={{ fontFamily: 'Cairo', fontSize: 18, fontWeight: '700', color: '#231917' }}>
            Heading lg
          </Text>
          <Text style={{ fontFamily: 'Cairo', fontSize: 14, color: '#231917' }}>
            Body text — Cairo regular at md size for readable content.
          </Text>
          <Text style={{
            fontFamily: 'Cairo', fontSize: 12, color: '#7b5733',
            textTransform: 'uppercase', letterSpacing: 1.5,
          }}>
            Label / Caption
          </Text>
        </Section>

        <View style={{ height: 1, backgroundColor: '#e5d5d0' }} />

        {/* ── Colors ── */}
        <Section title="Color Tokens">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { name: 'primary', color: '#862045' },
              { name: 'secondary', color: '#7b5733' },
              { name: 'tertiary', color: '#7d5700' },
              { name: 'error', color: '#ba1a1a' },
              { name: 'background', color: '#fff8f6' },
              { name: 'onBackground', color: '#231917' },
              { name: 'surfaceVariant', color: '#f5ddd9' },
              { name: 'navy', color: '#2c1600' },
            ].map(({ name, color }) => (
              <View key={name} style={{ alignItems: 'center', gap: 4 }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 12,
                  backgroundColor: color, borderWidth: 1, borderColor: '#ddd',
                }} />
                <Text style={{ fontSize: 9, color: '#564340' }}>{name}</Text>
              </View>
            ))}
          </View>
        </Section>

        <View style={{ height: 1, backgroundColor: '#e5d5d0' }} />

        {/* ── Glassmorphism ── */}
        <Section title="Glassmorphism">
          <View style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#862045', '#a01840', '#7b5733']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24, minHeight: 180, justifyContent: 'center' }}
            >
              <GlassView intensity={40} style={{ padding: 20, borderRadius: 16 }}>
                <Text style={{ fontFamily: 'Cairo', fontSize: 18, color: '#fff', fontWeight: '700' }}>
                  GlassView Component
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>
                  This is a glassmorphic card using backdrop blur
                </Text>
              </GlassView>
            </LinearGradient>
          </View>
        </Section>

        <View style={{ height: 1, backgroundColor: '#e5d5d0' }} />

        {/* ── Buttons ── */}
        <Section title="Buttons">
          <AnimatedButton variant="solid">
            <Text style={{ color: '#fff', fontWeight: '700' }}>Solid Button</Text>
          </AnimatedButton>
          <AnimatedButton variant="gradient">
            <Text style={{ color: '#fff', fontWeight: '700' }}>Gradient Button</Text>
          </AnimatedButton>
          <AnimatedButton variant="outline">
            <Text style={{ color: '#231917', fontWeight: '700' }}>Outline Button</Text>
          </AnimatedButton>
          <AnimatedButton variant="navy">
            <Text style={{ color: '#fff', fontWeight: '700' }}>Navy Button</Text>
          </AnimatedButton>
        </Section>

        <View style={{ height: 1, backgroundColor: '#e5d5d0' }} />

        {/* ── Toggles ── */}
        <Section title="Toggles">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: '#231917' }}>Enable notifications</Text>
            <Switch
              value={switchValue}
              onValueChange={setSwitchValue}
              trackColor={{ false: '#d8c2bd', true: '#862045' }}
              thumbColor="#fff"
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: '#231917' }}>Dark mode</Text>
            <Switch
              value={!switchValue}
              onValueChange={() => setSwitchValue(!switchValue)}
              trackColor={{ false: '#d8c2bd', true: '#862045' }}
              thumbColor="#fff"
            />
          </View>
        </Section>

        <View style={{ height: 1, backgroundColor: '#e5d5d0' }} />

        {/* ── Badges / Tags ── */}
        <Section title="Badges & Tags">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'Food & Drink', bg: '#ffd9de', fg: '#862045' },
              { label: 'Wellness', bg: '#ffdcba', fg: '#7b5733' },
              { label: 'Shopping', bg: '#ffdeaa', fg: '#7d5700' },
              { label: 'Active', bg: '#e0f0e0', fg: '#2e7d32' },
              { label: 'Expired', bg: '#ffe0e0', fg: '#ba1a1a' },
            ].map(({ label, bg, fg }) => (
              <View key={label} style={{ backgroundColor: bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: fg }}>{label}</Text>
              </View>
            ))}
          </View>
        </Section>

        <View style={{ height: 1, backgroundColor: '#e5d5d0' }} />

        {/* ── Cards ── */}
        <Section title="Cards">
          <View style={{
            backgroundColor: '#fff', borderRadius: 16, padding: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
          }}>
            <Text style={{ fontFamily: 'Cairo', fontWeight: '700', fontSize: 16, color: '#231917' }}>
              Simple Card
            </Text>
            <Text style={{ fontSize: 13, color: '#7b5733', marginTop: 6 }}>
              Basic card with shadow and rounded corners.
            </Text>
          </View>
          <View style={{ backgroundColor: '#2c1600', borderRadius: 16, padding: 16 }}>
            <Text style={{ fontFamily: 'Cairo', fontWeight: '700', fontSize: 16, color: '#fff' }}>
              Dark Card
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
              Dark themed card variant.
            </Text>
          </View>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#d8c2bd' }}>
            <Text style={{ fontFamily: 'Cairo', fontWeight: '700', fontSize: 16, color: '#231917' }}>
              Bordered Card
            </Text>
            <Text style={{ fontSize: 13, color: '#7b5733', marginTop: 6 }}>
              Card with a subtle border instead of shadow.
            </Text>
          </View>
        </Section>

        <View style={{ height: 1, backgroundColor: '#e5d5d0' }} />

        {/* ── Deal Cards ── */}
        <Section title="Deal Cards">
          <AnimatedEntrance index={0}>
            <DealCard
              id="1"
              title="50% Off Premium Coffee"
              provider="Artisan Roasters"
              imageUri="https://picsum.photos/400/200"
              discountBadge="-50%"
              description="Freshly roasted single-origin beans. Limited batch available this week only."
              categoryName="Food & Drink"
              categoryIcon="local-cafe"
              currentPrice="$3.50"
              originalPrice="$7.00"
              rating={4.7}
              reviewCount={128}
              endTime={new Date(Date.now() + 86400000 * 2).toISOString()}
              onPress={() => console.log('Deal pressed')}
            />
          </AnimatedEntrance>
          <AnimatedEntrance index={1}>
            <DealCard
              id="2"
              title="Buy 1 Get 1 Free Spa"
              provider="Serenity Spa"
              imageUri="https://picsum.photos/400/201"
              discountBadge="BOGO"
              description="Full body massage + facial treatment. Perfect weekend getaway."
              categoryName="Wellness"
              categoryIcon="spa"
              currentPrice="$89"
              originalPrice="$178"
              rating={4.9}
              reviewCount={64}
              endTime={new Date(Date.now() + 3600000 * 5).toISOString()}
              onPress={() => console.log('Deal pressed')}
            />
          </AnimatedEntrance>
          <AnimatedEntrance index={2}>
            <DealCard
              id="3"
              title="30% Off Gym Membership"
              provider="FitLife Gym"
              imageUri="https://picsum.photos/400/202"
              discountBadge="-30%"
              description="Monthly membership with access to all classes and equipment."
              categoryName="Fitness"
              categoryIcon="fitness-center"
              currentPrice="$49/mo"
              originalPrice="$70/mo"
              rating={4.5}
              reviewCount={89}
              endTime={new Date(Date.now() + 86400000 * 7).toISOString()}
              onPress={() => console.log('Deal pressed')}
            />
          </AnimatedEntrance>
        </Section>

        <View style={{ height: 1, backgroundColor: '#e5d5d0' }} />

        {/* ── Progress / Loading ── */}
        <Section title="Progress & Loading">
          <View style={{ backgroundColor: '#f5ddd9', height: 8, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#862045', width: '65%', height: '100%', borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: 12, color: '#7b5733' }}>65% complete</Text>
          <View style={{ backgroundColor: '#f5ddd9', height: 8, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#2e7d32', width: '100%', height: '100%', borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: 12, color: '#7b5733' }}>Completed</Text>
        </Section>

        <View style={{ height: 1, backgroundColor: '#e5d5d0' }} />

        {/* ── Rating ── */}
        <Section title="Ratings">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {[1,2,3,4,5].map(i => (
              <Text key={i} style={{ fontSize: 24 }}>{i <= 4 ? '★' : '☆'}</Text>
            ))}
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#231917', marginStart: 8 }}>4.0</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {[1,2,3,4,5].map(i => (
              <Text key={i} style={{ fontSize: 24 }}>{i <= 5 ? '★' : '☆'}</Text>
            ))}
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#231917', marginStart: 8 }}>5.0</Text>
          </View>
        </Section>

        <View style={{ height: 1, backgroundColor: '#e5d5d0' }} />

        {/* ── Avatars ── */}
        <Section title="Avatars">
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {['A', 'B', 'C'].map((letter, i) => (
              <View
                key={letter}
                style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: ['#862045', '#7b5733', '#7d5700'][i],
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{letter}</Text>
              </View>
            ))}
          </View>
        </Section>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontFamily: 'Cairo', fontSize: 18, fontWeight: '700', color: '#231917' }}>
        {title}
      </Text>
      {children}
    </View>
  )
}

