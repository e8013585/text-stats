'use strict';

const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur']);

function applyDirectionality() {
  const uiLocale = chrome.i18n.getMessage('@@ui_locale') || 'en';
  const lang = uiLocale.split(/[-_]/)[0].toLowerCase();
  if (RTL_LOCALES.has(lang)) {
    document.documentElement.setAttribute('dir', 'rtl');
    document.body.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.body.setAttribute('dir', 'ltr');
  }
  document.documentElement.setAttribute('lang', lang);
}

function t(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
}

const $ = (id) => document.getElementById(id);

const elHeading        = $('heading');
const elSubheading     = $('subheading');
const elModeBadge      = $('mode-badge');
const elToggleBtn      = $('toggle-mode-btn');
const elCopyBtn        = $('copy-btn');
const elSpinnerWrapper = $('spinner-wrapper');
const elSpinnerLabel   = $('spinner-label');
const elNoticeWrapper  = $('notice-wrapper');
const elNoticeText     = $('notice-text');
const elStatsWrapper   = $('stats-wrapper');
const elStatsGrid      = $('stats-grid');
const elFooterNote     = $('footer-note');

let currentMode = 'selection';
let lastStats   = null;

function localiseUI() {
  document.title        = t('popupHeading');
  elHeading.textContent = t('popupHeading');
  elSubheading.textContent = t('popupSubheading');
  elFooterNote.textContent = t('footerNote');
  elSpinnerLabel.textContent = t('spinnerLabel');
  elCopyBtn.textContent = t('copyButton');
  updateToggleButton();
  updateModeBadge();
}

function updateToggleButton() {
  if (currentMode === 'selection') {
    elToggleBtn.textContent = t('toggleFullPage');
    elToggleBtn.classList.remove('active-mode');
  } else {
    elToggleBtn.textContent = t('toggleSelection');
    elToggleBtn.classList.add('active-mode');
  }
}

function updateModeBadge() {
  elModeBadge.textContent =
    currentMode === 'selection' ? t('modeSelected') : t('modeFullPage');
}

function showSpinner() {
  elSpinnerWrapper.removeAttribute('hidden');
  elNoticeWrapper.hidden  = true;
  elStatsWrapper.hidden   = true;
}

function showStats() {
  elSpinnerWrapper.setAttribute('hidden', '');
  elNoticeWrapper.hidden = true;
  elStatsWrapper.hidden  = false;
}

function showNotice(message, isError = false) {
  elSpinnerWrapper.setAttribute('hidden', '');
  elStatsWrapper.hidden  = true;
  elNoticeWrapper.hidden = false;
  elNoticeText.textContent = message;
  if (isError) {
    elNoticeWrapper.classList.add('notice-error');
  } else {
    elNoticeWrapper.classList.remove('notice-error');
  }
}

function countSentences(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const matches = trimmed.match(/[^.!?\u2026]*[.!?\u2026]+["')\]\u201D\u2019]*\s*/g);
  if (!matches) {
    return /\S/.test(trimmed) ? 1 : 0;
  }
  const valid = matches.filter((m) => /\S/.test(m));
  return valid.length || (/\S/.test(trimmed) ? 1 : 0);
}

function countParagraphs(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const blocks = trimmed.split(/\n[\t ]*\n+/);
  return blocks.filter((b) => /\S/.test(b)).length || 1;
}

function getWords(text) {
  return text.match(/[\p{L}\p{N}]+(?:['\u2019-][\p{L}\p{N}]+)*/gu) || [];
}

function calcReadingTime(wordCount) {
  if (wordCount === 0) return t('readingTimeLessThanHalf');
  const wpm         = 200;
  const rawMinutes  = wordCount / wpm;
  const rounded     = Math.ceil(rawMinutes * 2) / 2;
  if (rounded < 0.5) return t('readingTimeLessThanHalf');
  const display = rounded % 1 === 0 ? String(rounded) : String(rounded);
  return t('readingTimeMinutes', [display]);
}

function computeStats(text) {
  const charsWithSpaces    = text.length;
  const charsNoSpaces      = text.replace(/\s/g, '').length;
  const words              = getWords(text);
  const wordCount          = words.length;
  const sentenceCount      = countSentences(text);
  const paragraphCount     = countParagraphs(text);
  const readingTime        = calcReadingTime(wordCount);
  const uniqueWordCount    = new Set(words.map((w) => w.toLowerCase())).size;

  let longestWord = t('noneValue');
  if (words.length > 0) {
    longestWord = words.reduce((a, b) => (b.length > a.length ? b : a), '');
  }

  return {
    charsWithSpaces,
    charsNoSpaces,
    wordCount,
    sentenceCount,
    paragraphCount,
    readingTime,
    uniqueWordCount,
    longestWord,
  };
}

function createStatRow(labelKey, value) {
  const row = document.createElement('div');
  row.className = 'stat-row';

  const label = document.createElement('dt');
  label.className = 'stat-label';
  label.textContent = t(labelKey);

  const val = document.createElement('dd');
  val.className = 'stat-value';
  val.textContent = String(value);
  val.title = String(value);

  row.appendChild(label);
  row.appendChild(val);
  return row;
}

function renderStats(stats) {
  lastStats = stats;

  while (elStatsGrid.firstChild) {
    elStatsGrid.removeChild(elStatsGrid.firstChild);
  }

  const rows = [
    ['statCharactersWithSpaces', stats.charsWithSpaces.toLocaleString()],
    ['statCharactersNoSpaces',   stats.charsNoSpaces.toLocaleString()],
    ['statWords',                stats.wordCount.toLocaleString()],
    ['statSentences',            stats.sentenceCount.toLocaleString()],
    ['statParagraphs',           stats.paragraphCount.toLocaleString()],
    ['statReadingTime',          stats.readingTime],
    ['statUniqueWords',          stats.uniqueWordCount.toLocaleString()],
    ['statLongestWord',          stats.longestWord],
  ];

  const fragment = document.createDocumentFragment();
  rows.forEach(([key, value]) => {
    fragment.appendChild(createStatRow(key, value));
  });
  elStatsGrid.appendChild(fragment);

  showStats();
}

function buildCopyText(stats) {
  const lines = [
    `${t('statCharactersWithSpaces')}: ${stats.charsWithSpaces.toLocaleString()}`,
    `${t('statCharactersNoSpaces')}: ${stats.charsNoSpaces.toLocaleString()}`,
    `${t('statWords')}: ${stats.wordCount.toLocaleString()}`,
    `${t('statSentences')}: ${stats.sentenceCount.toLocaleString()}`,
    `${t('statParagraphs')}: ${stats.paragraphCount.toLocaleString()}`,
    `${t('statReadingTime')}: ${stats.readingTime}`,
    `${t('statUniqueWords')}: ${stats.uniqueWordCount.toLocaleString()}`,
    `${t('statLongestWord')}: ${stats.longestWord}`,
  ];
  return lines.join('\n');
}

function handleCopy() {
  if (!lastStats) return;
  const text = buildCopyText(lastStats);

  navigator.clipboard.writeText(text).then(() => {
    elCopyBtn.textContent = t('copySuccess');
    elCopyBtn.classList.add('copy-success');
    elCopyBtn.classList.remove('copy-error');
    setTimeout(resetCopyBtn, 1800);
  }).catch(() => {
    elCopyBtn.textContent = t('copyError');
    elCopyBtn.classList.add('copy-error');
    elCopyBtn.classList.remove('copy-success');
    setTimeout(resetCopyBtn, 1800);
  });
}

function resetCopyBtn() {
  elCopyBtn.textContent = t('copyButton');
  elCopyBtn.classList.remove('copy-success', 'copy-error');
}

function getPageText(forceFullPage) {
  const selection = window.getSelection();
  const selectedText = selection ? selection.toString().trim() : '';

  if (!forceFullPage && selectedText.length > 0) {
    return { text: selectedText, usedFullPage: false };
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS',
    'AUDIO', 'VIDEO', 'IFRAME', 'OBJECT', 'EMBED', 'HEAD', 'META',
    'LINK', 'CODE', 'PRE',
  ]);

  const parts = [];

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const val = node.nodeValue;
      if (val && val.trim()) {
        parts.push(val.trim());
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(node.tagName)) return;
    if (!isVisible(node)) return;

    const blockTags = new Set([
      'P', 'DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE',
      'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TR', 'HEADER',
      'FOOTER', 'MAIN', 'NAV', 'FIGURE', 'FIGCAPTION',
    ]);
    const isBlock = blockTags.has(node.tagName);
    if (isBlock && parts.length > 0) {
      parts.push('\n\n');
    }

    for (const child of node.childNodes) {
      walk(child);
    }

    if (isBlock) {
      parts.push('\n\n');
    }
  }

  walk(document.body);

  const raw = parts.join(' ').replace(/(\n\n)(\s*\n)+/g, '\n\n').trim();

  return { text: raw, usedFullPage: true };
}

async function analyzeTab() {
  showSpinner();

  let tab;
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    tab = activeTab;
  } catch {
    showNotice(t('errorGeneric'), true);
    return;
  }

  if (!tab || !tab.id) {
    showNotice(t('errorGeneric'), true);
    return;
  }

  const url = tab.url || '';
  if (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com') ||
    !url
  ) {
    showNotice(t('errorRestrictedPage'), true);
    return;
  }

  const forceFullPage = currentMode === 'fullpage';

  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getPageText,
      args: [forceFullPage],
    });
  } catch (err) {
    showNotice(t('errorGeneric'), true);
    return;
  }

  if (!results || results.length === 0 || results[0].result == null) {
    showNotice(t('errorGeneric'), true);
    return;
  }

  const { text, usedFullPage } = results[0].result;

  if (!text || !text.trim()) {
    showNotice(t('noTextFound'), false);
    return;
  }

  if (currentMode === 'selection' && usedFullPage) {
    elNoticeWrapper.hidden = false;
    elNoticeText.textContent = t('noSelectionFallback');
    elNoticeWrapper.classList.remove('notice-error');
  } else {
    elNoticeWrapper.hidden = true;
  }

  const stats = computeStats(text);
  renderStats(stats);

  if (currentMode === 'selection' && usedFullPage) {
    elStatsWrapper.hidden = false;
    elSpinnerWrapper.setAttribute('hidden', '');
  }
}

function handleToggleMode() {
  currentMode = currentMode === 'selection' ? 'fullpage' : 'selection';
  updateToggleButton();
  updateModeBadge();
  analyzeTab();
}

document.addEventListener('DOMContentLoaded', () => {
  applyDirectionality();
  localiseUI();

  elToggleBtn.addEventListener('click', handleToggleMode);
  elCopyBtn.addEventListener('click', handleCopy);

  analyzeTab();
});
