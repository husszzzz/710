# Zone66 Control Panel

لوحة تحكم مخصصة للعمل من iPhone لإدارة `husszzzz/Zone66-Player` عبر GitHub API.

## مهم
هذه النسخة لا تحفظ GitHub Token في LocalStorage أو Cookie. يبقى في ذاكرة صفحة المتصفح ويرسل عبر HTTPS إلى Worker عند الطلب.

## صلاحيات GitHub Token
أنشئ Fine-grained personal access token لحسابك وحدد المستودع:
- `husszzzz/Zone66-Player`
- Contents: Read and write
- Actions: Read and write (إذا تريد تشغيل Workflows من اللوحة)

لا تعطي التوكن لأي شخص.

## الملفات
- `index.html` واجهة اللوحة
- `worker.js` وسيط GitHub API
- `wrangler.toml` إعداد Cloudflare Worker

## النشر
يمكن نشر Worker من Cloudflare Dashboard أو Wrangler. يجب أن تكون `index.html` متاحة كـStatic Asset للـWorker. بعد النشر افتح رابط الـWorker من iPhone.

ملاحظة: زر "ملف جديد" في الواجهة الحالية يجهز المسار فقط؛ الكتابة المباشرة مفعلة للملفات الموجودة. يمكن إضافة إنشاء/حذف الملفات في نسخة لاحقة.
