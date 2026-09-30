/* =============================================================
   21 Beans — JavaScript
   Vanilla, fără dependențe. Totul este progressive enhancement:
   dacă scriptul nu rulează, site-ul rămâne complet funcțional.
   ============================================================= */

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------------------------------------------------
     1. Header — stare „lipit” după primul scroll
     --------------------------------------------------------- */

  var header = document.querySelector('[data-header]');

  if (header) {
    var lastStuck = null;

    var updateHeader = function () {
      var stuck = window.scrollY > 24;
      if (stuck !== lastStuck) {
        header.classList.toggle('is-stuck', stuck);
        lastStuck = stuck;
      }
    };

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* ---------------------------------------------------------
     2. Meniu mobil (drawer)
     Focus trap, Esc, blocarea scroll-ului, aria-expanded.
     --------------------------------------------------------- */

  var toggle = document.querySelector('[data-menu-toggle]');
  var drawer = document.querySelector('[data-drawer]');

  if (toggle && drawer) {
    var FOCUSABLE =
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    var lastFocused = null;

    var setDrawer = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);

      if (open) {
        lastFocused = document.activeElement;
        var first = drawer.querySelector(FOCUSABLE);
        if (first) {
          // Lăsăm tranziția să pornească înainte de a muta focusul.
          window.setTimeout(function () {
            first.focus();
          }, 60);
        }
      } else if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    };

    // Starea inițială, explicită.
    setDrawer(false);

    toggle.addEventListener('click', function () {
      setDrawer(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Orice link din drawer îl închide.
    drawer.addEventListener('click', function (event) {
      if (event.target.closest('a')) setDrawer(false);
    });

    document.addEventListener('keydown', function (event) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setDrawer(false);
        return;
      }

      if (event.key !== 'Tab') return;

      var items = Array.prototype.filter.call(
        drawer.querySelectorAll(FOCUSABLE),
        function (el) {
          return el.offsetParent !== null;
        }
      );
      if (!items.length) return;

      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Dacă ecranul devine desktop cât timp drawer-ul e deschis, îl închidem.
    var desktop = window.matchMedia('(min-width: 62rem)');
    var onBreakpoint = function (event) {
      if (event.matches) setDrawer(false);
    };

    if (typeof desktop.addEventListener === 'function') {
      desktop.addEventListener('change', onBreakpoint);
    } else if (typeof desktop.addListener === 'function') {
      desktop.addListener(onBreakpoint);
    }
  }

  /* ---------------------------------------------------------
     3. Reveal on scroll
     Un singur IntersectionObserver, dezactivat la reduced motion.
     --------------------------------------------------------- */

  var revealables = document.querySelectorAll('.reveal');

  if (revealables.length) {
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(revealables, function (el) {
        el.classList.add('is-visible');
      });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );

      Array.prototype.forEach.call(revealables, function (el) {
        revealObserver.observe(el);
      });
    }
  }

  /* ---------------------------------------------------------
     4. Fade-in pentru imaginile lazy
     --------------------------------------------------------- */

  Array.prototype.forEach.call(
    document.querySelectorAll('img.img-fade'),
    function (img) {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('is-loaded');
      } else {
        img.addEventListener(
          'load',
          function () {
            img.classList.add('is-loaded');
          },
          { once: true }
        );
        img.addEventListener(
          'error',
          function () {
            img.classList.add('is-loaded');
          },
          { once: true }
        );
      }
    }
  );

  /* ---------------------------------------------------------
     5. Pagina de meniu — tab-uri de categorie + scrollspy
     Link-urile sunt ancore reale; JS adaugă doar evidențierea.
     --------------------------------------------------------- */

  var menuNav = document.querySelector('[data-menu-nav]');

  if (menuNav) {
    var links = Array.prototype.slice.call(
      menuNav.querySelectorAll('.menu-nav__link')
    );

    var byId = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      byId[id] = link;
      sections.push(section);
    });

    var setActive = function (id) {
      links.forEach(function (link) {
        link.classList.toggle(
          'is-active',
          link.getAttribute('href') === '#' + id
        );
      });

      // Ținem tab-ul activ vizibil pe mobil.
      var active = byId[id];
      var list = menuNav.querySelector('.menu-nav__list');
      if (!active || !list || list.scrollWidth <= list.clientWidth) return;

      var target =
        active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
      list.scrollTo({
        left: Math.max(0, target),
        behavior: reduceMotion.matches ? 'auto' : 'smooth'
      });
    };

    if (sections.length) {
      // Linia de referință: imediat sub header + bara de categorii.
      var LINE = 156;
      var ticking = false;
      var lastId = null;

      var syncActive = function () {
        ticking = false;

        var current = sections[0];
        for (var i = 0; i < sections.length; i++) {
          if (sections[i].getBoundingClientRect().top <= LINE) current = sections[i];
        }

        // Ultima secțiune nu e niciodată destul de înaltă cât să treacă linia
        // când pagina e derulată la capăt — o marcăm explicit.
        var atBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 6;
        if (atBottom) current = sections[sections.length - 1];

        if (current.id !== lastId) {
          lastId = current.id;
          setActive(current.id);
        }
      };

      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(syncActive);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      syncActive();
    }

    // Click: marcăm imediat, fără să așteptăm încheierea scroll-ului.
    menuNav.addEventListener('click', function (event) {
      var link = event.target.closest('.menu-nav__link');
      if (link) setActive(link.getAttribute('href').slice(1));
    });
  }

  /* ---------------------------------------------------------
     6. Anul curent în footer
     --------------------------------------------------------- */

  Array.prototype.forEach.call(
    document.querySelectorAll('[data-year]'),
    function (el) {
      el.textContent = String(new Date().getFullYear());
    }
  );
})();
