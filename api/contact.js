const field = (value, max = 500) => String(value || '').trim().slice(0, max);

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const name = field(req.body?.name, 120);
  const organization = field(req.body?.organization, 160);
  const phone = field(req.body?.phone, 40);
  const challenge = field(req.body?.challenge, 1200);

  if (name.length < 2 || organization.length < 2 || phone.length < 7 || challenge.length < 10) {
    return res.status(400).json({ message: 'فضلاً أكمل البيانات المطلوبة بشكل صحيح.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || 'info@marktone.sa';
  const from = process.env.CONTACT_FROM_EMAIL || 'Marktone Website <website@marktone.sa>';

  if (!apiKey) {
    return res.status(503).json({ message: 'نموذج التواصل بانتظار تفعيل خدمة البريد.' });
  }

  const submittedAt = new Date().toISOString();
  const subject = `طلب جلسة تشخيص — ${organization}`;
  const html = `
    <div dir="rtl" style="font-family:Arial,Tahoma,sans-serif;line-height:1.8;color:#17202a">
      <h2>طلب جلسة تشخيص جديد</h2>
      <p><strong>الاسم:</strong> ${escapeHtml(name)}</p>
      <p><strong>الجهة:</strong> ${escapeHtml(organization)}</p>
      <p><strong>رقم الجوال:</strong> ${escapeHtml(phone)}</p>
      <p><strong>أكبر تحدٍ حالي:</strong></p>
      <p>${escapeHtml(challenge).replaceAll('\n', '<br>')}</p>
      <hr>
      <p style="color:#667085;font-size:12px">المصدر: marktone-website<br>وقت الإرسال: ${submittedAt}</p>
    </div>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: to,
        subject,
        html
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Email delivery failed', response.status, result);
      throw new Error('Email delivery failed');
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: 'تعذر إرسال الطلب الآن، حاول مرة أخرى.' });
  }
}
