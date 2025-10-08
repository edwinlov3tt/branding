-- Seed curated ad inspirations across various niches
-- These will be shown to all users before they perform a search

INSERT INTO ad_inspirations (
    foreplay_ad_id,
    ad_data,
    thumbnail_url,
    video_url,
    platform,
    advertiser_name,
    niche,
    ad_copy,
    is_curated
) VALUES
-- E-commerce / Fashion
('fp_001', '{"first_seen": "2025-01-15", "last_seen": "2025-10-05", "cta": "Shop Now"}', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400', NULL, 'Instagram', 'Warby Parker', 'Fashion', '30% OFF STOREWIDE - Frames starting at $95. Free shipping & returns.', true),
('fp_002', '{"first_seen": "2024-12-20", "last_seen": "2025-10-01", "cta": "Learn More"}', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', NULL, 'Facebook', 'Allbirds', 'Sustainable Fashion', 'The world''s most comfortable shoes. Made from natural materials.', true),

-- SaaS / Tech
('fp_003', '{"first_seen": "2025-01-10", "last_seen": "2025-10-06", "cta": "Start Free Trial"}', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', NULL, 'LinkedIn', 'Notion', 'Productivity', 'One workspace. Every team. Get Notion free.', true),
('fp_004', '{"first_seen": "2025-02-01", "last_seen": "2025-10-07", "cta": "Sign Up"}', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400', NULL, 'Facebook', 'Canva', 'Design Tools', 'Design anything. Publish anywhere. Try Canva Pro free for 30 days.', true),

-- Food & Beverage
('fp_005', '{"first_seen": "2025-01-25", "last_seen": "2025-10-05", "cta": "Order Now"}', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', NULL, 'Instagram', 'Blue Bottle Coffee', 'Food & Beverage', 'Freshly roasted coffee, delivered to your door.', true),
('fp_006', '{"first_seen": "2024-12-15", "last_seen": "2025-10-03", "cta": "Try HelloFresh"}', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', NULL, 'TikTok', 'HelloFresh', 'Meal Kits', 'America''s #1 Meal Kit. Get $100 off your first 4 boxes!', true),

-- Health & Wellness
('fp_007', '{"first_seen": "2025-02-10", "last_seen": "2025-10-08", "cta": "Start Your Journey"}', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', NULL, 'Facebook', 'Peloton', 'Fitness', 'Thicker, fuller hair by summer. Shop now.', true),
('fp_008', '{"first_seen": "2025-01-05", "last_seen": "2025-10-02", "cta": "Shop Benefits"}', 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400', NULL, 'Instagram', 'Hims', 'Health', 'Countless health benefits for just $0.83 per serving.', true),

-- Beauty
('fp_009', '{"first_seen": "2025-01-20", "last_seen": "2025-10-06", "cta": "Discover More"}', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', NULL, 'Instagram', 'Glossier', 'Beauty', 'Skin first. Makeup second. Shop the Glossier routine.', true),
('fp_010', '{"first_seen": "2024-12-28", "last_seen": "2025-10-04", "cta": "Shop Now"}', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400', NULL, 'TikTok', 'Fenty Beauty', 'Beauty', 'Beauty for All. 50 shades of foundation.', true),

-- Finance
('fp_011', '{"first_seen": "2025-02-15", "last_seen": "2025-10-07", "cta": "Get Started"}', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400', NULL, 'LinkedIn', 'Robinhood', 'Finance', 'Invest in stocks, ETFs, and crypto. Commission-free.', true),
('fp_012', '{"first_seen": "2025-01-12", "last_seen": "2025-10-05", "cta": "Learn More"}', 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', NULL, 'Facebook', 'Stripe', 'Payments', 'Financial infrastructure to grow your revenue.', true),

-- Travel
('fp_013', '{"first_seen": "2025-01-30", "last_seen": "2025-10-08", "cta": "Explore Japan"}', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400', NULL, 'Instagram', 'Away Luggage', 'Travel', 'Explore Japan in any Weather. Premium luggage for modern travel.', true),
('fp_014', '{"first_seen": "2024-12-10", "last_seen": "2025-10-01", "cta": "Book Now"}', 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400', NULL, 'Facebook', 'Airbnb', 'Travel', 'Don''t go there. Live there. Book unique homes worldwide.', true),

-- Education
('fp_015', '{"first_seen": "2025-02-05", "last_seen": "2025-10-06", "cta": "Enroll Now"}', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400', NULL, 'YouTube', 'Coursera', 'Education', 'Learn from the world''s best universities. Online.', true),
('fp_016', '{"first_seen": "2025-01-18", "last_seen": "2025-10-04", "cta": "Start Learning"}', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', NULL, 'LinkedIn', 'MasterClass', 'Education', 'Learn from the best. 150+ classes taught by world-class instructors.', true),

-- Home & Garden
('fp_017', '{"first_seen": "2025-01-22", "last_seen": "2025-10-03", "cta": "Shop Collection"}', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400', NULL, 'Pinterest', 'Brooklinen', 'Home', 'Luxury sheets without the luxury markup.', true),
('fp_018', '{"first_seen": "2024-12-30", "last_seen": "2025-10-07", "cta": "Browse Decor"}', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400', NULL, 'Instagram', 'The Citizenry', 'Home Decor', 'Artisan-made home decor from around the world.', true),

-- Gaming / Entertainment
('fp_019', '{"first_seen": "2025-02-12", "last_seen": "2025-10-08", "cta": "Play Free"}', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', NULL, 'TikTok', 'Epic Games', 'Gaming', 'Download Fortnite. Play free now on all platforms.', true),
('fp_020', '{"first_seen": "2025-01-08", "last_seen": "2025-10-02", "cta": "Watch Now"}', 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400', NULL, 'YouTube', 'Spotify', 'Music', '100 million songs. Listen free.', true)

ON CONFLICT DO NOTHING;
