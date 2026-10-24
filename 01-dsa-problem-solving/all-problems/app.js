(() => {
  'use strict';

  const data = window.WELLDEV_PROBLEMS;
  if (!data) return;

  const sourceOrder = ['all', 'blind75', 'leetcode150', 'neetcode150'];
  const expectedCounts = { all: 224, blind75: 75, leetcode150: 150, neetcode150: 150 };
  const difficultyNames = { E: 'Easy', M: 'Medium', H: 'Hard' };
  const listNames = { B75: 'Blind 75', LC150: 'Top 150', NC150: 'NeetCode 150' };
  const storageKey = 'welldev-all-problems-done';

  const elements = {
    title: document.querySelector('#page-title'),
    description: document.querySelector('#page-description'),
    sourceLink: document.querySelector('#source-link'),
    sourceTabs: document.querySelector('#source-tabs'),
    stats: document.querySelector('#stats'),
    search: document.querySelector('#search'),
    difficulties: document.querySelector('#difficulty-filters'),
    categories: document.querySelector('#category-filters'),
    resultCount: document.querySelector('#result-count'),
    list: document.querySelector('#problem-list'),
    empty: document.querySelector('#empty-state'),
    clear: document.querySelector('#clear-filters'),
    progressNumber: document.querySelector('#progress-number'),
    progressFill: document.querySelector('#progress-fill'),
    progressPercent: document.querySelector('#progress-percent'),
    theme: document.querySelector('#theme-toggle'),
  };

  const hashSource = location.hash.replace('#', '');
  const state = {
    source: sourceOrder.includes(hashSource) ? hashSource : 'all',
    category: 'all',
    difficulty: 'all',
    search: '',
    done: readDone(),
  };

  function readDone() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return new Set(Array.isArray(value) ? value : []);
    } catch {
      return new Set();
    }
  }

  function saveDone() {
    localStorage.setItem(storageKey, JSON.stringify([...state.done]));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    })[character]);
  }

  function sourceRows(source = state.source) {
    let number = 0;
    return data.lists[source].flatMap((category) => category.problems.map((id) => ({
      id,
      category: category.name,
      number: ++number,
      problem: data.catalog[id],
    })));
  }

  function renderSourceTabs() {
    elements.sourceTabs.innerHTML = sourceOrder.map((source) => {
      const meta = data.sources[source];
      const count = sourceRows(source).length;
      return `<button class="source-tab" type="button" role="tab" data-source="${source}" aria-selected="${state.source === source}">
        <strong>${escapeHtml(meta.name)}</strong>
        <span><b>${count}</b> problems</span>
      </button>`;
    }).join('');
  }

  function renderHero(rows) {
    const meta = data.sources[state.source];
    elements.title.textContent = meta.name;
    elements.description.textContent = meta.description;
    if (meta.url) {
      elements.sourceLink.href = meta.url;
      elements.sourceLink.hidden = false;
    } else {
      elements.sourceLink.hidden = true;
    }

    const solved = rows.filter((row) => state.done.has(row.id)).length;
    const percent = rows.length ? Math.round((solved / rows.length) * 100) : 0;
    elements.progressNumber.textContent = `${solved} / ${rows.length}`;
    elements.progressFill.style.width = `${percent}%`;
    elements.progressPercent.textContent = `${percent}% complete`;
  }

  function renderStats(rows) {
    const stats = [
      ['Total', rows.length, ''],
      ['Easy', rows.filter((row) => row.problem.difficulty === 'E').length, 'easy'],
      ['Medium', rows.filter((row) => row.problem.difficulty === 'M').length, 'medium'],
      ['Hard', rows.filter((row) => row.problem.difficulty === 'H').length, 'hard'],
      ['Categories', data.lists[state.source].length, ''],
    ];
    elements.stats.innerHTML = stats.map(([label, value, className]) =>
      `<div class="stat-card ${className}"><strong>${value}</strong><span>${label}</span></div>`,
    ).join('');
  }

  function renderDifficultyFilters(rows) {
    const filters = [
      ['all', 'সব difficulty', rows.length],
      ['E', 'Easy', rows.filter((row) => row.problem.difficulty === 'E').length],
      ['M', 'Medium', rows.filter((row) => row.problem.difficulty === 'M').length],
      ['H', 'Hard', rows.filter((row) => row.problem.difficulty === 'H').length],
    ];
    elements.difficulties.innerHTML = filters.map(([value, label, count]) =>
      `<button class="filter-button" type="button" data-difficulty="${value}" aria-pressed="${state.difficulty === value}">${label} · ${count}</button>`,
    ).join('');
  }

  function renderCategoryFilters() {
    const categories = data.lists[state.source];
    elements.categories.innerHTML = [
      `<button class="category-button" type="button" data-category="all" aria-pressed="${state.category === 'all'}">সব category</button>`,
      ...categories.map((category) =>
        `<button class="category-button" type="button" data-category="${escapeHtml(category.name)}" aria-pressed="${state.category === category.name}">${escapeHtml(category.name)}<small>${category.problems.length}</small></button>`,
      ),
    ].join('');
  }

  function listBadges(problem) {
    return problem.lists.map((list) => `<span class="badge list-badge ${list}">${listNames[list]}</span>`).join('');
  }

  function renderProblems(rows) {
    const words = state.search.toLowerCase().split(/\s+/).filter(Boolean);
    let visibleCount = 0;

    const sections = data.lists[state.source].map((category) => {
      if (state.category !== 'all' && state.category !== category.name) return '';
      const categoryRows = rows.filter((row) => row.category === category.name).filter((row) => {
        const matchesDifficulty = state.difficulty === 'all' || row.problem.difficulty === state.difficulty;
        const haystack = `${row.problem.title} ${row.category}`.toLowerCase();
        return matchesDifficulty && words.every((word) => haystack.includes(word));
      });
      if (!categoryRows.length) return '';
      visibleCount += categoryRows.length;

      const rowMarkup = categoryRows.map(({ id, number, problem }) => {
        const checked = state.done.has(id);
        return `<article class="problem-row${checked ? ' is-done' : ''}" data-problem-id="${id}">
          <span class="problem-number">${String(number).padStart(2, '0')}</span>
          <input class="problem-check" type="checkbox" aria-label="${escapeHtml(problem.title)} complete" ${checked ? 'checked' : ''}>
          <div class="problem-main">
            <a class="problem-title" href="${escapeHtml(problem.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(problem.title)}</a>
            <div class="problem-meta">
              <span class="badge difficulty ${problem.difficulty}">${difficultyNames[problem.difficulty]}</span>
              ${state.source === 'all' ? listBadges(problem) : ''}
              ${problem.premium ? '<span class="badge premium">Premium</span>' : ''}
            </div>
          </div>
          <span class="problem-category" title="${escapeHtml(category.name)}">${escapeHtml(category.name)}</span>
          <a class="external-arrow" href="${escapeHtml(problem.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(problem.title)} LeetCode-এ খুলুন">↗</a>
        </article>`;
      }).join('');

      return `<section class="problem-section">
        <div class="problem-section-header"><h2>${escapeHtml(category.name)}</h2><span>${categoryRows.length} problems</span></div>
        <div class="problem-table">${rowMarkup}</div>
      </section>`;
    }).join('');

    elements.list.innerHTML = sections;
    elements.resultCount.textContent = `${visibleCount} problem${visibleCount === 1 ? '' : 's'} দেখানো হচ্ছে`;
    elements.empty.hidden = visibleCount !== 0;
  }

  function render() {
    const rows = sourceRows();
    if (rows.length !== expectedCounts[state.source]) {
      console.error(`Unexpected ${state.source} count: ${rows.length}`);
    }
    renderSourceTabs();
    renderHero(rows);
    renderStats(rows);
    renderDifficultyFilters(rows);
    renderCategoryFilters();
    renderProblems(rows);
  }

  elements.sourceTabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-source]');
    if (!button || button.dataset.source === state.source) return;
    state.source = button.dataset.source;
    state.category = 'all';
    state.difficulty = 'all';
    state.search = '';
    elements.search.value = '';
    history.replaceState(null, '', `#${state.source}`);
    render();
    document.querySelector('.controls').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  elements.difficulties.addEventListener('click', (event) => {
    const button = event.target.closest('[data-difficulty]');
    if (!button) return;
    state.difficulty = button.dataset.difficulty;
    render();
  });

  elements.categories.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    render();
  });

  elements.search.addEventListener('input', () => {
    state.search = elements.search.value.trim();
    renderProblems(sourceRows());
  });

  elements.list.addEventListener('change', (event) => {
    if (!event.target.matches('.problem-check')) return;
    const row = event.target.closest('[data-problem-id]');
    const id = row.dataset.problemId;
    if (event.target.checked) state.done.add(id);
    else state.done.delete(id);
    saveDone();
    row.classList.toggle('is-done', event.target.checked);
    renderHero(sourceRows());
  });

  elements.clear.addEventListener('click', () => {
    state.category = 'all';
    state.difficulty = 'all';
    state.search = '';
    elements.search.value = '';
    render();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && document.activeElement !== elements.search) {
      event.preventDefault();
      elements.search.focus();
    }
    if (event.key === 'Escape' && document.activeElement === elements.search) {
      state.search = '';
      elements.search.value = '';
      elements.search.blur();
      renderProblems(sourceRows());
    }
  });

  elements.theme.addEventListener('click', () => {
    const root = document.documentElement;
    const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const currentlyDark = root.dataset.theme ? root.dataset.theme === 'dark' : systemDark;
    root.dataset.theme = currentlyDark ? 'light' : 'dark';
    localStorage.setItem('welldev-theme', root.dataset.theme);
  });

  const savedTheme = localStorage.getItem('welldev-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;

  render();
})();
