/* ============================================================
   TypeBlitz — script.js
   Full typing speed engine + animations
   ============================================================ */

'use strict';

// ── WORD POOL ──────────────────────────────────────────────
const WORD_POOL = [
  'the','be','to','of','and','a','in','that','have','it',
  'for','not','on','with','he','as','you','do','at','this',
  'but','his','by','from','they','we','say','her','she','or',
  'an','will','my','one','all','would','there','their','what',
  'so','up','out','if','about','who','get','which','go','me',
  'when','make','can','like','time','no','just','him','know',
  'take','people','into','year','your','good','some','could',
  'them','see','other','than','then','now','look','only','come',
  'its','over','think','also','back','after','use','two','how',
  'our','work','first','well','way','even','new','want','because',
  'any','these','give','day','most','us','great','between','need',
  'large','often','hand','high','place','hold','turn','move','live',
  'keep','children','far','never','open','seem','together','next',
  'white','begin','got','walk','example','ease','paper','group',
  'always','music','those','both','mark','book','letter','until',
  'mile','river','car','feet','care','second','enough','plain',
  'girl','usual','young','ready','above','ever','red','list',
  'though','feel','talk','bird','soon','body','dog','family','direct',
  'pose','leave','song','measure','door','product','black','short',
  'numeral','off','less','night','spell','add','land','here',
  'side','without','boy','once','animal','life','food','sun',
  'four','state','once','base','hear','horse','cut','sure',
  'watch','color','face','wood','main','call','mind','friend',
  'fall','important','point','near','build','world','self','earth',
  'still','learn','plant','cover','light','voice','power','town',
  'fine','drive','short','road','row','wrote','skin','free',
  'plan','behind','picture','clear','front','warm','real','table'
];

function generateText(wordCount = 50) {
  let words = [];

  for (let i = 0; i < wordCount; i++) {
    let word = WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)];

    if (state.textMode === 'real') {
      if (Math.random() > 0.7) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }

      if (Math.random() > 0.75) {
        const punctuations = ['.', ',', '?', '!', ':', ';'];
        word += punctuations[Math.floor(Math.random() * punctuations.length)];
      }

      if (Math.random() > 0.9) {
        word = `"${word}"`;
      }
    }

    words.push(word);
  }

  return words.join(' ');
}
// ── STATE ─────────────────────────────────────────────────
let state = {
  mode: 15,
  customTime: 60,
  text: '',
  input: '',
  started: false,
  finished: false,
  startTime: null,
  timer: null,
  timeLeft: 15,
  totalTime: 15,
  correctChars: 0,
  errorChars: 0,
  history: JSON.parse(localStorage.getItem('typeblitz_history') || '[]'),
textMode: 'paragraph',
};

// ── DOM REFS ──────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const el = {
  cursorGlow:     $('cursorGlow'),
  bgStreaks:      $('bgStreaks'),
  navBestWpm:     $('navBestWpm'),
  liveWpm:        $('liveWpm'),
  liveAccuracy:   $('liveAccuracy'),
  liveTimer:      $('liveTimer'),
  liveErrors:     $('liveErrors'),
  typingWrapper:  $('typingWrapper'),
  typingPrompt:   $('typingPrompt'),
  typingInput:    $('typingInput'),
  typingHint:     $('typingHint'),
  btnStart:       $('btnStart'),
  btnReset:       $('btnReset'),
  resultsOverlay: $('resultsOverlay'),
  resWpm:         $('resWpm'),
  resAccuracy:    $('resAccuracy'),
  resCorrect:     $('resCorrect'),
  resErrors:      $('resErrors'),
  resChars:       $('resChars'),
  resTime:        $('resTime'),
  resultsRank:    $('resultsRank'),
  btnTryAgain:    $('btnTryAgain'),
  btnViewStats:   $('btnViewStats'),
  statsHistory:   $('statsHistory'),
  sectionTest:    $('sectionTest'),
  sectionStats:   $('sectionStats'),
  sectionAbout:   $('sectionAbout'),
};

// ── BACKGROUND STREAKS ────────────────────────────────────
function spawnStreaks() {
  for (let i = 0; i < 18; i++) {
    const s = document.createElement('div');
    s.classList.add('streak');
    const left = Math.random() * 100;
    const dur  = 1.8 + Math.random() * 3;
    const del  = Math.random() * 6;
    const h    = 60 + Math.random() * 120;
    s.style.cssText = `left:${left}%;height:${h}px;animation-duration:${dur}s;animation-delay:${del}s`;
    el.bgStreaks.appendChild(s);
  }
}

// ── MOUSE TRACKING ────────────────────────────────────────
document.addEventListener('mousemove', e => {
  el.cursorGlow.style.left = e.clientX + 'px';
  el.cursorGlow.style.top  = e.clientY + 'px';
});

// ── NAV ROUTING ───────────────────────────────────────────
$$('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const sec = link.dataset.section;
    $$('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    el.sectionTest.style.display   = sec === 'test'  ? '' : 'none';
    el.sectionStats.classList.toggle('visible', sec === 'stats');
    el.sectionAbout.classList.toggle('visible', sec === 'about');

    if (sec === 'stats') renderHistory();
  });
});
document.addEventListener('mousedown', () => {
  el.cursorGlow.style.transform = 'translate(-50%, -50%) scale(0.8)';
});

document.addEventListener('mouseup', () => {
  el.cursorGlow.style.transform = 'translate(-50%, -50%) scale(1)';
});

// ── MODE SELECTOR ─────────────────────────────────────────
$$('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (btn.dataset.mode === 'custom') {
      const t = parseInt(prompt('Enter custom time in seconds (10–300):', '90'), 10);
      state.mode       = isNaN(t) ? 60 : Math.min(300, Math.max(10, t));
      state.customTime = state.mode;
      btn.textContent  = state.mode + 's';
    } else {
      state.mode = parseInt(btn.dataset.mode, 10);
    }
    resetTest();
  });
});
$$('.text-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.text-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    state.textMode = btn.dataset.textmode;

    if (state.textMode === 'flow') {
      el.typingPrompt.classList.add('flow-mode');
    } else {
      el.typingPrompt.classList.remove('flow-mode');
    }

    resetTest();
  });
});

// ── TYPING AREA CLICK TO FOCUS ────────────────────────────
el.typingWrapper.addEventListener('click', () => {
  el.typingInput.focus();
});

el.typingInput.addEventListener('focus', () => {
  el.typingWrapper.classList.add('focused');
});

el.typingInput.addEventListener('blur', () => {
  el.typingWrapper.classList.remove('focused');
});

// ── INPUT HANDLER ─────────────────────────────────────────
el.typingInput.addEventListener('input', e => {
  if (state.finished) return;

  const val = el.typingInput.value;

  // Auto-start on first keystroke
  if (!state.started && val.length > 0) {
    startTest();
  }

  if (!state.started) return;

  state.input = val;
  updatePrompt();
  updateLiveStats();
});

// Prevent paste
el.typingInput.addEventListener('paste', e => e.preventDefault());

// ── START TEST ────────────────────────────────────────────
function startTest() {
  if (state.started) return;
  state.started   = true;
  state.startTime = performance.now();
  state.timeLeft  = state.mode;
  state.totalTime = state.mode;

  el.typingHint.classList.add('hidden');
  el.typingWrapper.classList.add('running');
  el.btnStart.disabled = true;

  el.liveTimer.textContent = state.timeLeft;
  el.liveTimer.classList.remove('danger');

  state.timer = setInterval(() => {
    state.timeLeft--;
    el.liveTimer.textContent = state.timeLeft;

    if (state.timeLeft <= 5) {
      el.liveTimer.classList.add('danger');
    }

    if (state.timeLeft <= 0) {
      finishTest();
    }
  }, 1000);
}

// ── RESET TEST ────────────────────────────────────────────
function resetTest() {
  clearInterval(state.timer);
  state.started    = false;
  state.finished   = false;
  state.startTime  = null;
  state.input      = '';
  state.correctChars = 0;
  state.errorChars   = 0;
  state.timeLeft   = state.mode;
  state.totalTime  = state.mode;

  state.text = generateText(80);

  el.typingInput.value     = '';
  el.typingInput.disabled  = false;
  el.liveWpm.textContent   = '0';
  el.liveAccuracy.textContent = '100';
  el.liveTimer.textContent = '—';
  el.liveErrors.textContent = '0';
  el.liveTimer.classList.remove('danger');
  el.typingHint.classList.remove('hidden');
  el.typingWrapper.classList.remove('running', 'focused');
  el.btnStart.disabled     = false;
  el.resultsOverlay.style.display = 'none';
  el.typingPrompt.style.animationPlayState = 'paused';
  const track = document.querySelector('.flow-track');
if(track) track.style.transform = 'translateX(0)';
  renderPrompt();
}

// ── RENDER PROMPT ─────────────────────────────────────────
function renderPrompt() {
  const chars = state.text
    .split('')
    .map((ch, i) => `<span class="char" data-i="${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`)
    .join('');

  if(state.textMode === 'flow'){
    el.typingPrompt.innerHTML = `<div class="flow-track">${chars}</div>`;
  } else {
    el.typingPrompt.innerHTML = chars;
  }

  highlightCurrent(0);
}

// ── UPDATE PROMPT CHARS ───────────────────────────────────
function updatePrompt() {
  const chars = $$('.char');
  let correct = 0;
  let errors  = 0;

  chars.forEach(span => span.classList.remove('correct', 'error', 'current'));

  for (let i = 0; i < state.input.length; i++) {
    if (i >= chars.length) break;
    if (state.input[i] === state.text[i]) {
      chars[i].classList.add('correct');
      correct++;
    } else {
      chars[i].classList.add('error');
      errors++;
    }
  }

  // Current position caret
  const cur = state.input.length;
  if (cur < chars.length) {
    chars[cur].classList.add('current');
    // Scroll into view if needed
    if(state.textMode === 'flow'){
  const track = document.querySelector('.flow-track');
  const currentChar = chars[cur];

  if(track && currentChar){
    const charRect = currentChar.getBoundingClientRect();
    const promptRect = el.typingPrompt.getBoundingClientRect();

    const offset = charRect.right - promptRect.right + 80;

    if(offset > 0){
      track.style.transform = `translateX(-${offset}px)`;
    }
  }
}
  }

  state.correctChars = correct;
  state.errorChars   = errors;
}

function highlightCurrent(i) {
  const chars = $$('.char');
  if (chars[i]) chars[i].classList.add('current');
}

// ── LIVE STATS ────────────────────────────────────────────
function updateLiveStats() {
  const elapsed = state.started
    ? (performance.now() - state.startTime) / 60000
    : 0;

  const words   = elapsed > 0 ? Math.round(state.correctChars / 5 / elapsed) : 0;
  const total   = state.correctChars + state.errorChars;
  const acc     = total > 0 ? Math.round((state.correctChars / total) * 100) : 100;

  el.liveWpm.textContent      = words;
  el.liveAccuracy.textContent = acc;
  el.liveErrors.textContent   = state.errorChars;
}

// ── FINISH TEST ───────────────────────────────────────────
function finishTest() {
  clearInterval(state.timer);
  state.finished = true;
  el.typingInput.disabled = true;
  el.typingWrapper.classList.remove('running');

  const elapsed = (performance.now() - state.startTime) / 60000;
  const wpm     = Math.round(state.correctChars / 5 / elapsed);
  const total   = state.correctChars + state.errorChars;
  const acc     = total > 0 ? Math.round((state.correctChars / total) * 100) : 100;
  const timeUsed = state.totalTime - state.timeLeft;

  // Save to history
  const record = {
    wpm,
    accuracy: acc,
    correct:  state.correctChars,
    errors:   state.errorChars,
    chars:    total,
    time:     timeUsed,
    mode:     state.mode,
    date:     new Date().toLocaleString(),
  };
  state.history.unshift(record);
  if (state.history.length > 50) state.history.pop();
  localStorage.setItem('typeblitz_history', JSON.stringify(state.history));

  // Update best WPM badge
  const best = Math.max(...state.history.map(h => h.wpm));
  el.navBestWpm.textContent = best;

  showResults(record);
}

// ── SHOW RESULTS ──────────────────────────────────────────
function showResults(r) {
  el.resWpm.textContent      = r.wpm;
  el.resAccuracy.textContent = r.accuracy;
  el.resCorrect.textContent  = r.correct;
  el.resErrors.textContent   = r.errors;
  el.resChars.textContent    = r.chars;
  el.resTime.textContent     = r.time;

  el.resWpm.style.color      = speedColor(r.wpm);
  el.resAccuracy.style.color = accColor(r.accuracy);

  el.resultsRank.textContent = rankMessage(r.wpm);
  el.resultsOverlay.style.display = 'flex';

  // Animate numbers counting up
  animateCount(el.resWpm,      0, r.wpm,      600);
  animateCount(el.resAccuracy, 0, r.accuracy, 800);
}

function animateCount(el, from, to, dur) {
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(p));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

function speedColor(wpm) {
  if (wpm >= 100) return '#f5c400';
  if (wpm >= 70)  return '#00f5d4';
  if (wpm >= 40)  return '#7efff5';
  return '#e8eaf6';
}

function accColor(acc) {
  if (acc >= 98) return '#00f5d4';
  if (acc >= 90) return '#7efff5';
  if (acc >= 75) return '#f5c400';
  return '#ff3cac';
}

function rankMessage(wpm) {
  if (wpm >= 150) return '⚡ LEGENDARY — You are superhuman!';
  if (wpm >= 120) return '🏆 ELITE — Insane typing speed!';
  if (wpm >= 100) return '🔥 BLAZING — Top 1% territory!';
  if (wpm >= 80)  return '💪 PROFICIENT — Way above average!';
  if (wpm >= 60)  return '👍 SOLID — Better than most!';
  if (wpm >= 40)  return '✊ AVERAGE — Keep pushing!';
  if (wpm >= 20)  return '🌱 BEGINNER — Room to grow!';
  return '🐢 Just warming up — practice makes perfect!';
}

// ── RENDER HISTORY ────────────────────────────────────────
function renderHistory() {
  if (!state.history.length) {
    el.statsHistory.innerHTML = '<p class="empty-state">No tests yet. Start typing to build your history!</p>';
    return;
  }
  el.statsHistory.innerHTML = state.history.map((r, i) => `
    <div class="history-row">
      <span class="history-wpm">${r.wpm}</span>
      <span class="history-label">WPM</span>
      <span class="history-acc">${r.accuracy}% accuracy</span>
      <span class="history-acc">${r.errors} errors</span>
      <span class="history-acc">${r.mode}s mode</span>
      <span class="history-time">${r.date}</span>
    </div>
  `).join('');
}

// ── BUTTON HANDLERS ───────────────────────────────────────
el.btnStart.addEventListener('click', () => {
  if (!state.started) {
    el.typingInput.focus();
    // Force start if they clicked the button
    if (!state.started && el.typingInput === document.activeElement) {
      el.typingHint.classList.add('hidden');
    }
  }
});

el.btnReset.addEventListener('click', resetTest);

el.btnTryAgain.addEventListener('click', () => {
  el.resultsOverlay.style.display = 'none';
  resetTest();
  setTimeout(() => el.typingInput.focus(), 100);
});

el.btnViewStats.addEventListener('click', () => {
  el.resultsOverlay.style.display = 'none';
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[data-section="stats"]').classList.add('active');
  el.sectionTest.style.display = 'none';
  el.sectionStats.classList.add('visible');
  el.sectionAbout.classList.remove('visible');
  renderHistory();
});

// ── KEYBOARD SHORTCUT ─────────────────────────────────────
document.addEventListener('keydown', e => {
  // Tab to reset
  if (e.key === 'Tab') {
    e.preventDefault();
    resetTest();
    setTimeout(() => el.typingInput.focus(), 50);
  }
  // Escape to close results
  if (e.key === 'Escape') {
    el.resultsOverlay.style.display = 'none';
  }
});

// ── UPDATE BEST WPM BADGE ON LOAD ─────────────────────────
function initBadge() {
  if (state.history.length > 0) {
    const best = Math.max(...state.history.map(h => h.wpm));
    el.navBestWpm.textContent = best;
  }
}

// ── INIT ──────────────────────────────────────────────────
function init() {
  spawnStreaks();
  initBadge();
  state.text = generateText(80);
  renderPrompt();
  el.liveTimer.textContent = state.mode;
  if(state.textMode === 'flow'){
  el.typingPrompt.style.animationPlayState = 'running';
}
}
const contactBtn = document.getElementById('contactBtn');
const contactPopup = document.getElementById('contactPopup');
const closeContact = document.getElementById('closeContact');

contactBtn.addEventListener('click', e => {
  e.preventDefault();
  contactPopup.classList.add('show');
});

closeContact.addEventListener('click', () => {
  contactPopup.classList.remove('show');
});

contactPopup.addEventListener('click', e => {
  if (e.target === contactPopup) {
    contactPopup.classList.remove('show');
  }
});
init();
