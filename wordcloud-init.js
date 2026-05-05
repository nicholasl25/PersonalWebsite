(function () {
  const STORAGE_VID = 'nl_wordcloud_vid';
  const STORAGE_WORD = 'nl_wordcloud_word';
  const COLLECTION = 'visitor_words';

  function getVisitorId() {
    try {
      let id = localStorage.getItem(STORAGE_VID);
      if (!id) {
        id = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : 'v' + String(Date.now()) + Math.random().toString(36).slice(2, 12);
        localStorage.setItem(STORAGE_VID, id);
      }
      return id;
    } catch {
      return null;
    }
  }

  function normalizeWord(raw) {
    const s = String(raw || '').trim().toLowerCase().replace(/[^a-z]/g, '');
    return s.slice(0, 24);
  }

  function displayForm(lower) {
    if (!lower) return '';
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  function buildWeightedList(snapshot) {
    const counts = new Map();
    snapshot.forEach(function (doc) {
      const w = normalizeWord(doc.data().word);
      if (!w) return;
      counts.set(w, (counts.get(w) || 0) + 1);
    });
    const out = [];
    counts.forEach(function (n, w) {
      out.push([displayForm(w), Math.max(6, n * 10)]);
    });
    return out.sort(function (a, b) {
      return b[1] - a[1];
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('random-wordcloud-canvas');
    const wrap = document.getElementById('random-wordcloud-canvas-wrap');
    const form = document.getElementById('random-wordcloud-form');
    const input = document.getElementById('random-word-input');
    const submitBtn = document.getElementById('random-wordcloud-submit');
    const statusEl = document.getElementById('random-wordcloud-status');
    const hintEl = document.getElementById('random-wordcloud-hint');

    if (!canvas || !wrap || !form || !input || !hintEl) return;

    const cfg = typeof window.PORTFOLIO_FIREBASE_CONFIG !== 'undefined'
      ? window.PORTFOLIO_FIREBASE_CONFIG
      : null;

    function showStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg;
      statusEl.hidden = !msg;
      statusEl.classList.toggle('random-wordcloud-status--error', !!isError);
    }

    if (!cfg || !cfg.apiKey) {
      hintEl.textContent =
        'Visitor word cloud is turned off until Firebase is configured (see firebase-config.js and DESIGN.md).';
      form.hidden = true;
      if (wrap) wrap.hidden = true;
      return;
    }

    if (typeof firebase === 'undefined' || typeof WordCloud === 'undefined') {
      hintEl.textContent = 'Word cloud libraries failed to load.';
      form.hidden = true;
      if (wrap) wrap.hidden = true;
      return;
    }

    if (!WordCloud.isSupported) {
      hintEl.textContent = 'Word cloud is not supported in this browser.';
      form.hidden = true;
      if (wrap) wrap.hidden = true;
      return;
    }

    const visitorId = getVisitorId();
    if (!visitorId) {
      hintEl.textContent = 'Storage is disabled; your word cannot be saved for next time.';
    }

    let db;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
      db = firebase.firestore();
    } catch (e) {
      hintEl.textContent = 'Could not connect to Firebase.';
      form.hidden = true;
      if (wrap) wrap.hidden = true;
      return;
    }

    let resizeTimer;
    let lastList = [];
    let unsubscribe = null;

    function fitCanvas() {
      const w = Math.max(200, wrap.clientWidth);
      const h = Math.max(180, wrap.clientHeight);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }

    function drawCloud(list) {
      lastList = list;
      fitCanvas();
      const w = wrap.clientWidth;
      if (!list.length) {
        WordCloud.stop();
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        canvas.setAttribute('aria-label', 'Word cloud, no words yet');
        return;
      }
      WordCloud.stop();
      WordCloud(canvas, {
        list: list,
        fontFamily: 'Inter, system-ui, sans-serif',
        backgroundColor: 'transparent',
        gridSize: Math.round(10 * (Math.max(w, 200) / 480)),
        weightFactor: function (size) {
          return Math.pow(size, 0.65) * (Math.max(w, 200) / 512);
        },
        minSize: 8,
        rotateRatio: 0.25,
        rotationSteps: 2,
        color: function (_word, weight) {
          const palette = ['#1a1a1a', '#2c5282', '#555550', '#1e3a5f'];
          return palette[Math.abs(weight * 7) % palette.length];
        },
        ellipticity: 0.65,
      });
      canvas.setAttribute(
        'aria-label',
        'Word cloud of visitor-submitted words, ' + list.length + ' unique words'
      );
    }

    function scheduleDraw(list) {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        drawCloud(list);
      }, 80);
    }

    unsubscribe = db.collection(COLLECTION).onSnapshot(
      function (snapshot) {
        const list = buildWeightedList(snapshot);
        scheduleDraw(list);
        if (list.length === 0) {
          hintEl.textContent =
            'Be the first: add one word (letters only). Each browser may contribute once.';
        } else {
          hintEl.textContent =
            list.length + ' unique word' + (list.length === 1 ? '' : 's') + ' from visitors. Each browser may add one word.';
        }
      },
      function () {
        hintEl.textContent = 'Could not load words. Check Firebase rules and network.';
        showStatus('Firestore sync failed.', true);
      }
    );

    window.addEventListener(
      'resize',
      function () {
        scheduleDraw(lastList);
      },
      { passive: true }
    );

    const savedWord = (function () {
      try {
        return localStorage.getItem(STORAGE_WORD);
      } catch {
        return null;
      }
    })();

    function lockForm(display) {
      input.disabled = true;
      if (submitBtn) submitBtn.disabled = true;
      form.classList.add('random-wordcloud-form--locked');
      showStatus('You already added: ' + display, false);
    }

    if (savedWord) {
      lockForm(savedWord);
    } else {
      db.collection(COLLECTION)
        .doc(visitorId)
        .get()
        .then(function (snap) {
          if (!snap.exists) return;
          const w = normalizeWord(snap.data().word);
          if (!w) return;
          try {
            localStorage.setItem(STORAGE_WORD, displayForm(w));
          } catch (_) {}
          lockForm(displayForm(w));
        })
        .catch(function () {});
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!visitorId) {
        showStatus('Enable storage to save your word.', true);
        return;
      }
      const raw = normalizeWord(input.value);
      if (!raw) {
        showStatus('Enter one word using letters A–Z only.', true);
        return;
      }

      const display = displayForm(raw);
      if (submitBtn) submitBtn.disabled = true;

      const docRef = db.collection(COLLECTION).doc(visitorId);
      docRef
        .get()
        .then(function (snap) {
          if (snap.exists) {
            const w = normalizeWord(snap.data().word);
            lockForm(displayForm(w));
            return null;
          }
          return docRef.set({ word: raw });
        })
        .then(function (writeResult) {
          if (writeResult === null) return;
          try {
            localStorage.setItem(STORAGE_WORD, display);
          } catch (_) {}
          lockForm(display);
          input.value = '';
          showStatus('', false);
        })
        .catch(function (err) {
          const code = err && err.code;
          if (code === 'permission-denied') {
            showStatus('Could not save (check Firestore rules).', true);
          } else {
            showStatus('Could not save. Try again.', true);
          }
        })
        .finally(function () {
          if (submitBtn && !form.classList.contains('random-wordcloud-form--locked')) {
            submitBtn.disabled = false;
          }
        });
    });

    window.addEventListener(
      'beforeunload',
      function () {
        if (typeof unsubscribe === 'function') unsubscribe();
      },
      { passive: true }
    );
  });
})();
