// ============================================
// Discounty Supabase API Service Layer
// ============================================

import { supabase } from './supabase';
import i18n from '../i18n';
import type {
  Category, CustomerProfile, DealCondition, DataRequest, Discount, DiscountType, DiscountStatus, ProviderProfile, Redemption,
  Review, ClaimDealResult, SubmitReviewResult, RedeemDealResult, SocialLinks,
} from './types';

// ── Categories ──────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

// ── Deals ───────────────────────────────────────

export async function fetchActiveDeals(options?: {
  categoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Discount[]> {
  let query = supabase
    .from('discounts')
    .select(`
      *,
      provider:provider_profiles!provider_id (
        id, business_name, logo_url, average_rating, total_reviews, latitude, longitude
      ),
      category:categories!category_id (
        id, name, name_ar, icon
      )
    `)
    .eq('status', 'active')
    .gte('end_time', new Date().toISOString())
    .lte('start_time', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options?.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Discount[];
}

export async function fetchDealById(dealId: string): Promise<Discount | null> {
  const { data, error } = await supabase
    .from('discounts')
    .select(`
      *,
      provider:provider_profiles!provider_id (
        id, user_id, business_name, logo_url, description, category,
        average_rating, total_reviews, latitude, longitude,
        phone, website, social_links
      ),
      category:categories!category_id (
        id, name, name_ar, icon
      )
    `)
    .eq('id', dealId)
    .single();

  if (error) throw error;
  return data as Discount | null;
}

// ── Provider Profile ────────────────────────────

export async function fetchProviderById(providerId: string): Promise<ProviderProfile | null> {
  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('id', providerId)
    .single();

  if (error) throw error;
  return data as ProviderProfile | null;
}

// ── Customer Profile (Own) ──────────────────────

export async function fetchOwnCustomerProfile(): Promise<CustomerProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data as CustomerProfile | null;
}

export async function updateCustomerProfile(updates: {
  display_name?: string;
  avatar_url?: string;
}): Promise<CustomerProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('customer_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as CustomerProfile;
}

export async function fetchProviderDeals(providerId: string): Promise<Discount[]> {
  const { data, error } = await supabase
    .from('discounts')
    .select(`
      *,
      category:categories!category_id (
        id, name, name_ar, icon
      )
    `)
    .eq('provider_id', providerId)
    .eq('status', 'active')
    .gte('end_time', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Discount[];
}

export async function fetchProviderReviews(providerId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      customer_profile:customer_profiles!customer_id (
        display_name, avatar_url
      )
    `)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []) as Review[];
}

// ── Redemptions (Customer) ──────────────────────

export async function fetchMyRedemptions(): Promise<Redemption[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return [];

  const { data, error } = await supabase
    .from('redemptions')
    .select(`
      *,
      discount:discounts!discount_id (
        *,
        provider:provider_profiles!provider_id (
          id, business_name, logo_url, average_rating
        ),
        category:categories!category_id (
          id, name, name_ar, icon
        )
      ),
      review:reviews!redemption_id (*)
    `)
    .eq('customer_id', profile.id)
    .order('claimed_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Redemption[];
}

export async function getActiveSlotCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return 0;

  // Slots occupied: claimed OR (redeemed but not reviewed)
  const { count: claimedCount } = await supabase
    .from('redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', profile.id)
    .eq('status', 'claimed');

  const { data: redeemed } = await supabase
    .from('redemptions')
    .select('id')
    .eq('customer_id', profile.id)
    .eq('status', 'redeemed');

  // Check which redeemed ones have reviews
  let unreviewedCount = 0;
  if (redeemed && redeemed.length > 0) {
    const redemptionIds = redeemed.map(r => r.id);
    const { data: reviews } = await supabase
      .from('reviews')
      .select('redemption_id')
      .in('redemption_id', redemptionIds);

    const reviewedIds = new Set(reviews?.map(r => r.redemption_id) || []);
    unreviewedCount = redemptionIds.filter(id => !reviewedIds.has(id)).length;
  }

  return (claimedCount || 0) + unreviewedCount;
}

export async function hasClaimedDeal(dealId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return false;

  const { data, error } = await supabase
    .from('redemptions')
    .select('id')
    .eq('customer_id', profile.id)
    .eq('discount_id', dealId)
    .in('status', ['claimed', 'redeemed'])
    .maybeSingle();

  if (error) return false;
  return !!data;
}

// ── RPC Calls ───────────────────────────────────

export async function claimDeal(dealId: string): Promise<ClaimDealResult> {
  console.log('[claimDeal] Calling RPC with deal_id:', dealId);
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[claimDeal] Session exists:', !!session);
  
  const { data, error } = await supabase.rpc('claim_deal', {
    p_deal_id: dealId,
  });

  console.log('[claimDeal] Response data:', data);
  console.log('[claimDeal] Response error:', error);

  if (error) {
    return { success: false, error: error.message };
  }

  return data as ClaimDealResult;
}

export async function submitReview(
  redemptionId: string,
  rating: number,
  comment?: string
): Promise<SubmitReviewResult> {
  const { data, error } = await supabase.rpc('submit_review', {
    p_redemption_id: redemptionId,
    p_rating: rating,
    p_comment: comment || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as SubmitReviewResult;
}

// ── QR Redemption (Provider-side scan) ──────────

export async function redeemDeal(qrCodeHash: string): Promise<RedeemDealResult> {
  const { data, error } = await supabase.rpc('redeem_deal', {
    p_qr_code_hash: qrCodeHash,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data as RedeemDealResult;
}

export async function fetchRedemptionByQrHash(qrCodeHash: string) {
  const { data, error } = await supabase
    .from('redemptions')
    .select(`
      *,
      discount:discounts!discount_id (
        id, title, description, discount_value, type, image_url,
        provider:provider_profiles!provider_id (
          id, business_name, logo_url
        )
      ),
      customer:customer_profiles!customer_id (
        user_id, display_name, avatar_url
      )
    `)
    .eq('qr_code_hash', qrCodeHash)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchRedemptionById(redemptionId: string) {
  const { data, error } = await supabase
    .from('redemptions')
    .select(`
      *,
      discount:discounts!discount_id (
        id, title, description, discount_value, type, image_url,
        provider:provider_profiles!provider_id (
          id, business_name, logo_url, average_rating, total_reviews
        )
      )
    `)
    .eq('id', redemptionId)
    .single();

  if (error) throw error;
  return data;
}

// ── Rejection Reports ───────────────────────────

export async function hasReportedDeal(dealId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('rejection_reports')
    .select('id')
    .eq('deal_id', dealId)
    .eq('customer_id', user.id)
    .maybeSingle();
  return !!data;
}

// ── Saved Deals ─────────────────────────────────
// For v1, saved deals use local storage (AsyncStorage)
// In v2, this can be moved to a `saved_deals` table

import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_DEALS_KEY = 'discounty_saved_deals';

export async function getSavedDealIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_DEALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleSaveDeal(dealId: string): Promise<boolean> {
  const ids = await getSavedDealIds();
  const isSaved = ids.includes(dealId);

  const newIds = isSaved
    ? ids.filter(id => id !== dealId)
    : [...ids, dealId];

  await AsyncStorage.setItem(SAVED_DEALS_KEY, JSON.stringify(newIds));
  return !isSaved; // returns new saved state
}

export async function fetchSavedDeals(): Promise<Discount[]> {
  const ids = await getSavedDealIds();
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('discounts')
    .select(`
      *,
      provider:provider_profiles!provider_id (
        id, business_name, logo_url, average_rating, total_reviews
      ),
      category:categories!category_id (
        id, name, name_ar, icon
      )
    `)
    .in('id', ids);

  if (error) throw error;
  return (data || []) as Discount[];
}

// ── Customer Stats ──────────────────────────────

export async function fetchCustomerStats() {
  const { data: { user } } = await supabase.auth.getUser();
  const empty = { totalClaimed: 0, totalRedeemed: 0, totalSaved: 0, activeDeals: 0 };
  if (!user) return empty;

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) return empty;

  const { count: totalClaimed } = await supabase
    .from('redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', profile.id);

  const { count: totalRedeemed } = await supabase
    .from('redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', profile.id)
    .eq('status', 'redeemed');

  const { count: activeDeals } = await supabase
    .from('redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', profile.id)
    .eq('status', 'claimed');

  const savedIds = await getSavedDealIds();

  return {
    totalClaimed: totalClaimed || 0,
    totalRedeemed: totalRedeemed || 0,
    totalSaved: savedIds.length,
    activeDeals: activeDeals || 0,
  };
}

// ============================================
// Provider-Side API (Phase 3)
// ============================================

// ── Provider Profile (Own) ──────────────────────

export async function fetchOwnProviderProfile(): Promise<ProviderProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('provider_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data as ProviderProfile | null;
}

export async function updateProviderProfile(updates: {
  business_name?: string;
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  social_links?: SocialLinks | null;
  business_hours?: Record<string, string> | null;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<ProviderProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('provider_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as ProviderProfile;
}

export async function uploadProviderImage(base64Data: string, fileType: string, kind: 'logo' | 'cover'): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const mimeType = fileType || 'image/jpeg';
  const fileExt = mimeType.split('/')[1] || 'jpg';
  const path = `${user.id}/${kind}.${fileExt}`;

  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from('provider-assets')
    .upload(path, bytes, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('provider-assets')
    .getPublicUrl(path);

  return `${publicUrl}?t=${Date.now()}`;
}

// ── Provider Stats (Dashboard) ──────────────────

export interface ProviderStats {
  activeDeals: number;
  totalDeals: number;
  totalRedemptions: number;
  claimedRedemptions: number;
  redeemedRedemptions: number;
  averageRating: number;
  totalReviews: number;
  recentRedemptions: Redemption[];
}

export async function fetchProviderStats(): Promise<ProviderStats> {
  const profile = await fetchOwnProviderProfile();
  if (!profile) throw new Error('Provider profile not found');

  // 1. Get deal counts by status
  const { count: activeDeals } = await supabase
    .from('discounts')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', profile.id)
    .eq('status', 'active');

  const { count: totalDeals } = await supabase
    .from('discounts')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', profile.id)
    .neq('status', 'deleted');

  // 2. Get deal IDs for redemption queries
  const { data: dealIds } = await supabase
    .from('discounts')
    .select('id')
    .eq('provider_id', profile.id);

  const ids = dealIds?.map(d => d.id) || [];

  let totalRedemptions = 0;
  let claimedRedemptions = 0;
  let redeemedRedemptions = 0;
  let recentRedemptions: Redemption[] = [];

  if (ids.length > 0) {
    const { count: totalR } = await supabase
      .from('redemptions')
      .select('id', { count: 'exact', head: true })
      .in('discount_id', ids);

    const { count: claimedR } = await supabase
      .from('redemptions')
      .select('id', { count: 'exact', head: true })
      .in('discount_id', ids)
      .eq('status', 'claimed');

    const { count: redeemedR } = await supabase
      .from('redemptions')
      .select('id', { count: 'exact', head: true })
      .in('discount_id', ids)
      .eq('status', 'redeemed');

    totalRedemptions = totalR || 0;
    claimedRedemptions = claimedR || 0;
    redeemedRedemptions = redeemedR || 0;

    // Recent redemptions (last 5)
    const { data: recent } = await supabase
      .from('redemptions')
      .select(`
        *,
        discount:discounts!discount_id (
          id, title, discount_value, type
        )
      `)
      .in('discount_id', ids)
      .order('claimed_at', { ascending: false })
      .limit(5);

    recentRedemptions = (recent || []) as Redemption[];
  }

  return {
    activeDeals: activeDeals || 0,
    totalDeals: totalDeals || 0,
    totalRedemptions,
    claimedRedemptions,
    redeemedRedemptions,
    averageRating: profile.average_rating || 0,
    totalReviews: profile.total_reviews || 0,
    recentRedemptions,
  };
}

// ── Provider Deal List (All Statuses) ────────────

export async function fetchProviderDealsList(options?: {
  status?: DiscountStatus;
  limit?: number;
}): Promise<Discount[]> {
  const profile = await fetchOwnProviderProfile();
  if (!profile) throw new Error('Provider profile not found');

  let query = supabase
    .from('discounts')
    .select(`
      *,
      category:categories!category_id (
        id, name, name_ar, icon
      )
    `)
    .eq('provider_id', profile.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Discount[];
}

// ── Create Deal ─────────────────────────────────

export interface CreateDealInput {
  title: string;
  description?: string;
  discount_value: number;
  type: DiscountType;
  category_id?: string;
  image_url?: string;
  start_time: string;
  end_time: string;
  max_redemptions: number;
  status?: DiscountStatus;
  conditions?: string[];
}

export async function createDeal(input: CreateDealInput): Promise<Discount> {
  const profile = await fetchOwnProviderProfile();
  if (!profile) throw new Error('Provider profile not found');

  const { data, error } = await supabase
    .from('discounts')
    .insert({
      provider_id: profile.id,
      title: input.title,
      description: input.description || null,
      discount_value: input.discount_value,
      type: input.type,
      category_id: input.category_id || null,
      image_url: input.image_url || null,
      start_time: input.start_time,
      end_time: input.end_time,
      max_redemptions: input.max_redemptions,
      status: input.status || 'active',
      conditions: input.conditions || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as Discount;
}

// ── Update Deal ─────────────────────────────────

export interface UpdateDealInput {
  title?: string;
  description?: string;
  discount_value?: number;
  type?: DiscountType;
  category_id?: string;
  image_url?: string;
  start_time?: string;
  end_time?: string;
  max_redemptions?: number;
  status?: DiscountStatus;
  conditions?: string[];
}

export async function updateDeal(dealId: string, input: UpdateDealInput): Promise<Discount> {
  const profile = await fetchOwnProviderProfile();
  if (!profile) throw new Error('Provider profile not found');

  const { data, error } = await supabase
    .from('discounts')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)
    .eq('provider_id', profile.id)
    .select()
    .single();

  if (error) throw error;
  return data as Discount;
}

// ── Deal Status Changes ─────────────────────────

export async function pauseDeal(dealId: string): Promise<Discount> {
  return updateDeal(dealId, { status: 'paused' });
}

export async function activateDeal(dealId: string): Promise<Discount> {
  return updateDeal(dealId, { status: 'active' });
}

export async function deleteDeal(dealId: string): Promise<void> {
  const profile = await fetchOwnProviderProfile();
  if (!profile) throw new Error('Provider profile not found');

  const { error } = await supabase
    .from('discounts')
    .update({ status: 'deleted', updated_at: new Date().toISOString() })
    .eq('id', dealId)
    .eq('provider_id', profile.id);

  if (error) throw error;
}

// ── Image Upload ────────────────────────────────

export async function uploadDealImage(
  fileUri: string,
  fileName: string,
  fileType: string,
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Fetch the file and convert to blob
  const response = await fetch(fileUri);
  const blob = await response.blob();

  // Use blob's actual MIME type (reliable on web where URI is blob:)
  const mimeType = blob.type || fileType || 'image/jpeg';
  const fileExt = mimeType.split('/')[1] || 'jpg';
  // Path must start with user.id to match storage RLS policy
  const path = `${user.id}/deals/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('provider-assets')
    .upload(path, blob, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('provider-assets')
    .getPublicUrl(path);

  return publicUrl;
}

// ── Avatar Upload ───────────────────────────────

export async function uploadAvatar(base64Data: string, fileType: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const mimeType = fileType || 'image/jpeg';
  const fileExt = mimeType.split('/')[1] || 'jpg';
  const path = `${user.id}/avatar.${fileExt}`;

  // Convert base64 to Uint8Array
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from('provider-assets')
    .upload(path, bytes, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('provider-assets')
    .getPublicUrl(path);

  return `${publicUrl}?t=${Date.now()}`;
}

// ── Provider Reviews (for provider's own reviews tab) ──

export async function fetchProviderOwnReviews(): Promise<Review[]> {
  const profile = await fetchOwnProviderProfile();
  if (!profile) throw new Error('Provider profile not found');

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      customer_profile:customer_profiles!customer_id (
        display_name, avatar_url
      )
    `)
    .eq('provider_id', profile.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Review[];
}

export async function replyToReview(reviewId: string, reply: string): Promise<void> {
  const profile = await fetchOwnProviderProfile();
  if (!profile) throw new Error('Provider profile not found');

  const { error } = await supabase
    .from('reviews')
    .update({
      provider_reply: reply,
      replied_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('provider_id', profile.id);

  if (error) throw error;
}

export async function fetchUnrepliedReviewCount(): Promise<number> {
  const profile = await fetchOwnProviderProfile();
  if (!profile) return 0;

  const { count, error } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('provider_id', profile.id)
    .is('provider_reply', null);

  if (error) return 0;
  return count || 0;
}

// ── Deal Redemption Stats ───────────────────────

export interface DealRedemptionStats {
  total: number;
  claimed: number;
  redeemed: number;
  expired: number;
}

export async function fetchDealRedemptionStats(dealId: string): Promise<DealRedemptionStats> {
  const { count: total } = await supabase
    .from('redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('discount_id', dealId);

  const { count: claimed } = await supabase
    .from('redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('discount_id', dealId)
    .eq('status', 'claimed');

  const { count: redeemed } = await supabase
    .from('redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('discount_id', dealId)
    .eq('status', 'redeemed');

  const { count: expired } = await supabase
    .from('redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('discount_id', dealId)
    .eq('status', 'expired');

  return {
    total: total || 0,
    claimed: claimed || 0,
    redeemed: redeemed || 0,
    expired: expired || 0,
  };
}

// ============================================
// v1.2.1 — Deal Conditions
// ============================================

export async function fetchDealConditions(): Promise<DealCondition[]> {
  const { data, error } = await supabase
    .from('deal_conditions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

// ============================================
// v1.2.1 — Rejection Reports & Privacy
// ============================================

export async function submitRejectionReport(
  dealId: string,
  redemptionId: string,
  reasonType: string,
  reasonDetail?: string
): Promise<{ success: boolean; autoHidden?: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('submit_rejection_report', {
    p_deal_id: dealId,
    p_redemption_id: redemptionId,
    p_reason_type: reasonType,
    p_reason_detail: reasonDetail || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.success) {
    // Notify admins with translated text
    const { data: deal } = await supabase
      .from('discounts')
      .select('title')
      .eq('id', dealId)
      .single();

    const { data: admins } = await supabase
      .from('admin_profiles')
      .select('user_id')
      .eq('is_active', true);

    if (admins && admins.length > 0) {
      const title = i18n.t('rejection.adminNotifTitle');
      const body = i18n.t('rejection.adminNotifBody', { deal: deal?.title || '' });

      await supabase.from('notifications').insert(
        admins.map((a) => ({
          user_id: a.user_id,
          type: 'rejection_report',
          title,
          body,
          data: { report_id: data.report_id, deal_id: dealId, reason_type: reasonType },
          is_read: false,
        }))
      );
    }
  }

  return data as { success: boolean; autoHidden?: boolean; error?: string };
}

export async function updatePrivacySettings(settings: {
  location_tracking?: boolean;
  marketing_emails?: boolean;
  data_sharing?: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc('update_privacy_settings', {
    p_location_tracking: settings.location_tracking ?? null,
    p_marketing_emails: settings.marketing_emails ?? null,
    p_data_sharing: settings.data_sharing ?? null,
  });

  if (error) throw error;
}

export async function requestDataExport(): Promise<string> {
  const { data, error } = await supabase.rpc('request_data_export');
  if (error) throw error;
  return data as string;
}

export async function requestAccountDeletion(): Promise<string> {
  const { data, error } = await supabase.rpc('request_account_deletion');
  if (error) throw error;
  return data as string;
}

export async function fetchDataRequests(): Promise<DataRequest[]> {
  const { data, error } = await supabase
    .from('data_requests')
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return (data || []) as DataRequest[];
}
