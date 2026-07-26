const field = (value, max = 500) => String(value || '').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const name = field(req.body?.name, 120);
  const organization = field(req.body?.organization, 160);
  const phone = field(req.body?.phone, 40);
  const challenge = field(req.body?.challenge, 1200);

  if (name.length < 2 || organization.length < 2 || phone.length < 7 || challenge.length < 10) {
    return res.status(400).json({ message: 'فضلاً أكمل البيانات المطلوبة بشكل صحيح.' });
  }

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    return res.status(503).json({ message: 'نموذج التواصل بانتظار ربط وجهة استقبال الطلبات.' });
  }

  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, organization, phone, challenge, source: 'marktone-website', submittedAt: new Date().toISOString() })
    });
    if (!response.ok) throw new Error(`Webhook error: ${response.status}`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: 'تعذر إرسال الطلب الآن، حاول مرة أخرى.' });
  }
}
