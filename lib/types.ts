export type ProfileLite = {
  id: string;
  full_name: string | null;
  store_name: string | null;
  store_type: string | null;
  phone: string | null;
  status: string | null;
  avatar_url: string | null;
};

export type Profile = ProfileLite & {
  role: string | null;
  district: string | null;
  upazila: string | null;
  address?: string | null;
  referral_creator_id?: string | null;
  created_at: string;
};

export type OrderItem = {
  id?: string;
  quantity: number;
  /** Unit charged (VAT-inclusive). */
  price_snapshot: number;
  base_price_snapshot?: number | null;
  vat_rate_snapshot?: number | null;
  vat_amount_snapshot?: number | null;
  product_name_snapshot: string | null;
  product_variants?: { color: string | null } | null;
  product_sizes?: { size: string | null } | null;
};

export type OrderRow = {
  id: string;
  status: string;
  created_at: string;
  full_name: string | null;
  phone?: string | null;
  city?: string | null;
  product_id?: string;
  user_id?: string;
  order_items: OrderItem[];
  total: number;
  product_name?: string | null;
  seller?: ProfileLite | null;
};

export type Paged<K extends string, T> = { [key in K]: T[] } & { total: number };

export type Overview = {
  pending: {
    wholesaleActivations: number;
    adRequests: number;
    featuredRequests: number;
    referralApplications: number;
    reports: number;
    unreadSupport: number;
  };
  stats: {
    users: {
      total: number;
      wholesale: number;
      retail: number;
      other: number;
      frozen: number;
      restricted: number;
      newLast7Days: number;
    };
    products: { total: number; active: number };
    orders: { total: number; byStatus: Record<string, number> };
    revenue: {
      completedSalesTotal: number;
    };
    series: { day: string; signups: number; orders: number }[];
    latestOrders: OrderRow[];
    latestUsers: Profile[];
  };
};

export type ProductRow = {
  id: string;
  name: string;
  price: number;
  moq: number | null;
  status: string | null;
  active: boolean | null;
  is_deleted: boolean | null;
  created_at: string;
  seller_id: string;
  category_id: string | null;
  image_url: string | null;
  seller: ProfileLite | null;
  category_name: string | null;
};

export type Report = {
  id: string;
  reporter_id: string;
  target_type: "product" | "user";
  product_id: string | null;
  profile_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  admin_note?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  reporter?: ProfileLite | null;
  target_profile?: ProfileLite | null;
  target_product?: {
    id: string;
    name: string;
    status: string | null;
    is_deleted: boolean | null;
    image_url: string | null;
    seller: ProfileLite | null;
  } | null;
};

export type ReviewStatus = "pending" | "approved" | "rejected" | "all";

export type SellerRef = {
  id: string;
  store_name: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url?: string | null;
} | null;

export type AdRequest = {
  id: string;
  seller_id: string;
  sell_target_bdt: number;
  budget_bdt: number;
  duration_days: number;
  status: string;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles: SellerRef;
  product_ad_request_items: {
    product_id: string;
    products: {
      id: string;
      name: string;
      price: number;
      product_images: { image_url: string; is_main: boolean | null }[];
    } | null;
  }[];
};

export type ProductAd = {
  id: string;
  product_id: string;
  seller_id: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  product: { id: string; name: string; image_url: string | null } | null;
  seller: ProfileLite | null;
};

export type FeaturedRequest = {
  id: string;
  seller_id: string;
  message: string | null;
  status: string;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles: SellerRef;
};

export type FeaturedStore = {
  seller_id: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  seller: ProfileLite | null;
};

export type ReferralApplication = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  platform: string;
  profile_url: string;
  follower_count: string | null;
  message: string | null;
  status: string;
  admin_note: string | null;
  reviewed_at: string | null;
  referral_creator_id: string | null;
  created_at: string;
};

export type ReferralCreator = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  created_at: string;
  user_id: string | null;
  owner: ProfileLite | null;
  signups: number;
  sellerSignups: number;
};

export type SupportRequest = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  is_read: boolean | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
  user: ProfileLite | null;
};

export type Catalog = {
  categories: {
    id: string;
    name: string;
    created_at: string;
    sizeKey: string;
    productCount: number;
    subcategories: { id: string; name: string; category_id: string; productCount: number }[];
  }[];
  sizes: { id: string; label: string; category: string; sort_order: number | null }[];
};

export type AuditLog = {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};
