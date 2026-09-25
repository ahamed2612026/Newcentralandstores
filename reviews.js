/* ============================================================
   CENTRAL & STORES — PUBLIC CUSTOMER REVIEWS
   Self-contained module. Uses its own Supabase client.
   ============================================================ */

(function () {
  'use strict';

  const SUPABASE_URL  = 'https://xcdzozyhvkonvesqvxbp.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZHpvenlodmtvbnZlc3F2eGJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDIwMTYsImV4cCI6MjEwNTQ3ODAxNn0.mX0u55mSR14FGr8Lt6ofENfaOqH6JcGp4ACjKnC3gKA';

  function initReviews() {
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('[reviews] Supabase SDK not loaded yet. Retrying...');
      return setTimeout(initReviews, 150);
    }
    runReviews(window.supabase);
  }

  function runReviews(supabaseLib) {
    const REVIEWS_CLIENT = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: 'cs_public_reviews' }
    });

    // ---- the rest of your code stays EXACTLY the same, just
    //      move the DOM REFS + everything else in here
    ...
  }

  initReviews();
})();

  /* ---------- DOM REFS ---------- */
  const summaryEl    = document.getElementById('reviewsSummary');
  const listEl       = document.getElementById('reviewsList');
  const openBtn      = document.getElementById('openReviewModal');
  const modal        = document.getElementById('reviewModal');
  const overlay      = document.getElementById('reviewModalOverlay');
  const closeBtn     = document.getElementById('reviewModalClose');
  const cancelBtn    = document.getElementById('reviewCancelBtn');
  const form         = document.getElementById('reviewForm');
  const nameInput    = document.getElementById('reviewName');
  const ratingInput  = document.getElementById('reviewRating');
  const textInput    = document.getElementById('reviewText');
  const charCount    = document.getElementById('reviewCharCount');
  const submitBtn    = document.getElementById('reviewSubmitBtn');
  const starButtons  = document.querySelectorAll('.review-star');
  const toastEl      = document.getElementById('reviewToast');

  if (!listEl || !summaryEl) return;

  /* ---------- STATE ---------- */
  let selectedRating = 0;
  let isSubmitting   = false;
  let lastFocusEl    = null;

  const RATE_KEY      = 'cs_review_last_submit';
  const RATE_LIMIT_MS = 60 * 1000;

  /* ---------- HELPERS ---------- */
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function starSVG() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#icon-star"></use></svg>';
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return ''; }
  }

  function showToast(msg, type) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'review-toast ' + (type || '');
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add('show'));
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => { toastEl.hidden = true; }, 300);
    }, 3400);
  }

  /* ---------- LOAD APPROVED REVIEWS ---------- */
  async function loadReviews() {
    try {
      const { data, error } = await REVIEWS_CLIENT
        .from('reviews')
        .select('id, customer_name, rating, review_text, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      renderSummary(data || []);
      renderList(data || []);
    } catch (err) {
      console.warn('[reviews] load failed:', err);
      summaryEl.innerHTML = '';
      listEl.innerHTML = '<div class="reviews-error">Reviews are temporarily unavailable.</div>';
    }
  }

  /* ---------- SUMMARY ---------- */
  function renderSummary(items) {
    if (!items.length) {
      summaryEl.innerHTML =
        '<div class="reviews-summary-empty">' +
          '<div class="reviews-summary-stars" aria-hidden="true">' +
            starSVG() + starSVG() + starSVG() + starSVG() + starSVG() +
          '</div>' +
          '<p style="margin-top:8px;">Be the first to review Central &amp; Stores</p>' +
        '</div>';
      return;
    }

    const total = items.length;
    const avg   = items.reduce((s, r) => s + (Number(r.rating) || 0), 0) / total;
    const avgStr = avg.toFixed(1);
    const fullStars = Math.round(avg);

    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += i <= fullStars ? starSVG() : starSVG();
    }

    summaryEl.innerHTML =
      '<div class="reviews-summary-left">' +
        '<div class="reviews-summary-rating">' +
          '<span class="reviews-summary-number">' + avgStr + '</span>' +
          '<span class="reviews-summary-max">/ 5</span>' +
        '</div>' +
        '<div class="reviews-summary-stars" aria-label="Average rating ' + avgStr + ' out of 5">' + stars + '</div>' +
        '<div class="reviews-summary-meta">Based on ' + total + ' approved review' + (total === 1 ? '' : 's') + '</div>' +
      '</div>';
  }

  /* ---------- LIST ---------- */
  function renderList(items) {
    if (!items.length) {
      listEl.innerHTML =
        '<div class="reviews-empty">' +
          '<h3>No reviews yet</h3>' +
          '<p>Be the first to share your experience with Central &amp; Stores.</p>' +
          '<button type="button" class="reviews-empty-btn" onclick="document.getElementById(\'openReviewModal\').click()">' +
            starSVG() + ' Write a Review' +
          '</button>' +
        '</div>';
      return;
    }

    listEl.innerHTML = items.map(function (r) {
      const rating  = Math.max(1, Math.min(5, Number(r.rating) || 5));
      let stars = '';
      for (let i = 0; i < rating; i++) stars += starSVG();

      const name    = escapeHtml(r.customer_name || 'Customer');
      const text    = escapeHtml(r.review_text || '');
      const dateStr = formatDate(r.created_at);

      return (
        '<article class="review-card">' +
          '<div class="review-card-stars" aria-label="' + rating + ' out of 5 stars">' + stars + '</div>' +
          '<p class="review-card-text">' + text + '</p>' +
          '<div class="review-card-footer">' +
            '<div>' +
              '<div class="review-card-author">' + name + '</div>' +
              '<div class="review-card-verified">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
                'VERIFIED CUSTOMER' +
              '</div>' +
            '</div>' +
            '<div class="review-card-date">' + dateStr + '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  /* ---------- MODAL ---------- */
  function openModal() {
    lastFocusEl = document.activeElement;
    overlay.hidden = false;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(function () { nameInput && nameInput.focus(); }, 100);
  }

  function closeModal() {
    overlay.hidden = true;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocusEl && lastFocusEl.focus) lastFocusEl.focus();
  }

  if (openBtn)   openBtn.addEventListener('click', openModal);
  if (closeBtn)  closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (overlay)   overlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  /* ---------- STAR PICKER ---------- */
  starButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const v = Number(btn.dataset.value);
      selectedRating = v;
      ratingInput.value = v;
      starButtons.forEach(function (b) {
        const bv = Number(b.dataset.value);
        b.classList.toggle('active', bv <= v);
        b.setAttribute('aria-checked', bv === v ? 'true' : 'false');
      });
      setError('reviewRatingError', '');
    });
  });

  /* ---------- CHAR COUNT ---------- */
  if (textInput && charCount) {
    textInput.addEventListener('input', function () {
      charCount.textContent = textInput.value.length;
    });
  }

  /* ---------- ERROR HELPERS ---------- */
  function setError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('show', !!msg);
  }

  function clearErrors() {
    setError('reviewNameError', '');
    setError('reviewRatingError', '');
    setError('reviewTextError', '');
  }

  /* ---------- SUBMIT ---------- */
  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (isSubmitting) return;
      clearErrors();

      const name   = (nameInput.value || '').trim();
      const rating = Number(ratingInput.value) || 0;
      const text   = (textInput.value || '').trim();

      let hasError = false;

      if (!name) { setError('reviewNameError', 'Please enter your name.'); hasError = true; }
      else if (name.length > 60) { setError('reviewNameError', 'Name is too long.'); hasError = true; }

      if (!rating || rating < 1 || rating > 5) {
        setError('reviewRatingError', 'Please select a rating.');
        hasError = true;
      }

      if (!text) { setError('reviewTextError', 'Please write your review.'); hasError = true; }
      else if (text.length < 3) { setError('reviewTextError', 'Review is too short.'); hasError = true; }
      else if (text.length > 800) { setError('reviewTextError', 'Review is too long (max 800).'); hasError = true; }

      if (hasError) return;

      // Rate limiting
      try {
        const last = Number(localStorage.getItem(RATE_KEY) || 0);
        if (Date.now() - last < RATE_LIMIT_MS) {
          const wait = Math.ceil((RATE_LIMIT_MS - (Date.now() - last)) / 1000);
          showToast('Please wait ' + wait + 's before submitting again.', 'error');
          return;
        }
      } catch (e) {}

      isSubmitting = true;
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        const { error } = await REVIEWS_CLIENT.from('reviews').insert([{
          customer_name: name,
          rating: rating,
          review_text: text,
          status: 'pending'
        }]);

        if (error) throw error;

        try { localStorage.setItem(RATE_KEY, String(Date.now())); } catch (e) {}

        form.reset();
        selectedRating = 0;
        ratingInput.value = '';
        if (charCount) charCount.textContent = '0';
        starButtons.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });

        closeModal();
        showToast('Thank you! Your review has been submitted and is waiting for approval.', 'success');

      } catch (err) {
        console.warn('[reviews] submit failed:', err);
        showToast('Something went wrong. Please try again.', 'error');
      } finally {
        isSubmitting = false;
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------- BOOT ---------- */
  loadReviews();

})();
