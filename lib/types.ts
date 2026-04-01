// ============================================
// Discounty TypeScript Types
// ============================================

export type UserRole = 'customer' | 'provider' | 'admin';

export type DiscountType = 'percentage' | 'fixed';
export type DiscountStatus = 'draft' | 'active' | 'paused' | 'deleted';
export type RedemptionStatus = 'claimed' | 'redeemed' | 'expired';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Category {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: string[];
  created_at: string;
  updated_at: string;
}

export interface ProviderProfile {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
  approval_status: ApprovalStatus;
  phone: string | null;
  website: string | null;
  social_links: SocialLinks | null;
  business_hours: Record<string, unknown> | null;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
  snapchat?: string;
}

export interface Discount {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  discount_value: number;
  type: DiscountType;
  category_id: string | null;
  image_url: string | null;
  start_time: string;
  end_time: string;
  status: DiscountStatus;
  max_redemptions: number;
  current_redemptions: number;
  view_count: number;
  alphanumeric_code: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  provider?: ProviderProfile;
  category?: Category;
}

export interface Redemption {
  id: string;
  discount_id: string;
  customer_id: string;
  qr_code_hash: string | null;
  status: RedemptionStatus;
  claimed_at: string;
  redeemed_at: string | null;
  // Joined data
  discount?: Discount;
  review?: Review;
}

export interface Review {
  id: string;
  provider_id: string;
  customer_id: string;
  redemption_id: string;
  rating: number;
  comment: string | null;
  provider_reply: string | null;
  created_at: string;
  replied_at: string | null;
  // Joined data
  customer_profile?: CustomerProfile;
}

// Function return types
export interface ClaimDealResult {
  success: boolean;
  error?: string;
  redemption_id?: string;
  qr_code_hash?: string;
}

export interface RedeemDealResult {
  success: boolean;
  error?: string;
  redemption_id?: string;
  deal_title?: string;
  discount_value?: number;
  discount_type?: DiscountType;
}

export interface SubmitReviewResult {
  success: boolean;
  error?: string;
  review_id?: string;
}
