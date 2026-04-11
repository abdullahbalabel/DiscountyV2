import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const GEOFENCE_TASK = 'discounty-geofence';
const GEOFENCE_STATE_KEY = '@discounty_geofence_state';
const GEOFENCE_RADIUS = 1000; // meters

interface GeofenceDealInfo {
  title: string;
  businessName: string;
}

interface GeofenceState {
  [dealId: string]: {
    lat: number;
    lng: number;
    title: string;
    businessName: string;
  };
}

function isExpoGo(): boolean {
  return Constants?.executionEnvironment === 'storeClient';
}

// ── Lazy Load expo-notifications ────────────────

let Notifications: any = null;
let notifModuleLoaded = false;

async function getNotifications() {
  if (notifModuleLoaded) return Notifications;
  notifModuleLoaded = true;

  if (isExpoGo()) {
    console.info('[Geofence] Notifications not available in Expo Go');
    return null;
  }

  try {
    Notifications = await import('expo-notifications');
    return Notifications;
  } catch (e) {
    console.warn('[Geofence] expo-notifications not available:', e);
    return null;
  }
}

// ── Background Task Definition ──────────────────

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Geofence] Error:', error);
    return;
  }
  const { eventType, region } = data as Location.LocationGeofencingRegionState;
  if (eventType === Location.GeofencingEventType.Enter) {
    const dealInfo = await getDealInfoForGeofence(region.identifier);
    if (dealInfo) {
      const notif = await getNotifications();
      if (notif) {
        await notif.scheduleNotificationAsync({
          content: {
            title: 'Deal Nearby!',
            body: `Your ${dealInfo.title} discount at ${dealInfo.businessName} is just around the corner!`,
            data: { dealId: region.identifier, type: 'geofence_reminder' },
          },
          trigger: null,
        });
      }
    }
  }
});

// ── Helpers ─────────────────────────────────────

async function getGeofenceState(): Promise<GeofenceState> {
  try {
    const raw = await AsyncStorage.getItem(GEOFENCE_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveGeofenceState(state: GeofenceState): Promise<void> {
  await AsyncStorage.setItem(GEOFENCE_STATE_KEY, JSON.stringify(state));
}

async function getDealInfoForGeofence(dealId: string): Promise<GeofenceDealInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(`@discounty_geofence_deal_${dealId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────

export async function requestBackgroundLocationPermission(): Promise<Location.LocationPermissionResponse> {
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    const fgResult = await Location.requestForegroundPermissionsAsync();
    if (fgResult.status !== 'granted') return fgResult;
  }

  const bg = await Location.getBackgroundPermissionsAsync();
  if (bg.status !== 'granted') {
    return Location.requestBackgroundPermissionsAsync();
  }
  return bg;
}

export async function registerGeofence(
  dealId: string,
  lat: number,
  lng: number,
  dealTitle: string,
  businessName: string
): Promise<{ success: boolean; needsPermission?: boolean }> {
  const bgPerm = await Location.getBackgroundPermissionsAsync();
  if (bgPerm.status !== 'granted') {
    const result = await Location.requestBackgroundPermissionsAsync();
    if (result.status !== 'granted') {
      return { success: false, needsPermission: true };
    }
  }

  // Save deal info for the background task
  await AsyncStorage.setItem(
    `@discounty_geofence_deal_${dealId}`,
    JSON.stringify({ title: dealTitle, businessName })
  );

  // Update state
  const state = await getGeofenceState();
  state[dealId] = { lat, lng, title: dealTitle, businessName };
  await saveGeofenceState(state);

  // Build region list from state
  const regions = Object.entries(state).map(([id, info]) => ({
    identifier: id,
    latitude: info.lat,
    longitude: info.lng,
    radius: GEOFENCE_RADIUS,
    notifyOnEnter: true,
    notifyOnExit: false,
  }));

  // Stop existing geofencing then re-register with all regions
  try {
    const tasks = await Location.getRegisteredGeofencingTasksAsync();
    const hasTask = tasks.some((t) => t.taskName === GEOFENCE_TASK);
    if (hasTask) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }
  } catch {}

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);

  return { success: true };
}

export async function unregisterGeofence(dealId: string): Promise<void> {
  const state = await getGeofenceState();
  delete state[dealId];
  await AsyncStorage.removeItem(`@discounty_geofence_deal_${dealId}`);

  // Stop current geofencing
  try {
    const tasks = await Location.getRegisteredGeofencingTasksAsync();
    const hasTask = tasks.some((t) => t.taskName === GEOFENCE_TASK);
    if (hasTask) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }
  } catch {}

  // Re-register remaining regions if any
  if (Object.keys(state).length > 0) {
    await saveGeofenceState(state);
    const regions = Object.entries(state).map(([id, info]) => ({
      identifier: id,
      latitude: info.lat,
      longitude: info.lng,
      radius: GEOFENCE_RADIUS,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));
    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
  } else {
    await saveGeofenceState({});
  }
}

export async function unregisterAllGeofences(): Promise<void> {
  try {
    const tasks = await Location.getRegisteredGeofencingTasksAsync();
    const hasTask = tasks.some((t) => t.taskName === GEOFENCE_TASK);
    if (hasTask) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }
  } catch {}

  const state = await getGeofenceState();
  for (const dealId of Object.keys(state)) {
    await AsyncStorage.removeItem(`@discounty_geofence_deal_${dealId}`);
  }
  await saveGeofenceState({});
}

export async function isGeofenceRegistered(dealId: string): Promise<boolean> {
  const state = await getGeofenceState();
  return dealId in state;
}
