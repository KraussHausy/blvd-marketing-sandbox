// Mobile nav toggle
const toggle = document.querySelector('.nav__toggle');
const links = document.querySelector('.nav__links');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    links.classList.toggle('active');
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => links.classList.remove('active'));
  });
}

// Scroll fade-in
const observerOptions = { threshold: 0.15 };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.card, .product, .about__text, .about__image, .newsletter__inner, .booking__widget, .value-card, .team-card, .contact__form-wrapper, .contact__info').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// Newsletter form handler (placeholder — replace with Klaviyo/Mailchimp/HubSpot)
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = signupForm.querySelector('input[name="email"]').value;
    alert('Thanks for subscribing, ' + email + '! (Connect your email platform to activate — see README.)');
    signupForm.reset();
  });
}

// Contact form handler (placeholder — replace with HubSpot/backend)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Message sent! (Connect a form handler to activate — see README.)');
    contactForm.reset();
  });
}
