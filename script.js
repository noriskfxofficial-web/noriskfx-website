
const aura = document.querySelector('.cursor-aura');
window.addEventListener('pointermove', (event) => {
  if (!aura || window.matchMedia('(max-width: 980px)').matches) return;
  aura.style.left = `${event.clientX}px`;
  aura.style.top = `${event.clientY}px`;
});

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobileMenu');
const menuBackdrop = document.querySelector('[data-menu-backdrop]');
const menuClose = document.querySelector('[data-menu-close]');

const closeMobileMenu = () => {
  if (!mobileMenu) return;
  mobileMenu.hidden = true;
  if (menuBackdrop) menuBackdrop.hidden = true;
  document.body.classList.remove('no-scroll');
  menuToggle?.setAttribute('aria-expanded', 'false');
};

const openMobileMenu = () => {
  if (!mobileMenu) return;
  mobileMenu.hidden = false;
  if (menuBackdrop) menuBackdrop.hidden = false;
  document.body.classList.add('no-scroll');
  menuToggle?.setAttribute('aria-expanded', 'true');
};

if (mobileMenu) closeMobileMenu();

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  isOpen ? closeMobileMenu() : openMobileMenu();
});
menuClose?.addEventListener('click', closeMobileMenu);
menuBackdrop?.addEventListener('click', closeMobileMenu);
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMobileMenu));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMobileMenu();
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 980) closeMobileMenu();
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('show'));
}

document.querySelectorAll('[data-faq]').forEach((item) => {
  const button = item.querySelector('button');
  button?.addEventListener('click', () => item.classList.toggle('open'));
});

const setLang = (lang) => {
  const isEn = lang === 'en';
  document.documentElement.lang = isEn ? 'en' : 'ar';
  document.documentElement.dir = isEn ? 'ltr' : 'rtl';
  document.body.dataset.lang = lang;

  document.querySelectorAll('[data-ar][data-en]').forEach((el) => {
    const value = el.getAttribute(isEn ? 'data-en' : 'data-ar') || '';
    el.innerHTML = value;
  });

  document.querySelectorAll('[data-lang-label]').forEach((el) => {
    el.textContent = isEn ? 'AR' : 'EN';
  });

  const title = document.querySelector('title');
  if (title) title.textContent = title.getAttribute(isEn ? 'data-title-en' : 'data-title-ar') || title.textContent;

  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', desc.getAttribute(isEn ? 'data-desc-en' : 'data-desc-ar') || desc.getAttribute('content'));

  try { localStorage.setItem('noriskfx_lang', lang); } catch (e) {}
};

let initialLang = 'ar';
try { initialLang = localStorage.getItem('noriskfx_lang') || 'ar'; } catch (e) {}
setLang(initialLang);

document.querySelectorAll('[data-lang-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    let current = document.documentElement.lang || 'ar';
    setLang(current === 'ar' ? 'en' : 'ar');
    closeMobileMenu();
  });
});



document.querySelectorAll('[data-contact-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();
    const text = [
      'Hello No Risk FX, I would like to contact you.',
      name ? `Name: ${name}` : '',
      email ? `Email: ${email}` : '',
      message ? `Message: ${message}` : ''
    ].filter(Boolean).join('\n');
    const whatsappUrl = `https://wa.me/96176524340?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener');
  });
});

const animateCounter = (el) => {
  const raw = el.getAttribute('data-count') || '';
  const match = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return;
  const target = parseFloat(match[1]);
  const suffix = match[2] || '';
  let start = null;
  const duration = 900;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const value = Math.round(target * progress);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = raw;
  };
  requestAnimationFrame(step);
};

const counters = document.querySelectorAll('[data-count]');
if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach((item) => counterObserver.observe(item));
}


// v13 WhatsApp contact form handler: prevents 404/error submit and opens WhatsApp with message.
document.querySelectorAll('form').forEach((form) => {
  const hasMessageField = form.querySelector('textarea') || form.querySelector('[name="message"]') || form.querySelector('[name="msg"]');
  if (!hasMessageField) return;

  form.setAttribute('data-whatsapp-form', 'true');
  form.setAttribute('action', '#');
  form.setAttribute('method', 'get');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const getVal = (selectors) => {
      for (const selector of selectors) {
        const field = form.querySelector(selector);
        if (field && typeof field.value === 'string' && field.value.trim()) return field.value.trim();
      }
      return '';
    };

    const name = getVal(['[name="name"]','[name="full_name"]','[name="fullname"]','input[name*="name" i]','input[type="text"]']);
    const email = getVal(['[name="email"]','input[type="email"]']);
    const phone = getVal(['[name="phone"]','[name="tel"]','input[type="tel"]','input[name*="phone" i]']);
    const service = getVal(['[name="service"]','select']);
    const message = getVal(['[name="message"]','[name="msg"]','textarea']);
    const pageTitle = (document.title || 'No Risk FX website').replace(/\s+/g, ' ').trim();

    const lines = [
      'Hello No Risk FX,',
      'I want to contact you from the website.',
      name ? `Name: ${name}` : null,
      email ? `Email: ${email}` : null,
      phone ? `Phone: ${phone}` : null,
      service ? `Service: ${service}` : null,
      message ? `Message: ${message}` : null,
      `Page: ${pageTitle}`
    ].filter(Boolean);

    const whatsappUrl = `https://wa.me/96176524340?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(whatsappUrl, '_blank', 'noopener');
  });
});
