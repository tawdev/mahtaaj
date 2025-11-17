-- ============================================
-- إضافة قيد فريد لمنع التقييمات المكررة للموقع
-- ============================================
-- هذا الملف يضيف قيد فريد يضمن أن كل مستخدم يمكنه تقييم الموقع مرة واحدة فقط
-- (التقييمات التي يكون فيها product_id = NULL هي تقييمات الموقع)
-- ============================================

-- الخطوة 1: حذف التقييمات المكررة (الاحتفاظ بأحدث تقييم فقط لكل مستخدم)
-- هذا يحل مشكلة البيانات المكررة الموجودة مسبقاً
DELETE FROM ratings
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id 
             ORDER BY created_at DESC
           ) as rn
    FROM ratings
    WHERE product_id IS NULL 
      AND user_id IS NOT NULL
  ) t
  WHERE rn > 1
);

-- الخطوة 2: إنشاء فهرس فريد جزئي يمنع المستخدم من إضافة أكثر من تقييم واحد للموقع
-- هذا يضمن أن كل مستخدم يمكنه تقييم الموقع مرة واحدة فقط
CREATE UNIQUE INDEX IF NOT EXISTS unique_site_rating_per_user 
ON ratings (user_id) 
WHERE product_id IS NULL AND user_id IS NOT NULL;

-- ملاحظة: هذا الفهرس الفريد الجزئي يضمن:
-- 1. كل مستخدم مسجل (user_id IS NOT NULL) يمكنه تقييم الموقع مرة واحدة فقط
-- 2. المستخدمون غير المسجلين (user_id IS NULL) يمكنهم التقييم عدة مرات (يتم التحكم بهم عبر IP)
-- 3. التقييمات للمنتجات (product_id IS NOT NULL) لا تتأثر بهذا القيد

-- إذا كنت تريد أيضاً منع التقييمات المكررة للمستخدمين غير المسجلين بناءً على IP:
-- يمكنك إضافة فهرس فريد آخر (لكن هذا قد يمنع عدة مستخدمين من نفس الشبكة)
-- CREATE UNIQUE INDEX IF NOT EXISTS unique_site_rating_per_ip 
-- ON ratings (user_ip) 
-- WHERE product_id IS NULL AND user_id IS NULL AND user_ip != 'unknown';

