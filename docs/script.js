(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var config = window.PARTY_CONFIG || {};
  var EVENT_START = new Date(config.eventStart || '2026-12-02T15:00:00+13:00');
  var EVENT_END = new Date(config.eventEnd || '2026-12-02T22:00:00+13:00');
  var RSVP_DEADLINE = new Date(config.rsvpDeadline || '2026-11-06T23:59:59+13:00');
  var DAY = 24 * 60 * 60 * 1000;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Pre-filled emails: RSVPs & award nominations ───────── */
  var EMAIL = config.organiserEmail || 'aleisha.langdale@runway.co.nz';

  function mailto(email) {
    return 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent(email.subject) +
      '&body=' + encodeURIComponent(email.lines.join('\r\n'));
  }

  var RSVP_YES = {
    subject: 'RSVP: Yes! Runway Christmas Party, Wed 2 Dec',
    lines: [
      'Kia ora Aleisha,',
      '',
      'Count me in for the Runway Christmas party on Wednesday 2 December!',
      '',
      'Name: ',
      'Dietary requirements (if any): ',
      '',
      'See you there!',
    ],
  };
  var RSVP_NO = {
    subject: "RSVP: Can't make it. Runway Christmas Party, Wed 2 Dec",
    lines: [
      'Kia ora Aleisha,',
      '',
      "Sadly I can't make the Runway Christmas party on Wednesday 2 December.",
      '',
      'Name: ',
    ],
  };

  function nomination(award) {
    return award
      ? { subject: '2026 Runway Awards nomination: ' + award,
          lines: ['Kia ora Aleisha,', '', 'Award: ' + award, 'I nominate: ', 'Because: '] }
      : { subject: '2026 Runway Awards nomination: Mystery Award',
          lines: ['Kia ora Aleisha,', '', 'My made-up award: ', 'I nominate: ', 'Because: '] };
  }

  function copyText(text, button, label) {
    function done(ok) {
      button.textContent = ok ? 'Copied!' : 'Copy failed';
      setTimeout(function () { button.textContent = label; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else {
      done(false);
    }
  }

  // Every email button opens a pre-filled email in the person's email app.
  function wireEmailLink(link, email, label) {
    link.href = mailto(email);
    link.setAttribute('aria-label', label + ' (opens an email to Aleisha)');
  }

  document.querySelectorAll('[data-rsvp-link]').forEach(function (link) {
    wireEmailLink(link, RSVP_YES, link.textContent.trim() || 'RSVP');
  });
  document.querySelectorAll('[data-rsvp-decline]').forEach(function (link) {
    wireEmailLink(link, RSVP_NO, "Can't make it");
  });
  document.querySelectorAll('[data-award]').forEach(function (link) {
    var award = link.getAttribute('data-award');
    wireEmailLink(link, nomination(award), award ? 'Nominate someone for ' + award : 'Invent your own award');
  });

  document.querySelectorAll('[data-copy-email]').forEach(function (button) {
    button.addEventListener('click', function () { copyText(EMAIL, button, 'Copy address'); });
  });

  /* ── Countdown & deadline ───────────────────────────────── */
  var cd = {
    wrap: document.querySelector('.countdown'),
    done: document.querySelector('.countdown-done'),
    days: document.querySelector('[data-cd="days"]'),
    hours: document.querySelector('[data-cd="hours"]'),
    minutes: document.querySelector('[data-cd="minutes"]'),
    seconds: document.querySelector('[data-cd="seconds"]'),
  };

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function tickCountdown(now) {
    var diff = EVENT_START - now;
    if (diff <= 0) {
      cd.wrap.hidden = true;
      cd.done.hidden = false;
      cd.done.textContent = now < EVENT_END ? "It's party time! 🎉" : 'What a day — thanks for coming! 🌺';
      return false;
    }
    var s = Math.floor(diff / 1000);
    cd.days.textContent = Math.floor(s / 86400);
    cd.hours.textContent = pad(Math.floor((s % 86400) / 3600));
    cd.minutes.textContent = pad(Math.floor((s % 3600) / 60));
    cd.seconds.textContent = pad(s % 60);
    return true;
  }

  // Whole days between two moments, counted on the Auckland calendar,
  // so Tuesday → Friday is "3 days" whatever the time of day.
  var nzDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland', year: 'numeric', month: '2-digit', day: '2-digit' });
  function calendarDaysBetween(from, to) {
    function utcMidnight(d) {
      var parts = nzDate.format(d).split('-');
      return Date.UTC(+parts[0], parts[1] - 1, +parts[2]);
    }
    return Math.round((utcMidnight(to) - utcMidnight(from)) / DAY);
  }

  function updateDeadline(now) {
    var left = RSVP_DEADLINE - now;
    var banner = document.querySelector('.deadline-banner');
    var message = document.querySelector('[data-deadline-message]');
    var status = document.querySelector('[data-rsvp-status]');
    var label = '';

    if (left <= 0) {
      banner.classList.add('is-closed');
      message.innerHTML = '<strong>RSVPs have closed</strong> — thanks, everyone! Secret Santa matches are coming soon.';
      if (status) status.textContent = 'RSVPs closed';
    } else {
      var days = calendarDaysBetween(now, RSVP_DEADLINE);
      label = days <= 0 ? 'Last day — RSVP today!' : days === 1 ? 'Closes tomorrow!' : days + ' days left';
    }
    document.querySelectorAll('[data-deadline-left]').forEach(function (el) { el.textContent = label; });
  }

  function tick() {
    var now = new Date();
    updateDeadline(now);
    return tickCountdown(now);
  }
  if (tick()) {
    var timer = setInterval(function () { if (!tick()) clearInterval(timer); }, 1000);
  }

  /* ── Scroll-in reveal ───────────────────────────────────── */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ── Confetti ───────────────────────────────────────────── */
  function confetti(count) {
    if (reduceMotion) return;
    var layer = document.getElementById('confetti');
    var colours = ['#d62839', '#ffc23c', '#0b7fb5', '#48b8e0', '#2d8a5f', '#ff8fa3', '#ffffff'];
    for (var i = 0; i < count; i++) {
      var bit = document.createElement('i');
      bit.style.left = Math.random() * 100 + 'vw';
      bit.style.background = colours[i % colours.length];
      bit.style.animationDuration = 2.2 + Math.random() * 2 + 's';
      bit.style.animationDelay = Math.random() * 0.5 + 's';
      bit.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
      bit.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
      if (Math.random() < 0.3) { bit.style.borderRadius = '50%'; bit.style.height = '10px'; }
      layer.appendChild(bit);
    }
    setTimeout(function () { layer.innerHTML = ''; }, 5000);
  }

  /* ── Secret Santa reveal ────────────────────────────────── */
  // Must match secret-santa/draw.js
  function normaliseCode(code) {
    return String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function fromBase64(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function deriveKey(code, data) {
    var subtle = window.crypto.subtle;
    return subtle.importKey('raw', new TextEncoder().encode(normaliseCode(code)), 'PBKDF2', false, ['deriveKey'])
      .then(function (baseKey) {
        return subtle.deriveKey(
          { name: 'PBKDF2', salt: fromBase64(data.salt), iterations: data.iterations, hash: 'SHA-256' },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );
      });
  }

  // Each entry is encrypted with a key derived from its owner's code, so
  // only the right code can open one. Try them all; a wrong key fails.
  function findMatch(code, data) {
    return deriveKey(code, data).then(function (key) {
      var attempts = data.entries.map(function (entry) {
        return window.crypto.subtle
          .decrypt({ name: 'AES-GCM', iv: fromBase64(entry.iv) }, key, fromBase64(entry.data))
          .then(function (plain) { return JSON.parse(new TextDecoder().decode(plain)); }, function () { return null; });
      });
      return Promise.all(attempts).then(function (results) {
        return results.filter(Boolean)[0] || null;
      });
    });
  }

  (function setUpSecretSanta() {
    var data = window.SECRET_SANTA;
    if (!data || !Array.isArray(data.entries) || !data.entries.length) return;

    var ready = document.getElementById('santa-ready');
    document.getElementById('santa-waiting').hidden = true;
    ready.hidden = false;

    var form = document.getElementById('santa-form');
    var input = document.getElementById('santa-code');
    var button = form.querySelector('button');
    var error = document.getElementById('santa-error');
    var stage = document.getElementById('gift-stage');
    var card = document.getElementById('match-card');

    if (!window.crypto || !window.crypto.subtle) {
      form.hidden = true;
      error.textContent = 'Your browser can’t open the reveal here. Try the latest Chrome, Edge, Safari or Firefox.';
      return;
    }

    function reset() {
      stage.classList.remove('is-open', 'is-shaking');
      card.hidden = true;
      card.querySelector('[data-match-from]').textContent = '';
      card.querySelector('[data-match-to]').textContent = '';
    }

    function fail(message) {
      error.textContent = message;
      form.classList.remove('shake');
      void form.offsetWidth; // restart animation
      form.classList.add('shake');
      input.focus();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      error.textContent = '';
      reset();

      if (!normaliseCode(input.value)) {
        fail('Pop your code in first!');
        return;
      }

      button.disabled = true;
      button.textContent = 'Unwrapping…';
      stage.classList.add('is-shaking');
      var minimumShake = new Promise(function (resolve) { setTimeout(resolve, reduceMotion ? 0 : 700); });

      Promise.all([findMatch(input.value, data), minimumShake])
        .then(function (results) {
          var match = results[0];
          stage.classList.remove('is-shaking');
          if (!match) {
            fail('Hmm, that code didn’t match anyone. Check for typos and try again.');
            return;
          }
          card.querySelector('[data-match-from]').textContent = match.from;
          card.querySelector('[data-match-to]').textContent = match.to;
          stage.classList.add('is-open');
          card.hidden = false;
          input.value = '';
          confetti(90);
        })
        .catch(function () {
          stage.classList.remove('is-shaking');
          fail('Something went wrong unwrapping that. Please try again.');
        })
        .then(function () {
          button.disabled = false;
          button.textContent = 'Unwrap';
        });
    });

    document.getElementById('santa-hide').addEventListener('click', function () {
      reset();
      input.focus();
    });
  })();
})();
