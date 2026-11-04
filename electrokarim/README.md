# إلكترو كريم — نسخة Vercel

## محتويات المشروع
- `index.html`: الواجهة العربية المتجاوبة.
- `api/index.js`: وسيط API على Vercel؛ يخفي رابط Apps Script عن كود المتصفح ويعالج أخطاء الاتصال.
- `apps-script/Code.gs`: backend كامل لـ Google Sheets.
- `vercel.json`: إعدادات مسار API.

## 1) إعداد Google Sheets
1. أنشئ Google Spreadsheet جديداً.
2. انسخ المعرّف من الرابط: الجزء الواقع بين `/d/` و`/edit`.
3. افتح Extensions > Apps Script.
4. استبدل محتوى `Code.gs` بالكود الموجود في `apps-script/Code.gs`.
5. ضع معرّف الملف مكان `ضع_هنا_ID_ملف_GOOGLE_SHEETS`.
6. شغّل الدالة `doGet` لاختبار الصلاحيات عند الطلب، ووافق على أذونات Google.

سيتم إنشاء ورقتي `اصلاحات` و`مشتريات` وعناوين الأعمدة تلقائياً عند أول اتصال. إذا كانت الورقتان موجودتين، يجب أن تطابق عناوين الصف الأول الكود تماماً.

## 2) نشر Apps Script
1. من Apps Script اختر Deploy > New deployment.
2. النوع: Web app.
3. Execute as: Me.
4. Who has access: Anyone (مطلوب لكي يستدعيه وسيط Vercel). هذا يعني أن رابط Apps Script نفسه قابل للاستدعاء لمن يملكه؛ لا تنشره في مكان عام.
5. اضغط Deploy وانسخ رابط `/exec` وليس `/dev`.

## 3) نشر Vercel
1. ارفع مجلد المشروع إلى GitHub.
2. استورد المستودع في Vercel، واترك Framework Preset على Other.
3. في Project Settings > Environment Variables أضف:
   - Name: `APPS_SCRIPT_URL`
   - Value: رابط Apps Script المنتهي بـ `/exec`
   - Environment: Production (وأيضاً Preview إذا احتجت).
4. أعد Deploy بعد إضافة المتغير.
5. افتح رابط Vercel واختبر الإضافة والتعديل والحذف في القسمين.

## 4) ملاحظات مهمة
- لا تضع رابط Apps Script داخل `index.html`.
- الواجهة لا تحتاج مكتبات PDF خارجية؛ زر الطباعة يفتح نافذة الطباعة ويمكن اختيار Save as PDF.
- هذه لوحة داخلية لكنها لا تحتوي حالياً على تسجيل دخول. فعّل Vercel Deployment Protection أو أضف نظام دخول حقيقياً قبل استعمالها ببيانات الزبائن. إخفاء رابط API وحده لا يعتبر حماية.
- إذا كانت لديك بيانات قديمة، خذ نسخة احتياطية من Google Sheets قبل استبدال كود Apps Script.
