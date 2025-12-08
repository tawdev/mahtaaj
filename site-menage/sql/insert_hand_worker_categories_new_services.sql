-- Insert new hand worker categories (الأعمال اليدوية)
-- Execute this script in Supabase SQL Editor

-- 1️⃣ مصلّح الأجهزة المنزلية / Réparateur d'appareils ménagers / Home Appliances Technician
INSERT INTO hand_worker_categories (
  name_ar,
  name_fr,
  name_en,
  description_ar,
  description_fr,
  description_en,
  icon,
  image,
  price_per_day,
  minimum_jours,
  is_active,
  "order"
) VALUES (
  'مصلّح الأجهزة المنزلية',
  'Réparateur d''appareils ménagers',
  'Home Appliances Technician',
  'متخصص في إصلاح الأعطال المنزلية لأجهزة مثل الثلاجات والغسالات والأفران…',
  'Réparation des appareils ménagers (frigos, machines à laver, fours…).',
  'Repair of home appliances (fridge, washer, oven…).',
  'fas fa-tools',
  NULL, -- Image URL to be added later
  200,
  1,
  true,
  (SELECT COALESCE(MAX("order"), 0) + 1 FROM hand_worker_categories)
);

-- 2️⃣ عامل الألومنيوم / Ouvrier Aluminium / Aluminium Worker
INSERT INTO hand_worker_categories (
  name_ar,
  name_fr,
  name_en,
  description_ar,
  description_fr,
  description_en,
  icon,
  image,
  price_per_day,
  minimum_jours,
  is_active,
  "order"
) VALUES (
  'عامل الألومنيوم',
  'Ouvrier Aluminium',
  'Aluminium Worker',
  'متخصص في تركيب وصناعة الأبواب والنوافذ والواجهات من الألومنيوم.',
  'Spécialisé dans l''installation et la fabrication de portes, fenêtres et façades en aluminium.',
  'Specialized in installation and manufacturing of aluminum doors, windows and facades.',
  'fas fa-door-open',
  NULL, -- Image URL to be added later
  250,
  1,
  true,
  (SELECT COALESCE(MAX("order"), 0) + 1 FROM hand_worker_categories)
);

-- 3️⃣ تقني كاميرات المراقبة / Technicien Caméras de Surveillance / CCTV Technician
INSERT INTO hand_worker_categories (
  name_ar,
  name_fr,
  name_en,
  description_ar,
  description_fr,
  description_en,
  icon,
  image,
  price_per_day,
  minimum_jours,
  is_active,
  "order"
) VALUES (
  'تقني كاميرات المراقبة',
  'Technicien Caméras de Surveillance',
  'CCTV Technician',
  'تركيب وصيانة كاميرات المراقبة وأنظمة التسجيل.',
  'Installation et maintenance de caméras de surveillance et systèmes d''enregistrement.',
  'Installation and maintenance of surveillance cameras and recording systems.',
  'fas fa-video',
  NULL, -- Image URL to be added later
  300,
  1,
  true,
  (SELECT COALESCE(MAX("order"), 0) + 1 FROM hand_worker_categories)
);

-- 4️⃣ تصليح العجلات / Réparation des pneus / Tire Repair
INSERT INTO hand_worker_categories (
  name_ar,
  name_fr,
  name_en,
  description_ar,
  description_fr,
  description_en,
  icon,
  image,
  price_per_day,
  minimum_jours,
  is_active,
  "order"
) VALUES (
  'تصليح العجلات',
  'Réparation des pneus',
  'Tire Repair',
  'خدمة إصلاح وصيانة العجلات والإطارات.',
  'Service de réparation et maintenance des pneus et roues.',
  'Tire and wheel repair and maintenance service.',
  'fas fa-tire-pressure-warning',
  NULL, -- Image URL to be added later
  120,
  1,
  true,
  (SELECT COALESCE(MAX("order"), 0) + 1 FROM hand_worker_categories)
);

-- 5️⃣ تصليح التلفاز / Réparation TV / TV Repair Technician
INSERT INTO hand_worker_categories (
  name_ar,
  name_fr,
  name_en,
  description_ar,
  description_fr,
  description_en,
  icon,
  image,
  price_per_day,
  minimum_jours,
  is_active,
  "order"
) VALUES (
  'تصليح التلفاز',
  'Réparation TV',
  'TV Repair Technician',
  'إصلاح وصيانة أجهزة التلفزيون والشاشات.',
  'Réparation et maintenance des téléviseurs et écrans.',
  'Repair and maintenance of televisions and screens.',
  'fas fa-tv',
  NULL, -- Image URL to be added later
  200,
  1,
  true,
  (SELECT COALESCE(MAX("order"), 0) + 1 FROM hand_worker_categories)
);

-- 6️⃣ تركيب الستائر والأثاث / Installation rideaux & meubles / Curtains & Furniture Installer
INSERT INTO hand_worker_categories (
  name_ar,
  name_fr,
  name_en,
  description_ar,
  description_fr,
  description_en,
  icon,
  image,
  price_per_day,
  minimum_jours,
  is_active,
  "order"
) VALUES (
  'تركيب الستائر والأثاث',
  'Installation rideaux & meubles',
  'Curtains & Furniture Installer',
  'خدمة تركيب الستائر والأثاث المنزلي.',
  'Service d''installation de rideaux et meubles.',
  'Curtains and furniture installation service.',
  'fas fa-couch',
  NULL, -- Image URL to be added later
  150,
  1,
  true,
  (SELECT COALESCE(MAX("order"), 0) + 1 FROM hand_worker_categories)
);

-- 7️⃣ تنظيف الأثاث / Nettoyage des meubles / Furniture Cleaning
INSERT INTO hand_worker_categories (
  name_ar,
  name_fr,
  name_en,
  description_ar,
  description_fr,
  description_en,
  icon,
  image,
  price_per_day,
  minimum_jours,
  is_active,
  "order"
) VALUES (
  'تنظيف الأثاث',
  'Nettoyage des meubles',
  'Furniture Cleaning',
  'خدمة تنظيف وصيانة الأثاث المنزلي.',
  'Service de nettoyage et entretien des meubles.',
  'Furniture cleaning and maintenance service.',
  'fas fa-soap',
  NULL, -- Image URL to be added later
  200,
  1,
  true,
  (SELECT COALESCE(MAX("order"), 0) + 1 FROM hand_worker_categories)
);

-- Verify the insertions
SELECT 
  id,
  name_ar,
  name_fr,
  name_en,
  price_per_day,
  minimum_jours,
  icon,
  is_active,
  "order"
FROM hand_worker_categories
WHERE name_ar IN (
  'مصلّح الأجهزة المنزلية',
  'عامل الألومنيوم',
  'تقني كاميرات المراقبة',
  'تصليح العجلات',
  'تصليح التلفاز',
  'تركيب الستائر والأثاث',
  'تنظيف الأثاث'
)
ORDER BY "order";

