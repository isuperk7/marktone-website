(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const dialog = document.querySelector('.contact-dialog');
  const form = document.querySelector('#contact-form');
  const status = document.querySelector('.form-status');
  const heroBg = document.querySelector('.hero-bg');

  fetch('./assets/hero-background.b64')
    .then((response) => {
      if (!response.ok) throw new Error('تعذر تحميل خلفية الهيرو.');
      return response.text();
    })
    .then((base64) => {
      if (heroBg) heroBg.style.backgroundImage = `url("data:image/webp;base64,${base64.trim()}")`;
    })
    .catch((error) => console.error(error));

  const closeMenu = () => {
    mobileNav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    mobileNav?.setAttribute('aria-hidden', 'true');
  };

  menuButton?.addEventListener('click', () => {
    const open = !mobileNav.classList.contains('open');
    mobileNav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    mobileNav.setAttribute('aria-hidden', String(!open));
  });

  mobileNav?.querySelectorAll('a,button').forEach((el) => el.addEventListener('click', closeMenu));
  window.addEventListener('scroll', () => header?.classList.toggle('scrolled', window.scrollY > 24), { passive: true });

  document.querySelectorAll('[data-open-form]').forEach((button) => button.addEventListener('click', () => {
    closeMenu();
    if (dialog && !dialog.open) dialog.showModal();
  }));

  dialog?.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (event) => {
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const body = [
      `الاسم: ${data.name}`,
      `الجهة: ${data.organization}`,
      `رقم الجوال: ${data.phone}`,
      '',
      'أكبر تحدٍ حالي:',
      data.challenge
    ].join('\n');

    status.textContent = 'تم تجهيز رسالة البريد. سيتم فتح تطبيق البريد الآن.';
    window.location.href = `mailto:info@marktone.sa?subject=${encodeURIComponent(`طلب جلسة تشخيص — ${data.organization}`)}&body=${encodeURIComponent(body)}`;
  });
})();
