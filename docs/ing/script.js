const header = document.querySelector('#siteHeader');
const giftBar = document.querySelector('#giftBar');
const dismissGift = document.querySelector('#dismissGift');
const navToggle = document.querySelector('#navToggle');
const navMenu = document.querySelector('#navMenu');
const typedWord = document.querySelector('#typedWord');

function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 18);
}

function closeMenu() {
  navMenu.classList.remove('is-open');
  header.classList.remove('menu-open');
  document.body.classList.remove('nav-open');
  navToggle.setAttribute('aria-expanded', 'false');
}

navToggle.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('is-open');
  header.classList.toggle('menu-open', isOpen);
  document.body.classList.toggle('nav-open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

dismissGift.addEventListener('click', () => {
  giftBar.classList.add('is-hidden');
  closeMenu();
});

window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element);
});

const words = ['daymakers.', 'story tellers.', 'food sharers.', 'car dancers.', 'group huggers.'];
let wordIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  const current = words[wordIndex];
  typedWord.textContent = current.slice(0, charIndex);

  if (!deleting && charIndex < current.length) {
    charIndex += 1;
    window.setTimeout(typeLoop, 70);
    return;
  }

  if (!deleting && charIndex === current.length) {
    deleting = true;
    window.setTimeout(typeLoop, 1500);
    return;
  }

  if (deleting && charIndex > 0) {
    charIndex -= 1;
    window.setTimeout(typeLoop, 38);
    return;
  }

  deleting = false;
  wordIndex = (wordIndex + 1) % words.length;
  window.setTimeout(typeLoop, 240);
}

if (typedWord) {
  typeLoop();
}
