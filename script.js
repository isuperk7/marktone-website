(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const open = !mobileNav.classList.contains('open');
      mobileNav.classList.toggle('open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      mobileNav.setAttribute('aria-hidden', String(!open));
    });
    mobileNav.querySelectorAll('a,button').forEach((item) => item.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
    }));
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  const visual = document.querySelector('.hero-visual img');
  const hero = document.querySelector('.hero');
  if (visual && hero && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      visual.style.setProperty('--tx', `${x * -8}px`);
      visual.style.setProperty('--ty', `${y * -5}px`);
    });
    hero.addEventListener('pointerleave', () => {
      visual.style.setProperty('--tx', '0px');
      visual.style.setProperty('--ty', '0px');
    });
  }

  const dialog = document.querySelector('.contact-dialog');
  document.querySelectorAll('[data-open-form]').forEach((button) => button.addEventListener('click', () => {
    if (dialog && !dialog.open) dialog.showModal();
  }));
  dialog?.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (event) => {
    const box = dialog.getBoundingClientRect();
    const outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
    if (outside) dialog.close();
  });

  const form = document.querySelector('#contact-form');
  const status = document.querySelector('.form-status');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.className = 'form-status';
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'جاري الإرسال…';
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'تعذر إرسال الطلب الآن.');
      status.className = 'form-status success';
      status.textContent = 'تم استلام طلبك بنجاح. سيتواصل معك الفريق قريبًا.';
      form.reset();
    } catch (error) {
      status.className = 'form-status error';
      status.textContent = error.message || 'حدث خطأ، حاول مرة أخرى.';
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'إرسال الطلب <span>←</span>';
    }
  });
})();
