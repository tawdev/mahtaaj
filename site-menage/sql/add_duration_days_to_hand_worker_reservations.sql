-- إضافة عمود duration_days إلى جدول hand_worker_reservations
-- إذا لم يكن موجوداً

-- إضافة العمود إذا لم يكن موجوداً
ALTER TABLE hand_worker_reservations 
ADD COLUMN IF NOT EXISTS duration_days DECIMAL(10,2);

-- نسخ البيانات من duration_hours إلى duration_days (تحويل الساعات إلى أيام)
-- 8 ساعات = 1 يوم
UPDATE hand_worker_reservations 
SET duration_days = CASE 
  WHEN duration_hours IS NOT NULL THEN 
    CASE 
      WHEN duration_hours >= 8 THEN CEIL(duration_hours / 8.0)
      ELSE 1
    END
  ELSE NULL
END
WHERE duration_days IS NULL AND duration_hours IS NOT NULL;

-- تعيين القيمة الافتراضية للأيام إذا كانت القيمة NULL
UPDATE hand_worker_reservations 
SET duration_days = 1 
WHERE duration_days IS NULL;

-- إضافة تعليق على العمود
COMMENT ON COLUMN hand_worker_reservations.duration_days IS 'Duration in days (replaces duration_hours)';

-- إزالة أي constraints أو checks تمنع القيم الأقل من 30 يوم
-- التحقق من وجود constraint يمنع القيم < 30
DO $$
BEGIN
    -- إزالة constraint إذا كان موجوداً
    ALTER TABLE hand_worker_reservations 
    DROP CONSTRAINT IF EXISTS check_duration_days_minimum;
    
    -- إزالة constraint آخر محتمل
    ALTER TABLE hand_worker_reservations 
    DROP CONSTRAINT IF EXISTS hand_worker_reservations_duration_days_check;
    
    -- إزالة constraint عام
    ALTER TABLE hand_worker_reservations 
    DROP CONSTRAINT IF EXISTS duration_days_check;
END $$;

-- السماح بأي قيمة موجبة (1 فما فوق) بدون قيود
-- التأكد من أن العمود يقبل NULL أو أي قيمة >= 1
-- ملاحظة: DROP NOT NULL لن يسبب خطأ إذا لم يكن هناك NOT NULL constraint
DO $$
BEGIN
    -- محاولة إزالة NOT NULL constraint
    BEGIN
        ALTER TABLE hand_worker_reservations 
        ALTER COLUMN duration_days DROP NOT NULL;
    EXCEPTION
        WHEN OTHERS THEN
            -- تجاهل الخطأ إذا لم يكن هناك NOT NULL constraint
            NULL;
    END;
END $$;

-- ملاحظة: يمكنك اختيارياً إزالة عمود duration_hours لاحقاً بعد التأكد من أن جميع البيانات تم نقلها
-- ALTER TABLE hand_worker_reservations DROP COLUMN IF EXISTS duration_hours;

