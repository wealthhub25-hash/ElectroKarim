export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.status(204).end();
  }
  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const scriptUrl = process.env.APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return res.status(500).json({ ok: false, error: "لم يتم إعداد APPS_SCRIPT_URL في إعدادات Vercel" });
  }
  try {
    let target;
    if (req.method === "GET") {
      const sheet = String(req.query.sheet || "");
      if (!["اصلاحات", "مشتريات"].includes(sheet)) {
        return res.status(400).json({ ok: false, error: "اسم اللائحة غير صالح" });
      }
      target = `${scriptUrl}?sheet=${encodeURIComponent(sheet)}`;
    } else {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body || !["اصلاحات", "مشتريات"].includes(body.sheet)) {
        return res.status(400).json({ ok: false, error: "بيانات الطلب غير صالحة" });
      }
      if (!["add", "update", "delete"].includes(body.action)) {
        return res.status(400).json({ ok: false, error: "العملية غير صالحة" });
      }
      target = scriptUrl;
    }
    const upstream = await fetch(target, {
      method: req.method,
      headers: req.method === "POST" ? { "Content-Type": "text/plain;charset=utf-8" } : undefined,
      body: req.method === "POST" ? JSON.stringify(typeof req.body === "string" ? JSON.parse(req.body) : req.body) : undefined,
      redirect: "follow"
    });
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); }
    catch { throw new Error("Apps Script رجّع استجابة غير JSON. راجع نشر السكريبت وصلاحياته."); }
    if (!upstream.ok || data.ok === false) {
      return res.status(502).json({ ok: false, error: data.error || "فشل الاتصال بـ Google Sheets" });
    }
    return res.status(200).json({ ok: true, data: data.data ?? data });
  } catch (error) {
    console.error("API proxy error:", error);
    return res.status(502).json({ ok: false, error: error.message || "خطأ في الخادم الوسيط" });
  }
}