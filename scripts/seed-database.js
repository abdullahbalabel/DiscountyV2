// ============================================
// Database Seed Script for Discounty
// ============================================
// Run with: node scripts/seed-database.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yzwwzxffexjwxynnwngw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d3d6eGZmZXhqd3h5bm53bmd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODg0MDIsImV4cCI6MjA5MDQ2NDQwMn0.JH-nWmZBRPXLY0wV6e_d4vfETEoZnCZsFBfdzuMu0zg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Mock data
const categories = [
  { id: generateUUID(), name: 'Restaurants', name_ar: 'مطاعم', icon: 'restaurant', sort_order: 1, is_active: true },
  { id: generateUUID(), name: 'Cafes', name_ar: 'مقاهي', icon: 'local-cafe', sort_order: 2, is_active: true },
  { id: generateUUID(), name: 'Shopping', name_ar: 'تسوق', icon: 'shopping-bag', sort_order: 3, is_active: true },
  { id: generateUUID(), name: 'Beauty', name_ar: 'جمال', icon: 'spa', sort_order: 4, is_active: true },
  { id: generateUUID(), name: 'Entertainment', name_ar: 'ترفيه', icon: 'sports-esports', sort_order: 5, is_active: true },
  { id: generateUUID(), name: 'Health', name_ar: 'صحة', icon: 'fitness-center', sort_order: 6, is_active: true },
  { id: generateUUID(), name: 'Services', name_ar: 'خدمات', icon: 'build', sort_order: 7, is_active: true },
  { id: generateUUID(), name: 'Travel', name_ar: 'سفر', icon: 'flight', sort_order: 8, is_active: true },
];

// Mock provider profiles (businesses)
const providers = [
  {
    id: generateUUID(),
    user_id: generateUUID(),
    business_name: 'Pizza Palace',
    category: 'Restaurants',
    latitude: 24.7136,
    longitude: 46.6753,
    description: 'Authentic Italian pizzas made with fresh ingredients',
    logo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
    cover_photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    approval_status: 'approved',
    phone: '+966501234567',
    website: 'https://pizzapalace.com',
    social_links: { instagram: '@pizzapalace', facebook: 'pizzapalace' },
    business_hours: { monday: '10:00-22:00', tuesday: '10:00-22:00', wednesday: '10:00-22:00', thursday: '10:00-23:00', friday: '14:00-23:00', saturday: '10:00-23:00', sunday: '10:00-22:00' },
    average_rating: 4.5,
    total_reviews: 128,
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    business_name: 'Coffee Corner',
    category: 'Cafes',
    latitude: 24.7136,
    longitude: 46.6753,
    description: 'Premium coffee and cozy atmosphere',
    logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200',
    cover_photo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    approval_status: 'approved',
    phone: '+966502345678',
    website: 'https://coffeecorner.com',
    social_links: { instagram: '@coffeecorner' },
    business_hours: { monday: '07:00-22:00', tuesday: '07:00-22:00', wednesday: '07:00-22:00', thursday: '07:00-23:00', friday: '14:00-23:00', saturday: '07:00-23:00', sunday: '08:00-22:00' },
    average_rating: 4.8,
    total_reviews: 256,
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    business_name: 'Fashion Hub',
    category: 'Shopping',
    latitude: 24.7136,
    longitude: 46.6753,
    description: 'Trendy fashion for all ages',
    logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
    cover_photo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    approval_status: 'approved',
    phone: '+966503456789',
    website: 'https://fashionhub.com',
    social_links: { instagram: '@fashionhub', tiktok: '@fashionhub' },
    business_hours: { monday: '10:00-22:00', tuesday: '10:00-22:00', wednesday: '10:00-22:00', thursday: '10:00-23:00', friday: '14:00-23:00', saturday: '10:00-23:00', sunday: '10:00-22:00' },
    average_rating: 4.2,
    total_reviews: 89,
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    business_name: 'Beauty Spa',
    category: 'Beauty',
    latitude: 24.7136,
    longitude: 46.6753,
    description: 'Relaxing spa treatments and beauty services',
    logo_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200',
    cover_photo_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800',
    approval_status: 'approved',
    phone: '+966504567890',
    website: 'https://beautyspa.com',
    social_links: { instagram: '@beautyspa', facebook: 'beautyspa' },
    business_hours: { monday: '09:00-21:00', tuesday: '09:00-21:00', wednesday: '09:00-21:00', thursday: '09:00-22:00', friday: '14:00-22:00', saturday: '09:00-22:00', sunday: '10:00-20:00' },
    average_rating: 4.7,
    total_reviews: 167,
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    business_name: 'Game Zone',
    category: 'Entertainment',
    latitude: 24.7136,
    longitude: 46.6753,
    description: 'Fun gaming experience for everyone',
    logo_url: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=200',
    cover_photo_url: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800',
    approval_status: 'approved',
    phone: '+966505678901',
    website: 'https://gamezone.com',
    social_links: { instagram: '@gamezone', tiktok: '@gamezone' },
    business_hours: { monday: '12:00-23:00', tuesday: '12:00-23:00', wednesday: '12:00-23:00', thursday: '12:00-00:00', friday: '14:00-00:00', saturday: '12:00-00:00', sunday: '12:00-22:00' },
    average_rating: 4.6,
    total_reviews: 203,
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    business_name: 'Burger Barn',
    category: 'Restaurants',
    latitude: 24.7136,
    longitude: 46.6753,
    description: 'Juicy burgers and crispy fries',
    logo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
    cover_photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    approval_status: 'approved',
    phone: '+966506789012',
    website: 'https://burgerbarn.com',
    social_links: { instagram: '@burgerbarn', facebook: 'burgerbarn' },
    business_hours: { monday: '11:00-23:00', tuesday: '11:00-23:00', wednesday: '11:00-23:00', thursday: '11:00-00:00', friday: '14:00-00:00', saturday: '11:00-00:00', sunday: '11:00-22:00' },
    average_rating: 4.4,
    total_reviews: 312,
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    business_name: 'Sushi Master',
    category: 'Restaurants',
    latitude: 24.7136,
    longitude: 46.6753,
    description: 'Fresh sushi and Japanese cuisine',
    logo_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200',
    cover_photo_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    approval_status: 'approved',
    phone: '+966507890123',
    website: 'https://sushimaster.com',
    social_links: { instagram: '@sushimaster' },
    business_hours: { monday: '12:00-22:00', tuesday: '12:00-22:00', wednesday: '12:00-22:00', thursday: '12:00-23:00', friday: '14:00-23:00', saturday: '12:00-23:00', sunday: '12:00-22:00' },
    average_rating: 4.9,
    total_reviews: 178,
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    business_name: 'Gym Plus',
    category: 'Health',
    latitude: 24.7136,
    longitude: 46.6753,
    description: 'State-of-the-art fitness facility',
    logo_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200',
    cover_photo_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    approval_status: 'approved',
    phone: '+966508901234',
    website: 'https://gymplus.com',
    social_links: { instagram: '@gymplus', facebook: 'gymplus' },
    business_hours: { monday: '05:00-23:00', tuesday: '05:00-23:00', wednesday: '05:00-23:00', thursday: '05:00-00:00', friday: '14:00-00:00', saturday: '05:00-00:00', sunday: '06:00-22:00' },
    average_rating: 4.3,
    total_reviews: 145,
  },
];

// Mock customer profiles
const customers = [
  {
    id: generateUUID(),
    user_id: generateUUID(),
    display_name: 'Ahmed Al-Saud',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    preferences: ['Restaurants', 'Cafes'],
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    display_name: 'Fatima Al-Harbi',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    preferences: ['Beauty', 'Shopping'],
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    display_name: 'Mohammed Al-Qahtani',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    preferences: ['Entertainment', 'Restaurants'],
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    display_name: 'Noura Al-Dosari',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    preferences: ['Health', 'Cafes'],
  },
  {
    id: generateUUID(),
    user_id: generateUUID(),
    display_name: 'Khalid Al-Rashid',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    preferences: ['Shopping', 'Entertainment'],
  },
];

// Generate deals for each provider
function generateDeals(providers, categories) {
  const deals = [];
  const dealTemplates = [
    { title: '20% Off Your First Order', description: 'Get 20% off on your first order. Valid for new customers only.', discount_value: 20, type: 'percentage' },
    { title: 'Buy 1 Get 1 Free', description: 'Buy one item and get another one free. Limited time offer!', discount_value: 50, type: 'percentage' },
    { title: '$10 Off', description: 'Get $10 off on orders over $50. Don\'t miss this deal!', discount_value: 10, type: 'fixed' },
    { title: '30% Off Weekend Special', description: 'Enjoy 30% off every weekend. Valid on all items.', discount_value: 30, type: 'percentage' },
    { title: 'Free Delivery', description: 'Free delivery on all orders. No minimum order required.', discount_value: 5, type: 'fixed' },
    { title: '15% Off Happy Hour', description: '15% off during happy hour (3 PM - 6 PM). Weekdays only.', discount_value: 15, type: 'percentage' },
    { title: '$25 Off Premium', description: '$25 off on premium services. Book now!', discount_value: 25, type: 'fixed' },
    { title: '40% Off Clearance', description: 'Up to 40% off on selected items. While stocks last.', discount_value: 40, type: 'percentage' },
  ];

  providers.forEach((provider, index) => {
    const category = categories.find(c => c.name === provider.category);
    const numDeals = Math.floor(Math.random() * 3) + 2; // 2-4 deals per provider
    
    for (let i = 0; i < numDeals; i++) {
      const template = dealTemplates[(index * 3 + i) % dealTemplates.length];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 60) + 30);
      
      deals.push({
        id: generateUUID(),
        provider_id: provider.id,
        title: template.title,
        description: template.description,
        discount_value: template.discount_value,
        type: template.type,
        category_id: category?.id || null,
        image_url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?w=400`,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'active',
        max_redemptions: Math.floor(Math.random() * 500) + 100,
        current_redemptions: Math.floor(Math.random() * 100),
        view_count: Math.floor(Math.random() * 1000),
        alphanumeric_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });
    }
  });

  return deals;
}

// Generate redemptions and reviews
function generateRedemptionsAndReviews(deals, customers) {
  const redemptions = [];
  const reviews = [];
  const reviewComments = [
    'Great experience! Will definitely come back.',
    'Good value for money. Highly recommended!',
    'The service was excellent. Very satisfied.',
    'Nice atmosphere and friendly staff.',
    'Quality products at reasonable prices.',
    'Had a wonderful time. Thank you!',
    'Exceeded my expectations. 5 stars!',
    'Perfect for a family outing.',
    'Quick service and delicious food.',
    'Will recommend to friends and family.',
  ];

  customers.forEach(customer => {
    const numRedemptions = Math.floor(Math.random() * 5) + 2; // 2-6 redemptions per customer
    const selectedDeals = [...deals].sort(() => Math.random() - 0.5).slice(0, numRedemptions);

    selectedDeals.forEach(deal => {
      const statuses = ['claimed', 'redeemed', 'redeemed', 'redeemed']; // More likely to be redeemed
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const claimedAt = new Date();
      claimedAt.setDate(claimedAt.getDate() - Math.floor(Math.random() * 30));
      
      const redemption = {
        id: generateUUID(),
        discount_id: deal.id,
        customer_id: customer.id,
        qr_code_hash: Math.random().toString(36).substring(2, 15),
        status: status,
        claimed_at: claimedAt.toISOString(),
        redeemed_at: status === 'redeemed' ? new Date(claimedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      };

      redemptions.push(redemption);

      // Add review for redeemed deals (80% chance)
      if (status === 'redeemed' && Math.random() > 0.2) {
        const provider = providers.find(p => p.id === deal.provider_id);
        reviews.push({
          id: generateUUID(),
          provider_id: deal.provider_id,
          customer_id: customer.id,
          redemption_id: redemption.id,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
          provider_reply: Math.random() > 0.5 ? 'Thank you for your feedback! We hope to see you again soon.' : null,
          created_at: new Date(claimedAt.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
          replied_at: Math.random() > 0.5 ? new Date(claimedAt.getTime() + Math.random() * 21 * 24 * 60 * 60 * 1000).toISOString() : null,
        });
      }
    });
  });

  return { redemptions, reviews };
}

// Main seed function
async function seedDatabase() {
  console.log('Starting database seed...\n');

  try {
    // 1. Insert categories
    console.log('Inserting categories...');
    const { error: catError } = await supabase
      .from('categories')
      .insert(categories);
    
    if (catError) {
      console.error('Error inserting categories:', catError.message);
    } else {
      console.log(`✓ Inserted ${categories.length} categories`);
    }

    // 2. Insert provider profiles
    console.log('\nInserting provider profiles...');
    const { error: provError } = await supabase
      .from('provider_profiles')
      .insert(providers);
    
    if (provError) {
      console.error('Error inserting providers:', provError.message);
    } else {
      console.log(`✓ Inserted ${providers.length} provider profiles`);
    }

    // 3. Insert customer profiles
    console.log('\nInserting customer profiles...');
    const { error: custError } = await supabase
      .from('customer_profiles')
      .insert(customers);
    
    if (custError) {
      console.error('Error inserting customers:', custError.message);
    } else {
      console.log(`✓ Inserted ${customers.length} customer profiles`);
    }

    // 4. Generate and insert deals
    console.log('\nGenerating and inserting deals...');
    const deals = generateDeals(providers, categories);
    const { error: dealError } = await supabase
      .from('discounts')
      .insert(deals);
    
    if (dealError) {
      console.error('Error inserting deals:', dealError.message);
    } else {
      console.log(`✓ Inserted ${deals.length} deals`);
    }

    // 5. Generate and insert redemptions and reviews
    console.log('\nGenerating redemptions and reviews...');
    const { redemptions, reviews } = generateRedemptionsAndReviews(deals, customers);
    
    const { error: redError } = await supabase
      .from('redemptions')
      .insert(redemptions);
    
    if (redError) {
      console.error('Error inserting redemptions:', redError.message);
    } else {
      console.log(`✓ Inserted ${redemptions.length} redemptions`);
    }

    const { error: revError } = await supabase
      .from('reviews')
      .insert(reviews);
    
    if (revError) {
      console.error('Error inserting reviews:', revError.message);
    } else {
      console.log(`✓ Inserted ${reviews.length} reviews`);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('SEED COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Categories: ${categories.length}`);
    console.log(`Providers: ${providers.length}`);
    console.log(`Customers: ${customers.length}`);
    console.log(`Deals: ${deals.length}`);
    console.log(`Redemptions: ${redemptions.length}`);
    console.log(`Reviews: ${reviews.length}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the seed
seedDatabase();
