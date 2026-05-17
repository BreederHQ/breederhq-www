/* ---------- Placeholder species biology + terminology (mockup only) ----------
   Real implementation imports biology from packages/species-biology/src/species.ts
   and terminology from packages/ui/src/utils/speciesTerminology.ts.
   These values are illustrative only — do not treat as authoritative.

   Species included: Dog, Horse, Goat, Sheep — the cycle-start-anchored
   species supported by BHQ. Cat / Rabbit / Alpaca / Llama are induced
   ovulators and use a different planning model (no cycle projection), so
   they are intentionally excluded from this tool. */
const SPECIES = {
  DOG: {
    code: 'DOG',
    label: 'Dog',
    labelPlural: 'Dogs',
    adjective: 'dog',
    offspringSingular: 'puppy',
    offspringPlural: 'puppies',
    birthEvent: 'whelping',
    parentFemale: 'dam',
    parentMale: 'sire',
    seasonal: false,
    breedNote: 'Uses a generalized 210-day canine cycle estimate. Some breeds cycle significantly more or less often. <a href="#breed-cycle-variability">See breed-specific cycle ranges →</a>',
    biology: {
      cycleLenDays: 210,
      preHeatStart: 0,
      preHeatEnd: 9,
      breedingStart: 10,
      breedingEnd: 15,
      gestationStart: 12,
      birthStart: 12 + 63,           // ovulation + gestation
      birthEnd: 12 + 63 + 2,
      neonatalEnd: 12 + 63 + 56,     // 8 weeks of puppy care
      placementEnd: 12 + 63 + 56 + 14, // 2 weeks placement
    },
    exampleName: 'Luna',
  },
  HORSE: {
    code: 'HORSE',
    label: 'Horse',
    labelPlural: 'Horses',
    adjective: 'horse',
    offspringSingular: 'foal',
    offspringPlural: 'foals',
    birthEvent: 'foaling',
    parentFemale: 'mare',
    parentMale: 'stallion',
    seasonal: true,
    seasonalNote: 'Mares cycle seasonally (long-day breeder, ~April–October in the northern hemisphere). Projections in this free tool assume year-round cycling for simplicity.',
    biology: {
      cycleLenDays: 21,
      preHeatStart: 0,
      preHeatEnd: 3,
      breedingStart: 3,
      breedingEnd: 7,
      gestationStart: 5,
      birthStart: 5 + 340,
      birthEnd: 5 + 340 + 3,
      neonatalEnd: 5 + 340 + 3 + 30,   // ~1 month of close care
      placementEnd: 5 + 340 + 3 + 180, // ~6 months to weaning/placement
    },
    exampleName: 'Cinnamon',
  },
  GOAT: {
    code: 'GOAT',
    label: 'Goat',
    labelPlural: 'Goats',
    adjective: 'goat',
    offspringSingular: 'kid',
    offspringPlural: 'kids',
    birthEvent: 'kidding',
    parentFemale: 'doe',
    parentMale: 'buck',
    seasonal: true,
    seasonalNote: 'Goats are seasonal (short-day breeders, ~September–February). Projections in this free tool assume year-round cycling for simplicity.',
    biology: {
      cycleLenDays: 21,
      preHeatStart: 0,
      preHeatEnd: 1,
      breedingStart: 1,
      breedingEnd: 3,
      gestationStart: 2,
      birthStart: 2 + 150,
      birthEnd: 2 + 150 + 2,
      neonatalEnd: 2 + 150 + 2 + 21,   // ~3 weeks close care
      placementEnd: 2 + 150 + 2 + 75,  // ~10–12 weeks to weaning
    },
    exampleName: 'Clover',
  },
  SHEEP: {
    code: 'SHEEP',
    label: 'Sheep',
    labelPlural: 'Sheep',
    adjective: 'sheep',
    offspringSingular: 'lamb',
    offspringPlural: 'lambs',
    birthEvent: 'lambing',
    parentFemale: 'ewe',
    parentMale: 'ram',
    seasonal: true,
    seasonalNote: 'Sheep are seasonal (short-day breeders, ~September–February). Projections in this free tool assume year-round cycling for simplicity.',
    biology: {
      cycleLenDays: 17,
      preHeatStart: 0,
      preHeatEnd: 1,
      breedingStart: 1,
      breedingEnd: 2,
      gestationStart: 2,
      birthStart: 2 + 147,
      birthEnd: 2 + 147 + 2,
      neonatalEnd: 2 + 147 + 2 + 14,    // ~2 weeks close care
      placementEnd: 2 + 147 + 2 + 84,   // ~12 weeks to weaning
    },
    exampleName: 'Willow',
  },
  CATTLE: {
    code: 'CATTLE',
    label: 'Cattle',
    labelPlural: 'Cattle',
    adjective: 'cattle',
    offspringSingular: 'calf',
    offspringPlural: 'calves',
    birthEvent: 'calving',
    parentFemale: 'cow',
    parentMale: 'bull',
    seasonal: false,
    biology: {
      cycleLenDays: 21,
      preHeatStart: 0,
      preHeatEnd: 1,
      breedingStart: 1,
      breedingEnd: 2,
      gestationStart: 2,
      birthStart: 2 + 283,
      birthEnd: 2 + 283 + 3,
      neonatalEnd: 2 + 283 + 3 + 30,    // ~1 month close care
      placementEnd: 2 + 283 + 3 + 210,  // ~7 months to weaning
    },
    exampleName: 'Bessie',
  },
};

const SPECIES_ORDER = ['DOG', 'HORSE', 'GOAT', 'SHEEP', 'CATTLE'];

function speciesOf(dog) { return SPECIES[dog.speciesCode] || SPECIES.DOG; }

// Phase classification for availability computation.
// Pre-heat is NOT occupied — the breeder isn't doing anything procedural yet,
// just leading up to heat. The bar shows what's happening to the animal; the
// availability band shows that the breeder still has flexibility.
// Labels (especially "Birth" and "Neonatal care") are resolved per species
// at render time from the species terminology table above.
const PHASES = [
  { key: 'preheat',   colorVar: 'var(--phase-preheat)',   start: b => b.preHeatStart,   end: b => b.preHeatEnd,   occupied: false,
    labelFor: sp => 'Pre-heat' },
  { key: 'breeding',  colorVar: 'var(--phase-breeding)',  start: b => b.breedingStart,  end: b => b.breedingEnd,  occupied: true,
    labelFor: sp => 'Breeding window', overlay: true },
  { key: 'gestation', colorVar: 'var(--phase-gestation)', start: b => b.gestationStart, end: b => b.birthStart,   occupied: true,
    labelFor: sp => 'Gestation' },
  { key: 'birth',     colorVar: 'var(--phase-whelping)',  start: b => b.birthStart,     end: b => b.birthEnd,     occupied: true,
    labelFor: sp => titleCase(sp.birthEvent) },     // Whelping / Foaling / Kidding / Lambing
  { key: 'neonatal',  colorVar: 'var(--phase-puppycare)', start: b => b.birthEnd,       end: b => b.neonatalEnd,  occupied: true,
    labelFor: sp => `${titleCase(sp.offspringSingular)} care` },  // Puppy care / Foal care / etc.
  { key: 'placement', colorVar: 'var(--phase-gohome)',    start: b => b.neonatalEnd,    end: b => b.placementEnd, occupied: true,
    labelFor: sp => 'Placement' },
];

function titleCase(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

/* ---------- State ---------- */
const TODAY = new Date();
TODAY.setHours(0,0,0,0);

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function daysBetween(a, b) { return Math.round((b - a) / (1000*60*60*24)); }
function isoDate(d) { return d.toISOString().slice(0,10); }
function formatDateForInput(d) {
  // Render as MM/DD/YYYY for the text input so US users see a familiar format
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}
function parseUserDate(raw) {
  // Accept many forms a user might type:
  //   MM/DD/YYYY, M/D/YYYY          (with slashes, US order)
  //   MM-DD-YYYY                    (with dashes, US order)
  //   YYYY-MM-DD                    (ISO)
  //   YYYYMMDD                      (8 digits, ISO order)
  //   MMDDYYYY                      (8 digits, US order — assumed if first two digits look like a month)
  // Return Date or null.
  if (!raw) return null;
  const trimmed = raw.trim();
  let m, y, mo, da;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed))) {
    y = +m[1]; mo = +m[2]; da = +m[3];
  } else if ((m = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(trimmed))) {
    mo = +m[1]; da = +m[2]; y = +m[3];
  } else if (/^\d{8}$/.test(trimmed)) {
    // 8 raw digits. Disambiguate ISO (YYYYMMDD) vs US (MMDDYYYY):
    //   If the first two digits could be a month (01-12), treat as MMDDYYYY.
    //   Otherwise assume YYYYMMDD.
    const first2 = +trimmed.slice(0, 2);
    if (first2 >= 1 && first2 <= 12) {
      mo = first2;
      da = +trimmed.slice(2, 4);
      y  = +trimmed.slice(4, 8);
    } else {
      y  = +trimmed.slice(0, 4);
      mo = +trimmed.slice(4, 6);
      da = +trimmed.slice(6, 8);
    }
  } else {
    return null;
  }
  if (y < 1900 || y > 2100) return null;
  if (mo < 1 || mo > 12) return null;
  if (da < 1 || da > 31) return null;
  const d = new Date(y, mo - 1, da);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
  return d;
}
function fmt(d) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtShort(d) { return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }

let nextDogId = 1;
const state = {
  dogs: [],
  selectedAvailabilityIdx: null,
};

function makeDog({ name = '', lastHeat = null, isExample = false, speciesCode = 'DOG' } = {}) {
  return { id: nextDogId++, name, lastHeat, isExample, speciesCode, selectedCycleIdx: 0 };
}

// Seed with one example animal — Luna the dog — with a pre-filled last heat.
// Three demo dogs, all relative to today so the seed stays fresh forever.
// Picked so that with everyone locked on cycle 1 the year reads "packed"
// (overlapping breeding/whelping windows = small availability windows =
// vet/clinic primary suggestion), and clicking through alternate cycle
// chips opens up dramatically larger green windows (full multi-pathway
// upsell + Roomongo). See picker chips for what each looks like.
state.dogs.push(makeDog({
  name: 'Luna',
  lastHeat: addDays(TODAY, -178),  // cycle 1 starts ~32 days from today (near-term)
  isExample: true,
  speciesCode: 'DOG',
}));
state.dogs.push(makeDog({
  name: 'Betsy',
  lastHeat: addDays(TODAY, -131),  // cycle 1 starts ~79 days from today (mid-term, whelps during Luna's puppy care)
  isExample: true,
  speciesCode: 'DOG',
}));
state.dogs.push(makeDog({
  name: 'Daisy',
  lastHeat: addDays(TODAY, -257),  // already overdue: cycle 1 is essentially imminent
  isExample: true,
  speciesCode: 'DOG',
}));

/* ---------- Projection ---------- */
function projectCycleStarts(dog) {
  const bio = speciesOf(dog).biology;
  const anchor = dog.lastHeat ? dog.lastHeat : TODAY;
  const startOffset = dog.lastHeat ? bio.cycleLenDays : 0;
  const starts = [];
  for (let i = 0; i < 3; i++) {
    starts.push(addDays(anchor, startOffset + i * bio.cycleLenDays));
  }
  return starts;
}

function dogMode(dog) { return dog.lastHeat ? 'anchored' : 'scenario'; }

function phaseInstancesForDog(dog) {
  const sp = speciesOf(dog);
  const bio = sp.biology;
  const cycleStart = projectCycleStarts(dog)[dog.selectedCycleIdx];
  return PHASES.map(p => ({
    key: p.key,
    label: p.labelFor(sp),
    color: p.colorVar,
    occupied: p.occupied,
    overlay: !!p.overlay,
    start: addDays(cycleStart, p.start(bio)),
    end: addDays(cycleStart, p.end(bio)),
  }));
}

/* ---------- Availability windows ---------- */
const PX_PER_DAY = 8;          // horizontal scale (bumped 33% from 6 for readability); chart scrolls when wider than viewport
const MIN_TIMELINE_DAYS = 90;  // small floor so an empty chart still has shape
const TRAILING_PAD_DAYS = 14;  // ~2 weeks of breathing room past the last milestone

function timelineRange() {
  // Start ALWAYS = today (no left-extension into the past — keeps "Today" at
  // the left edge as an anchor). End = furthest phase end across all dogs +
  // small trailing pad. No 12-month floor — we don't want huge stretches of
  // meaningless "available" space painted after the plan actually ends.
  let latestPhaseEnd = TODAY;
  let anyPhases = false;
  state.dogs.forEach(dog => {
    const phases = phaseInstancesForDog(dog);
    phases.forEach(ph => {
      anyPhases = true;
      if (ph.end > latestPhaseEnd) latestPhaseEnd = ph.end;
    });
  });
  const end = anyPhases
    ? addDays(latestPhaseEnd, TRAILING_PAD_DAYS)
    : addDays(TODAY, MIN_TIMELINE_DAYS);
  return { start: TODAY, end };
}

function computeAvailabilityWindows() {
  const { start, end } = timelineRange();
  const totalDays = daysBetween(start, end);
  // build occupied set per day across all dogs, and track the index of the
  // last day where ANY dog is in an occupied phase. We only render
  // availability runs that end on or before that index — there's no value in
  // painting "free time" after every plan on the chart is finished.
  const occupied = new Array(totalDays).fill(false);
  let lastOccupiedIdx = -1;
  state.dogs.forEach(dog => {
    const phases = phaseInstancesForDog(dog);
    phases.forEach(ph => {
      if (!ph.occupied) return;
      const a = Math.max(0, daysBetween(start, ph.start));
      const b = Math.min(totalDays - 1, daysBetween(start, ph.end));
      for (let i = a; i <= b; i++) occupied[i] = true;
      if (b > lastOccupiedIdx) lastOccupiedIdx = b;
    });
  });
  // Cap the availability search at the last occupied day. If no occupied
  // phases exist at all, don't render any availability bands.
  const searchEnd = lastOccupiedIdx;
  if (searchEnd < 0) return [];
  // contiguous available runs
  const runs = [];
  let runStart = -1;
  for (let i = 0; i <= searchEnd; i++) {
    if (!occupied[i] && runStart === -1) runStart = i;
    if ((occupied[i] || i === searchEnd) && runStart !== -1) {
      const runEnd = occupied[i] ? i - 1 : i;
      const length = runEnd - runStart + 1;
      if (length >= 5) {
        runs.push({
          start: addDays(start, runStart),
          end: addDays(start, runEnd),
          days: length,
        });
      }
      runStart = -1;
    }
  }
  return runs;
}

/* ---------- Rendering ---------- */
function render() {
  renderDogCards();
  renderPickerStrip();
  renderGantt();
  renderLegend();
  renderAvailabilityDetail();
  document.getElementById('add-dog-btn').disabled = state.dogs.length >= 3 && false; // always clickable; blocked by handler
}

const SPECIES_EMOJI = {
  DOG: '🐕',
  HORSE: '🐎',
  GOAT: '🐐',
  SHEEP: '🐑',
  CATTLE: '🐄',
};

function renderDogCards() {
  const root = document.getElementById('dog-cards');
  root.innerHTML = '';
  state.dogs.forEach((dog, idx) => {
    const mode = dogMode(dog);
    const sp = speciesOf(dog);
    const card = document.createElement('div');
    card.className = 'dog-card'
      + (dog.isExample ? ' example' : '')
      + (mode === 'scenario' ? ' needs-date' : '');
    card.innerHTML = `
      <div class="dog-card-header">
        <div class="species-badge">${SPECIES_EMOJI[sp.code] || '🐾'}</div>
        <div class="header-title">
          <div class="header-eyebrow">${escapeHtml(sp.label)} ${idx + 1}</div>
          <div
            class="header-name"
            contenteditable="true"
            spellcheck="false"
            data-dog="${dog.id}"
            data-field="name"
            data-placeholder="(unnamed ${escapeHtml(sp.adjective)})"
          >${escapeHtml(dog.name)}</div>
        </div>
        ${dog.isExample ? `<span class="example-pill">Example</span>` : ''}
      </div>
      <div class="dog-card-body">
        <div class="row">
          <label class="lbl">Species</label>
          <select data-dog="${dog.id}" data-field="species">
            ${SPECIES_ORDER.map(code => `
              <option value="${code}" ${dog.speciesCode === code ? 'selected' : ''}>${SPECIES[code].label}</option>
            `).join('')}
          </select>
        </div>
        <div class="row">
          <label class="lbl">
            Approximate last heat start <span class="lbl-required">*</span>
            <span class="lbl-hint">(MM/DD/YYYY)</span>
          </label>
          <div class="date-clear-row">
            <input type="text" inputmode="numeric" autocomplete="off"
                   data-dog="${dog.id}" data-field="lastHeat"
                   value="${dog.lastHeat ? formatDateForInput(dog.lastHeat) : ''}"
                   placeholder="MM/DD/YYYY" />
            ${dog.lastHeat ? `<button class="clear-btn" data-action="clear-date" data-dog="${dog.id}">Clear</button>` : ''}
          </div>
          <div class="mode-indicator ${mode}">
            ${mode === 'anchored'
              ? `Projecting from your last heat date`
              : `Add a last heat date to see ${escapeHtml(dog.name || 'your animal')}'s projection`}
          </div>
          ${sp.seasonal ? `<div class="seasonal-note">${sp.seasonalNote}</div>` : ''}
          ${sp.breedNote ? `<div class="breed-note">${sp.breedNote}</div>` : ''}
        </div>
        ${state.dogs.length > 1 ? `
          <div class="card-actions">
            <button class="delete-link" data-action="remove" data-dog="${dog.id}">Remove this ${sp.adjective}</button>
          </div>` : ''}
      </div>
    `;
    root.appendChild(card);
  });
}

function renderPickerStrip() {
  const root = document.getElementById('picker-strip');
  root.innerHTML = '';
  if (!state.dogs.length) {
    root.innerHTML = '<div style="color:var(--muted); font-size:13px;">Add an animal to see projected cycles.</div>';
    return;
  }
  // Section header — Step 2 introduces the cycle picker.
  // Step 3 (availability + suggestions) lives inside the availability card below.
  const multi = state.dogs.length > 1;
  const header = document.createElement('div');
  header.className = 'picker-section-header';
  header.innerHTML = `
    <div class="picker-section-title">
      <span class="picker-section-eyebrow">Step 2 · Pick a Cycle</span>
      <div class="picker-section-heading">Which heat cycles will you breed?</div>
    </div>
    <p class="picker-section-help">
      ${multi
        ? `Tap a date below to lock in which cycle each animal will breed on. The chart updates instantly. Try a different cycle to see how your year changes.`
        : `Tap a date below to lock in which cycle to breed on. The chart updates instantly. Try cycle 2 or 3 to see how it shifts your year.`}
    </p>
  `;
  root.appendChild(header);

  state.dogs.forEach((dog, dogIdx) => {
    const mode = dogMode(dog);
    const starts = projectCycleStarts(dog);
    const canMoveUp = dogIdx > 0;
    const canMoveDown = dogIdx < state.dogs.length - 1;
    const row = document.createElement('div');
    row.className = 'picker-row';
    row.innerHTML = `
      <div class="picker-row-reorder">
        <button
          class="reorder-btn"
          data-action="move-up"
          data-dog="${dog.id}"
          ${canMoveUp ? '' : 'disabled'}
          title="Move ${escapeHtml(dog.name || 'this animal')} up"
          aria-label="Move up"
        >▲</button>
        <button
          class="reorder-btn"
          data-action="move-down"
          data-dog="${dog.id}"
          ${canMoveDown ? '' : 'disabled'}
          title="Move ${escapeHtml(dog.name || 'this animal')} down"
          aria-label="Move down"
        >▼</button>
      </div>
      <div class="picker-row-heading">
        <input
          class="picker-row-name"
          type="text"
          data-dog="${dog.id}"
          data-field="name"
          value="${escapeHtml(dog.name)}"
          placeholder="Name"
          aria-label="Animal name"
          size="${Math.max(4, (dog.name || 'name').length)}"
        />
        <span class="mode-tag ${mode}">${mode === 'anchored' ? 'Projected heats' : 'Average planning scenario'}</span>
      </div>
      <div class="chips">
        ${starts.map((s, i) => `
          <button class="chip ${dog.selectedCycleIdx === i ? 'selected' : ''}"
                  data-dog="${dog.id}" data-cycle="${i}"
                  title="Lock ${escapeHtml(dog.name || 'this animal')} to breed on ${fmt(s)}">
            <span class="chip-dot">${dog.selectedCycleIdx === i ? '●' : '○'}</span>${fmt(s)}
          </button>
        `).join('')}
      </div>
      <span class="picker-row-hint">↓ tap to switch</span>
    `;
    root.appendChild(row);
  });
}

function renderGantt() {
  const root = document.getElementById('gantt');
  const labelsCol = document.getElementById('lane-labels-col');
  root.innerHTML = '';
  labelsCol.innerHTML = '';
  const { start, end } = timelineRange();
  const totalDays = daysBetween(start, end);
  const dayToPct = d => (daysBetween(start, d) / totalDays) * 100;
  // Width the inner chart to (days * pxPerDay) so it overflows .gantt-scroll
  // horizontally and produces the internal scrollbar. The label column lives
  // OUTSIDE this scroll viewport now, so we no longer reserve space for it
  // inside the chart's min-width.
  const trackWidthPx = totalDays * PX_PER_DAY;
  root.style.minWidth = trackWidthPx + 'px';

  // Header spacer in the fixed labels column (matches the gantt-header height
  // inside the scroller so lane rows line up).
  const headerSpacer = document.createElement('div');
  headerSpacer.className = 'header-spacer';
  labelsCol.appendChild(headerSpacer);

  // Months row — lives inside the scrolling chart only.
  const header = document.createElement('div');
  header.className = 'gantt-header';
  root.appendChild(header);
  let m = new Date(start.getFullYear(), start.getMonth(), 1);
  while (m < end) {
    const pct = dayToPct(m);
    if (pct >= 0 && pct <= 100) {
      const tick = document.createElement('div');
      tick.className = 'month-tick';
      tick.style.left = pct + '%';
      tick.textContent = m.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      header.appendChild(tick);
    }
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1);
  }

  // Container that holds both the availability overlay (painted behind) and
  // the lane rows (painted on top). This lives inside .gantt-scroll.
  const lanesWrap = document.createElement('div');
  lanesWrap.style.position = 'relative';
  root.appendChild(lanesWrap);

  // Availability overlay — inserted FIRST so it paints behind the lanes.
  // Phase bars use z-index: 2 (see CSS) so they sit on top of the band.
  // Since the chart no longer has an inner label column, the overlay spans
  // the entire chart width (left: 0).
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.bottom = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.pointerEvents = 'none';
  overlay.style.zIndex = '0';
  lanesWrap.appendChild(overlay);

  state.dogs.forEach(dog => {
    const mode = dogMode(dog);

    // Lane label (fixed column, outside the scroll viewport)
    const labelRow = document.createElement('div');
    labelRow.className = 'lane-label-row';
    labelRow.innerHTML = `
      ${escapeHtml(dog.name || `(unnamed ${speciesOf(dog).adjective})`)}
      <span class="lane-mode ${mode}">${mode === 'anchored' ? 'Anchored' : 'Scenario'}</span>
    `;
    labelsCol.appendChild(labelRow);

    // Lane track + risk-wing annotation strip directly beneath it.
    // The wings live in their own row so they never overlap the colored
    // phase bars in the main track.
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.style.zIndex = '1';
    lane.innerHTML = `
      <div class="lane-track" data-dog="${dog.id}"></div>
      <div class="lane-risk-strip" data-dog="${dog.id}"></div>
    `;
    lanesWrap.appendChild(lane);
    const track = lane.querySelector('.lane-track');
    const riskStrip = lane.querySelector('.lane-risk-strip');
    track.style.background = 'transparent';
    const phases = phaseInstancesForDog(dog);

    // LOCKED FEATURE GHOST — risk wings.
    // In the paid BHQ planner, these wings are computed from the breeder's
    // actual recorded cycle history (IQR + MAD on observed intervals) and
    // show where heat could plausibly shift earlier/later. In this free
    // tool we don't have history, so we render a *faint silhouette* of
    // where the wings would be — sized as ~12% of the cycle length on
    // either side of the pre-heat phase — with a lock icon and tooltip
    // explaining that BreederHQ unlocks this.
    const sp = speciesOf(dog);
    const preheatPhase = phases.find(p => p.key === 'preheat');
    if (preheatPhase) {
      const cycleDays = sp.biology.cycleLenDays;
      const wingDays = Math.max(3, Math.round(cycleDays * 0.12));
      const earlyStart = addDays(preheatPhase.start, -wingDays);
      const earlyEnd = preheatPhase.start;
      const lateStart = preheatPhase.end;
      const lateEnd = addDays(preheatPhase.end, wingDays);
      [
        { start: earlyStart, end: earlyEnd, side: 'early', label: null },
        { start: lateStart, end: lateEnd, side: 'late', label: 'Could be later' },
      ].forEach(wing => {
        const wStartPct = dayToPct(wing.start);
        const wWidthPct = dayToPct(wing.end) - wStartPct;
        if (wWidthPct <= 0 || wStartPct > 100 || wStartPct + wWidthPct < 0) return;
        const ghost = document.createElement('div');
        ghost.className = 'risk-wing-ghost';
        ghost.style.left = Math.max(0, wStartPct) + '%';
        ghost.style.width = Math.min(100 - Math.max(0, wStartPct), wWidthPct) + '%';
        ghost.title = wing.side === 'early'
          ? `Earlier-than-typical heat window (${wingDays} days). BreederHQ unlocks accurate variability ranges with your animal's recorded cycle history.`
          : `Later-than-typical heat window (${wingDays} days). BreederHQ unlocks accurate variability ranges with your animal's recorded cycle history.`;
        if (wing.label) {
          const lock = document.createElement('span');
          lock.className = 'risk-wing-lock';
          lock.innerHTML = `🔒 ${wing.label}`;
          ghost.appendChild(lock);
        }
        riskStrip.appendChild(ghost);
      });
    }

    // Sort non-overlay phases first so overlays paint last (on top in DOM order
    // as well as via their higher z-index).
    const ordered = [...phases].sort((a, b) => Number(a.overlay) - Number(b.overlay));
    ordered.forEach(ph => {
      const startPct = dayToPct(ph.start);
      const widthPct = dayToPct(ph.end) - startPct;
      if (widthPct <= 0 || startPct > 100 || startPct + widthPct < 0) return;
      const bar = document.createElement('div');
      bar.className = 'phase-bar' + (ph.overlay ? ' is-overlay' : '');
      bar.title = `${ph.label}: ${fmtShort(ph.start)} – ${fmtShort(ph.end)}`;
      bar.style.left = Math.max(0, startPct) + '%';
      bar.style.width = Math.min(100 - Math.max(0, startPct), widthPct) + '%';
      bar.style.background = ph.color;
      track.appendChild(bar);
    });
  });

  // Compute & render availability bands inside the overlay (behind the lanes).
  const windows = computeAvailabilityWindows();

  // Resolve which window is currently "selected" (highlighted on chart +
  // detailed in the panel below). If the breeder hasn't picked one, default
  // to the LONGEST — same logic as renderAvailabilityDetail.
  let selectedIdx = state.selectedAvailabilityIdx;
  if (windows.length && (selectedIdx === null || !windows[selectedIdx])) {
    let longest = 0;
    windows.forEach((w, i) => { if (w.days > windows[longest].days) longest = i; });
    selectedIdx = longest;
  }

  windows.forEach((w, i) => {
    const startPct = dayToPct(w.start);
    const widthPct = dayToPct(w.end) - startPct;
    if (widthPct <= 0) return;
    const band = document.createElement('div');
    band.className = 'availability-band' + (i === selectedIdx ? ' is-selected' : '');
    band.style.left = startPct + '%';
    band.style.width = widthPct + '%';
    band.style.pointerEvents = 'auto';
    band.title = `Availability: ${fmt(w.start)} – ${fmt(w.end)} (${w.days} days open). Click to view options.`;
    band.dataset.windowIdx = i;
    const label = document.createElement('div');
    label.className = 'availability-label';
    label.textContent = `${w.days}d open`;
    band.appendChild(label);
    overlay.appendChild(band);
  });

  // today line
  const todayPct = dayToPct(TODAY);
  if (todayPct >= 0 && todayPct <= 100) {
    const tline = document.createElement('div');
    tline.className = 'today-line';
    tline.style.left = todayPct + '%';
    const tlabel = document.createElement('div');
    tlabel.className = 'today-label';
    tlabel.style.left = todayPct + '%';
    tlabel.textContent = 'Today';
    overlay.appendChild(tline);
    overlay.appendChild(tlabel);
  }
}

function renderLegend() {
  const root = document.getElementById('legend');
  if (!root) return;
  // Distinct species currently on the chart; preserve SPECIES_ORDER ordering.
  const activeSpecies = SPECIES_ORDER.filter(code =>
    state.dogs.some(d => d.speciesCode === code)
  ).map(code => SPECIES[code]);
  // Default to dog if no animals yet
  const speciesForLabels = activeSpecies.length ? activeSpecies : [SPECIES.DOG];
  // For multi-species: collect distinct phase labels (so we don't repeat "Pre-heat")
  const seen = new Set();
  const items = [];
  PHASES.forEach(p => {
    speciesForLabels.forEach(sp => {
      const label = p.labelFor(sp);
      const key = `${p.colorVar}|${label}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ color: p.colorVar, label });
    });
  });
  items.push({
    color: 'var(--green-band)',
    label: 'Availability',
    border: '1px dashed var(--green-band-border)',
  });
  root.innerHTML = items.map(it => `
    <div class="legend-item">
      <span class="legend-swatch" style="background: ${it.color}${it.border ? '; border: ' + it.border : ''}"></span>${escapeHtml(it.label)}
    </div>
  `).join('');
}

/* ---------- Suggestion card builders (one per kind) ---------- */
// Each returns the HTML for one card. The renderer composes them in a tier-
// specific order so the most appropriate recommendation lands first.

function suggestionPlanBreeding() {
  return `
    <a class="suggestion-bhq" href="https://breederhq.com/founders" target="_blank" rel="noopener">
      <div class="sb-icon">🧬</div>
      <div class="sb-body">
        <div class="sb-eyebrow">Breed smarter</div>
        <div class="sb-title">Plan another breeding for an existing animal</div>
        <div class="sb-sub">BreederHQ tracks and predicts every cycle, uses genetics to help you avoid costly mistakes and pick the best pairs for the outcomes you want in your offspring. It manages your waitlist and sales pipeline, sends contracts and invoices automatically, and helps you match the right puppies to the right buyers. The dates on this chart are guesses. The plan in BreederHQ is your business.</div>
      </div>
      <div class="sb-arrow">→</div>
    </a>
  `;
}

// Build the "grow your program" card. The set of pathways shown depends on
// whether the breeder's window is large enough to bring a NEW dog fully home
// (Marketplace, ≥120 days) or only large enough for SHARED arrangements that
// don't add daily kennel work (Guardian + Co-Ownership, 60-119 days).
function suggestionAddBreedingFemale(w, opts) {
  const showMarketplace = (opts && opts.showMarketplace) !== false;
  const headline = showMarketplace
    ? `${w.days} days is a lot of open time. Add another breeding female?`
    : `${w.days} days clear. Want more genetics without more daily work?`;
  const sub = showMarketplace
    ? `If your year has this much room, you have capacity for more genetics, and BreederHQ has three real ways to add a female without doubling your kennel work.`
    : `You don't have room for a full new animal at home, but you do have room for shared genetics. Guardian homes and co-ownership both put a breeding female in the field without her living with you full time.`;

  const marketplaceRow = !showMarketplace ? '' : `
        <a class="sb-pathway" href="https://marketplace.breederhq.com" target="_blank" rel="noopener">
          <div class="sb-pathway-icon">🛒</div>
          <div class="sb-pathway-body">
            <div class="sb-pathway-title">BreederHQ Marketplace</div>
            <div class="sb-pathway-sub">Browse vetted breeding females from breeders you can trust. Health-tested, pedigreed, ready to go.</div>
          </div>
        </a>`;

  return `
    <div class="suggestion-bhq-multi">
      <a class="suggestion-bhq suggestion-bhq-header" href="https://breederhq.com/founders" target="_blank" rel="noopener">
        <div class="sb-icon">🐾</div>
        <div class="sb-body">
          <div class="sb-eyebrow">Grow your program</div>
          <div class="sb-title">${headline}</div>
          <div class="sb-sub">${sub}</div>
        </div>
        <div class="sb-arrow">→</div>
      </a>
      <div class="sb-pathways">
        ${marketplaceRow}
        <div class="sb-pathway sb-pathway-split">
          <div class="sb-pathway-icon">🏡</div>
          <div class="sb-pathway-body">
            <div class="sb-pathway-title">Guardian Home Placement</div>
            <div class="sb-pathway-sub">Keep the genetics, share the work. BreederHQ helps you find and manage families who raise your breeding female as their own pet.</div>
          </div>
          <div class="sb-pathway-actions">
            <a class="sb-pathway-btn sb-pathway-btn-primary" href="https://breederhq.com/founders" target="_blank" rel="noopener">List a Guardian</a>
            <a class="sb-pathway-btn" href="https://marketplace.breederhq.com" target="_blank" rel="noopener">Find a Guardian</a>
          </div>
        </div>
        <div class="sb-pathway sb-pathway-split">
          <div class="sb-pathway-icon">🤝</div>
          <div class="sb-pathway-body">
            <div class="sb-pathway-title">Co-Ownership &amp; Partnerships</div>
            <div class="sb-pathway-sub">Partner with another breeder on a shared female. Contracts, schedules, and litter splits, all tracked in one place.</div>
          </div>
          <div class="sb-pathway-actions">
            <a class="sb-pathway-btn sb-pathway-btn-primary" href="https://breederhq.com/founders" target="_blank" rel="noopener">List a Partnership</a>
            <a class="sb-pathway-btn" href="https://marketplace.breederhq.com" target="_blank" rel="noopener">Find a Partner</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function suggestionVetClinic(w) {
  // At smaller window sizes this card is the primary recommendation, so the
  // eyebrow and sub-copy shift to match.
  const primary = w.days < 60;
  return `
    <div class="suggestion">
      <div class="s-icon">📅</div>
      <div class="s-body">
        <div class="s-eyebrow">${primary ? 'A great fit for this window' : 'Or something simpler'}</div>
        <div class="s-title">Schedule vet visits, training, or a clinic</div>
        <div class="s-sub">Use this window for things that need uninterrupted time. Health clearances, handler clinics, hip/elbow rechecks, a long-overdue dental cleaning. The kind of stuff that's hard to fit around a litter.</div>
      </div>
    </div>
  `;
}

/* ---------- Tier-aware suggestion stack ---------- */
// Window size determines what's biologically and commercially honest to
// recommend. We reorder (and gate) the suggestion cards based on tier so
// breeders with 200 free days see "add a female" and breeders with 30
// don't get bad advice.
function tierFor(days) {
  if (days >= 120) return 'large';   // big enough for a whole new program member
  if (days >= 60)  return 'medium';  // one more breeding plan fits
  if (days >= 30)  return 'small';   // clinics, training, vet, trip
  return 'tiny';                     // long weekend at best
}

function suggestionStackFor(w) {
  const tier = tierFor(w.days);
  const pieces = [];
  switch (tier) {
    case 'large':
      // Full upsell: plan a breeding, add a female (all 3 pathways including
      // bringing a new dog fully home from the Marketplace), trip, clinic.
      pieces.push(suggestionPlanBreeding());
      pieces.push(suggestionAddBreedingFemale(w, { showMarketplace: true }));
      if (SHOW_ROOMONGO) pieces.push(renderRoomongoCard(w));
      pieces.push(suggestionVetClinic(w));
      break;
    case 'medium':
      // Not enough room for a full new dog at home (Marketplace), but plenty
      // of room for SHARED arrangements (Guardian + Co-Ownership) where the
      // female doesn't live with the breeder full time.
      pieces.push(suggestionPlanBreeding());
      pieces.push(suggestionAddBreedingFemale(w, { showMarketplace: false }));
      if (SHOW_ROOMONGO) pieces.push(renderRoomongoCard(w));
      pieces.push(suggestionVetClinic(w));
      break;
    case 'small':
      // Vet/clinic gets promoted to first position; trip second; planning
      // a breeding stays available but de-emphasized.
      pieces.push(suggestionVetClinic(w));
      if (SHOW_ROOMONGO) pieces.push(renderRoomongoCard(w));
      pieces.push(suggestionPlanBreeding());
      break;
    case 'tiny':
      // No room for anything kennel-related. Just rest and a vet visit.
      pieces.push(suggestionVetClinic(w));
      if (SHOW_ROOMONGO) pieces.push(renderRoomongoCard(w));
      break;
  }
  return pieces.join('');
}

function renderAvailabilityDetail() {
  const root = document.getElementById('availability-detail');
  root.innerHTML = '';
  const windows = computeAvailabilityWindows();
  if (!windows.length) return;
  let idx = state.selectedAvailabilityIdx;
  if (idx === null || !windows[idx]) {
    let longest = 0;
    windows.forEach((w, i) => { if (w.days > windows[longest].days) longest = i; });
    idx = longest;
  }
  const w = windows[idx];
  if (!w) return;
  root.innerHTML = `
    <div class="step-header step-header-with-finding">
      <span class="step-eyebrow">Step 3 · Plan Your Free Time</span>
      <div class="step-heading">Where can you breathe?</div>
      <h3>Availability: ${fmt(w.start)} ${'\u2013'} ${fmt(w.end)}</h3>
      <div class="dates">${w.days} days open across all your animals</div>
    </div>
    <div class="availability-detail">
      ${suggestionStackFor(w)}
    </div>
  `;
}

/* ---------- Roomongo partner card (demo / mockup) ---------- */
// Feature flag — flip to true once the Roomongo partnership is formalized.
// All Roomongo cards (and the associated copy beats) are hidden when false.
// Implementation is preserved below so we can switch it back on without rework.
const SHOW_ROOMONGO = false;
// Placeholder inventory. In the real integration this is either:
//   Phase 1: deep-link to roomongo.com/search?checkin=...&checkout=...
//   Phase 2: live pull from Roomongo API filtered to the window dates
// All UTM params and link format must be confirmed with Patrick before launch.
const ROOMONGO_DEMO_DESTINATIONS = [
  {
    name: 'Tulum Beachfront Casita',
    region: 'Tulum, Mexico',
    fromNightly: 189,
    // Free Unsplash imagery used for demo only. Real integration uses
    // Roomongo's CDN-served property images.
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=70',
  },
  {
    name: 'Riviera Maya All-Inclusive',
    region: 'Playa del Carmen, Mexico',
    fromNightly: 245,
    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=70',
  },
  {
    name: 'Cozumel Ocean-View Suite',
    region: 'Cozumel, Mexico',
    fromNightly: 156,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=70',
  },
];

function roomongoSearchUrl(window) {
  const params = new URLSearchParams({
    checkin: isoDate(window.start),
    checkout: isoDate(window.end),
    utm_source: 'breederhq',
    utm_medium: 'planner',
    utm_campaign: 'availability-window',
    utm_content: `${window.days}d`,
  });
  return `https://roomongo.com/search?${params.toString()}`;
}

function renderRoomongoCard(window) {
  const url = roomongoSearchUrl(window);
  return `
    <div class="roomongo-card">
      <div class="roomongo-header">
        <div class="roomongo-brand">
          <img class="roomongo-logo-img" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAxAAAADnCAYAAACOhrDBAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA3XAAAN1wFCKJt4AAAAB3RJTUUH6QYKEyIh6Nm+eQAAIABJREFUeNrsnXl83UXV/99n7k3SvaVQoFAUeIpt7k0LWhYBF3ADQZEtBUXBBRAXVATZm0w3ATcUxAcBERURCKCICy4I/FhEoFDa3KQslgJlp0Bb2jTLnfP7Iy0PS5Nmud+53yTn/XrBC27u/S5nZs7MZ+bMGTAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzAMwzBShrzxf3bxOq647s2fxWbxf1lFgxStaAzDMAzDMAwjxQKiul7vEtgrhc8YEFa+6ROlFVgrwhqgTZWVCh3S+b02lBUirCCwIjhWAC85eEnaWfFaBS8u87LOit4wDMMwDMMw+iEgcl7bUCqGyHuvAp4ToaBwvwQW4Lir4OU1qxKGYRiGYRiG0RMBUacBKW/4UplpE+HfGvibOBoKXh6z6mEYhmEYhmEYGxMQXl1OsX0Hb+ZelCuza7l80Q9kjZnDMAzDMAzDMNYLiBnHa0XLRNrMHBsxkPCiBs5vc1z0mJdVZhHDMAzDMAxjyAuISSfp8DFjWGvm6JZXRTl3jeMntgnbMAzDMAzDGKo4gLFjyZgpNsk4Fc4drvpQ3uv7zByGYRiGYRjGkBUQLS0mIHqKIO/SwP/L1evPp5+iI80ihmEYhmEYxpATEJWOrJmidyoCOL59hN6R9/oOM4hhGIZhGIYxtAREla1A9ElHiLxbQ1iYr9N9zRqGYRiGYRjGkBEQrdgKRN9VhNtMhX9W1+nnzBiGYRiGYRjGkBAQFe22AtFfO4pwRb5OjzFTGIZhGIZhGINeQHRUmIAohS2D6OXVXg8wUxiGYRiGYRiDWkBkLISpJAjiRPX3NV73MmsYhmEYhmEYg1ZAdHTYCkQJZURlUcONea9bmy0MwzAMwzCMQSkgMmIrECWVELgtgur11KoJM8MwDMMwDGPwCQiXsRWI0osI2StXzalmCcMwDMMwDGNwjXOB3Cx9N44HzBylRjsyItMWe1litjAMwzAMwzCSZu3sdzyHyFbdD1EprNPMx4e54pMAqvqfkfVPvvetX3vqpEnDxo/LvCTCSJQVI+qf2ALWr0CIbaJOSp9li4Gfmh0MwzAMwzCMmCjapmhbV/+/irDq9RGryB4r/LbbvvUaY8dm9hVhJIAKr2z43AEEC2FKUEPw4RqvHzNDGIZhGIZhGEnT2pbZ/dXQNmJk3ZNVa9fxzg2fNy9/cuTIuiermpY/UdGiFXuuYcTaN/5umGS+9NZrZRxf+r8hra59k4BwtgKRKEF1rlnBMAzDMAzDSJrN5j/+5Db+2Zau/r7rJXRs7h9b3fJMk67/6GWFtYKc8OiJkys3fO9lv+N2KAejPAuAom8SEMWirUAki+xe7fUDZgfDMAzDMAwjXagDrkeYOHHz9sM2fFopHSeIkEH401t/0ZnG1UKYEscpXzErGIZhGIZhGOnSD0hHKF4IIKInQufmaQfHqdLSEeQXb/1JFjo3UWucR1wLPJfIlYWxKBlgXBrLJiifmnKqjn74e7LaaqphGIZhbIS7a4czqmIYANOvesUMYhhxGOuX37dm9jvvFpG9VvrtZmSFPCITUL2Yjo4VVGbfLiBCINOZ0DVhhFuavByU5C0mnaTDx4xiR5dhBw3sFIQPibAv2rmDvFyIMDw7jEOBX6Wu1nh11W1sRSUTgfEAxbbWCrR1i1BcNzposSIUW4cBiMsG5ypXioRX1Q1rG1YxbmVReX0Xf7bI8sbvyvNDvSFOOkmHbzaWd4bAxOAYHorrxlMsbq7aNjJoe6UW2ysAJFPRriIvZ0PVy8WsrKyqGP18sUhLRYY1rbBq2Gu0LPqBrBmKNsx7HTUB1t3mpaO/15rudVI77CqwCzCewPigxQkiYZwqY8CNFpGAsBLVFSKZ50V4NMD9FXD/Ii/Ly22PyWfohKoqpmkgj1ADjA9aHI2GUcAogcr1ziYAKi7TriotIryosFygMRR5aMkS7qVBikOmIjUfsjnt2RqEyQiTgckVQbdAZDNRHSNChWhnDxhEgqBrgvCSwooO3IvAcxCeQHmSIE/w8ov/Zd/bOoZUY2w6dCJUTGRt+C+7NqwsyfWKbk9wU5FQI8j/OA0TFdkiCMOhvfN7hdqiBF2hIs+hugQnBeBO4E7yDW2DycRaS4apuemI7IroJOAdwKSgbkIxuIyKOFWRziauKqrBudACvJARfQLRp0EXgntAfOE5jNKUy6lTRlOV6fQdjp1QtmsPmfEaZKyKjCoWJat0losTLYrT4AgrMqIvZZy+hPAK6HKKFMisbRa/bF2q31fDj0XcXhlx3wCqAUK7/GTjQ3ogX6efVOGPEQTETUkLiC4GIpUE9lbhSBGOUGVseVQE1zd5ObzcYiFfZEbIsLcoe4K+V1W2FSlhGJvoapAlotyFcGtLC7cvPU9WDkrvUquZ/FRqEN6nwl6qWg26g4gr9UrYMoRbNXBrsci/HpkvT6dssH8QkEOpVmECsAXK5t20hVbpXJHcuBODLVG2A1YhXNoEp+Il9Kae54rsTYZaDRwqwrb9bLvPoFwtwm8KXhbGsuvUWTotk+EQVQ6hU/yUghdUuNHBrwte7hx8g93DdkJlf4LbI0PYsyiyY0nduLJGhf+A3oXI3YwYeRs7XJGuQUHh8E8RpAakGqdbomwFjOqyuQmvdj2iYCKwzfr/awWpp+ba83r9TI0z90bCwVnlgA4k17/myBqFvyH8jpX8mb0aWgbk4NRP2YaQ+TSiH0NkT5TRpRkEynPi+DOEG8D9U3yh12JL63JnIHoo4mT9RVcC4Q2FICDjUBW6i/wQaQdeBl5GWYGER4HHwP1dfOHl9JXJtKlQ3Adlj6Cyt0Mnd75rCa4NQZCloPeg/Iui/kvmNz+R9Du9eOY7th45TJ4FaFr+RMWul/D6BEjB5yp2cGvaFF01su7JsfcfT7Z623csRWRbAYfqX0bUP3ngKr/NTllX8QjoohF1T+78uoCo9nqwKL8frALiLQOd8ShzFU5g/R6QiLzUJGzVq4FQCdjHa/ZF+Mj6QchBwNaRJW27ivwNocHBDQUvrw3k8ckUr9u4wKdEOAjYCxgT154ojjsFrnTraFh8rpR9mT9Xr+0kmM3NCYc1ermhR3U9cJQKZwOTEyqAJkR+2FTgV0nM5E86SYePHstRBP2WiOQT9snNBL7f1MyvB/SqxKLaGYgc5giHBJGpke++GuEvoNfTMfwv7Pybsq8YSuPh7Yok0h5FQR158g1Nm/zygwePoyL7eVE5XqVzNrPUZNBVReTHCD8h3/By2quq+n2yhBdrkfB5xH0Y1UT3oKrKanHhaoruIplbeKhHv5mV3xunyU4uiB4ovvkv6SiTfI6gtUHckY4Q1X8oLBW4mqK7XOY1/jeJe7zqt39npdNlAK+FtaO29C++7qNePm3HMcNGFleqavv39ckq79HXZr9zruvsQykGOXi0X3bjK7O2n15VoQ+p8ujI+ife9bqAqPF6aFCuHwoCYgM1Xj8WlN8CW8S8rxN2bvSyKMa9qs/UiS7LsSocD0xKhfcUXaPIVVrk50vmyoKBNEbJe91dle+IcIhqWhIPaBvIlUE4b4mXR8omIOo0lGqWZuOug8sKs+W4bsuncyX1R8kJh7c6/vBIRtwZjZ7fdw6r+sdkr2MqlZNRPRGRzSIXYRPKN5rmyC0DpkEWasejclyGcGwRmZySp2pFuJbgzmHaNc1le4rG2rChf0+oRc6j5tpZXf75/uMrqHr1K4jWQTcrkaXsW4OuDRnmMWLU+albEeocpFZCOBrkdJT/KU//yx0gPxBf6DbiROuqv4LIz5I1iB4qc5p/X7byOHFyFZtVzOwg+62sFN9T/gqCqsrtIuFi3FbXiy9dmOSrs965S2UFDwK0hI5Jm/unX49geNnvuN2Gk6g3iIsNYgHVlS+o22p7v6x1tZ/0/ozL/D/gpRF1T0x4XUDk6/QwFa4bSgICoPps3clluVW1n+ENvTGB8IWClysSHui+A2WWCsegVKR2ACDcKvC9gpeb0zxOmTpL9xSHF0jzgYABuCEE5iyZK4tj3ngfr9kXdEPQcmKzNLc1z5Z9uxLKUsEFwOHlqseunWMa58tTfRIOJ2pVxeZ8RVRngYwvZweG8HMRvpPqVcJC7Xjg2045McRe/es5HQjXI24euWsao9751n2yTJjQnnCd/z35hkM3Ll5m7gt6MfCuchg+gz5ZVI5h2nW3pUY81OU/iegFwPYp6XvvADlFfOHeLgTEdxD5XrJGkc/InMLvopfF6dM2oyp8OyBfdYTxaXQeqvK4wDk4ftWX8LNYOIYwzfPkUYocIUK8pfsEZx6mna6b5er1JwqPKBybavHQaYt9Vflrrl7vyHvdPW2Pt4vXcXmvlznhrpSLhw1t+fBMhgdz9fqLKV63iXXjZREOohTZeBKE6jr9qGR1cdnEw/p6XKzQxbk6re3tT2u87lU5nkZRzi+reOgcVAhwgqreN+VsnZK6Gv7gweNorJ2dUX0C5awUiweALMoRaFhI4fBf8NCh8VaAt98++YNhAxPf9tmjH6+icPj3Qf9ZLvEAUETeIfAvGmeex637lPWQXD3rXdtqffX1iP4xNeKh02e9n6D3qM9fpqdM34hvlVUReqyqqK/sJ49Rn68LVfok6NlpFQ+d/Z3ugOglGliqvvpY9ekcqw9pAQFQmCt3ofwwXrtNxrFWez2yWKVLgG+gcRtmCXifBu6p9nrFtNN1szQ8ULXXg9tUm1X5UpKhOaWfuSADfDGjPJqr0zOo1cRDrUbGOMle3yryVXJezxTRmxHZvNx2F5WxCNfm6/V80E3Wl8knalW113OD6h1ECrnqxdtMzWT0/lydfjglgx1h8cwvZrLZpUBdERk1YDybkkHli+Iyj7B4pqdQW5n4PdeuSb49urdMTjUdOpF1o+5G5ZQ0jCtUREBPzW6+xZ9ZctDosjyDrz5YMxUFkEPTOUpFUP0So4oLdFbu3W95+hciWGhYpDGXqK8+NuiwJ1Cd7QgDxn+I6LaoXBqK+Xt11tQZJiDS2ZDmAi/EqRClXYGY7nXL6nq9SZTfgWw5gMtARDmmWKVNNV4/Ua7HmOJ1m+q6cENnUgHZegDX6hEI362u5o6aszXReFu3LvmVLoXXY5pnHK8V1Z5foswHSZUPU/hWzvO/eHXdtNlJleO5W5TT0vb8b2iQoxD9S7XXA8r6GIsPm55pPPwuRH9RjL8vpIQDWoYjWo9yL41H7JzozYoVFREq+v9NTBRqJxMydyK8J21273DyMddRdQfNh0SbZNDjZ1Soz/2AIDeI6Nj0V06dQoZ/a13uC//n1DPJp2IPmvhEp/rqmuKs/F2oXOoI4waq/3BOZ6i4+9RX/1T9jBHpEhBu4MywJkHBy2sIv4jTVtmuVNfK1+m+HaoPCXxi8JSGbB0Cf8zX60WTTtLhMe9c7fWAjGpBRA4ZNNYU9gwZXZT3+vmk7tEiEUKY1guIvNdRLdtwkyjHpLdD5ss5uGxjIqLa63s7AvdD+gZbG7F6paj+PjdL318GGwqLZ54iIguKInsOou5mZwj3Ujj8DDShfrejPV7YzqLDpqLcAeyYVoMH2Dnb4W5h0WcSF6Dq86PYpuWvKCcPpJVrlCqEy9XnvIJAMcImdDcsuddB1OdPV3UPZpwOCv8hgqDyNQ0tD6rP75KGZ7IViA2G6OA3kRrqhBle+60gc17PVNF/DvBZ8q5Gi6Lw1TFjuDfvNfnwDq8uV6+zJeifQMYNvtotI1T5Za5efz75xNLP+mSqoqxAdKxvN39C2W8AdMhfqIYz39Rm67RWVG9H2GoA1Z1KnP4x6p6IhbXbUqj9F6LfTyoVaZmpROW7FGr/msigdkQmzt63RZ/ZDOf+SOy04H3RVOJ2Fmn/Y5IhZOp3GaeBf6J8eMDWTKWe+vwV4I6OMPpMZAVCz5g8gbr8X1E9R9BB5z9EeJcG7tW66m+agEgJjfOkGUj+tFlB1vUjdeyM47Ui5/XyNIZvJECNqt6XZCz29FN0ZHXgj0AdIoN9Je74ivF6Z6k3WGfjbKKe0AJ/VOWDA2ZSAvyGupvz+llx/A6kcuBVGxnnHA3b+wgxy4tqZ0hW7wP2GQLdzn649jtYfERpQwyLxRh7krJk2q8BdhowY2PhfahclIx4yI/X0H6biO4x8KulHo1qhMFp6f2J+vzuWlG1CNH9BrPjENEKRH6sPn+Z+vIlCjAB8Wbuj2T0Pq1ATDlVR7dM1JtRvjB0ikTGKfq3fJ1+uuTq5Ezdqn2E3iHCgUPGmsiuGfTuUu6LcHE2Ue8x0Gb2VMkgXJX3ejrKr9JzdkifBNy0EZBsWsemmQeI43ZFJg6hPiePhHsoHPbu0gmIkI3gSGpQPjoAB8fH0jizpOGPnSsPeruI7ozRG59eVdpyyM1U5Q4R3Xro2FC/pOHFv+tpO5Zlr40JiDfPUDwd4z4dfRAQea+jMiP0ryAfGmrlIiIZFb0yV6clE05TvW4fsuE+EXn3EKzo7wwZvbvaa00pLtfWkfJ0weVlS1XOGRS+NvD1aq8fSOTajYcfK0X9o7LxdL2DnC1E5V8UakuTylqdtcfu+hPV81lyZElWYdVvP0xD+x9EqDHL9rokSrYCoXXVX9IgVwlaOeSsKLqvVg2/RU+fFj3JhAPQMLQ3Ub/BGGujFHiRXp1aO/0UHanKn1HZewg7G4dwWXWdfq6/V6o+UydKCLcibrshbM8tRfX2qV77nVY4E2ETtZGGKoOI8v2epKntnXiYeRzIJSoDd4Wm3wMgZJwo/2Dx4Xv1+2LZYO2xO1sLm9HR8YPSXG3Ej0X0g2bVPvmTkqxAqM+dgshlIjpk/YeIztCqcJv6fNSzLWwF4o0VUYmyDCQZVvf4y7Wa6RjJtcAHrIRwwC+rvR7c1wtMPUM3pzLcKuK2N3PKeAn695ozdat+1meb8Rw67J6vo3R57RfPPAH052CTWApjBPkbi2qn9dNNWnvctNc6ksYjduvfwLX6aJQvmy37bMF+r0Cozx9PSDi0csDoMZ2ugZv11CnRzj0xAfHmEnhnpDu91tMv5qvDD4EDrHA2KG0yonrN1Fm9T82W91opFfonUTfFLLnBnvLOYjbcPP0UHdn3ZmMrEEOq2xdOLY14qD0Epz818fAm244Sp9dTqO37TGKwFYieua1wWp/L6eyaag3uYjNjvxRzv1Yg1FcfrCH8bECly028P9fdGJa9RmvjrOaagHij61ZmJF/AFIc9w4oeDniPV3HftLJ5mxUrxekfp3rdvlclHLhYRN5r9ntrnXS7dIwMl/f190UTEEON3fNe+xevv/iw6YJeiQ7dsKWux1WyE8p13H9831YSMllrjz3jEBYd1uvzK9TjNFO8TCTuOUWDUML1WUCor9lVg1wtIuY/3mZX/Ti53LnxBIQzBVfj2ZN+pFfteefA8gWXSPumvlft9T2K/tRaQ1e+R7Zwqr/P+55tmqqu028iQyl7Va9dwcx8nZ7Up7IoWgjT0Bvk8tk+/3jJkdsg7q8qMsIs2SX7MvyV+X0rnKK1x56Of5zrfUamkP+KIHuZ+frdi/dpAlvPmDwBDdeLUGU27JJT1OdmxhEQBgozozQZWLap70z2OoYQbkDFOoLurbkLMK8nYkxEf2D22kQbEL6Xn6W93qgvtol6KNK3fUiKUCxeAWxjJtykrU6mUPu+3v/OWXvsOYf1yrRnvWtbhXPNbGUbpwlVlb8C3mHW2IStgvxC/bRET4g3AQHs4nWcwhejFKrSvKnvVGq4SMS900qmR/Y8eeqsrrNgTD9FRxL0GgbnibalJqtOr+jtgWHibAViCPbk2/Upg1fh8G8OzPMDyoIDru71fghV83U9J89DtTv0+NsVFWeJ6CgzW0k6795HvtTlv4rycTNeD/pl0VEQrlSf3DjfBATQppyFEmXnuij3dPf3aq8fAfdZK5We12Hn9LJJJ208HrV9FOeJyGQzU49r6OQRUNebX9geiCE7uu3d7HjzkduDzDXL9UqobUsQ36vfZGzlunf20vf3qCj81O1V9TgzWKm6mt6FzquftiNOzzPD9Uqk7QnVJyQqIIbyORBTZ+kM4FvxRrv8p6u/be91mKj+3Gp97we9o8dSv7GyFdWvmH166XOCnlrjdXovnIgJiKFJrlffDsVLAJu97bV7069QOCzfi0GDtcfeGbiH6Vzdt1OUcW4tcC/IZQhnofJ1VI9GmYnIFxA5GZGfIPwHoX1wlFPxx+iQPGiynxrCnaN+SiIho0Pa0eS9jgcaVCPZQfTZxV4e7urPwwMnI7Jj+WoaiuNeCfwZuBPHf926N59Z0eEY5irZSmBSUHZDeD/K+8tdl0T1pCln688fniePA+DVOdWf9XWjVgl5DeFWhTuBR7TIUxUZXmmHrMB4YFQGXBEmA7sI7IOyU1ltKZIpKvOBT/ZoXBjIiCXSG4I9Uy/q6eLaj6YkdGkNcB8q/waew4UVQFtnRXaC03GojkPYFpU9gHcD5T7dNktwP4Ye2i+QsbQovWKT9Vh9fryqHldms76EyC9B/sKKdf+WCx9r7VEzPW3HsQwfth/wRQIfS03aU+35c6iv/gjas/4oYQLwCEIB5XFUX8XxCrhXCbpeqEkWmIxoDbAXMKms/Tk6Bs3OBkq+ejZkBcTkM3SCwj9QdohXkPIHkI2eQj31DN1cRE8vR0p0EVoULisWOf/hOesH4N3zLLAQ+NMGW1ZWcCTCt4AyCSCpzGSYBxwFkA98TkV2L2OrvUXg4jXwp2Ve1vXgF3/f8B9TztYpLssXpPOQonHleXw+Ue31vc1e7tnUdzMOCZqCRi0UBP4Q4LZMB09LB8+1DWN4BWyhgZ1U+ADwIaAm5e5pmcBfgnCHFil0dPDccKWjwzHMZdgxCNOd8AGET6lStlSSIkzo8UChsOlkBwnWixaC3AD6K1568Vb2va2jx7999KgxtLV+EpXPAvtRrjMrhI/QNPMActf+pQcGl5QcrRGARuBxhGWobvCD40EmoVQgbEnnSla2jPVjzKbfRI8SYViZnvA5FM/qVb+W85e39Pr1zlu6ErgWuFZ9PofqbJTDyi4kenh/BQH5bpnr8W2oXoVzfxZfeK7nwgdHMb8nmXAMKseUbzJCP69nV39P5jU/agKin0w5W6dkMtyA9nIJvr+1sHNmf6O4Ss4Eib68L8I/pIOvFObJf/t6jcfOkReBC6nVn+XzfE6V84Aty1C0R9acrfOqXuCxFsGXqXrdI8J3Cl7u7OsFHp4nDwOnTzlV52eGcybw7XI4HlHmQvo3vIpwe7HIGUvmyr838udXgGeARcD1AHmv71Nl9noxkSYecMIZjfBPvIRuxPtdwP/ueJqOHTac41BOBraO36v2cDNp0+EHAeUQ820gP8O1zyP/+xV9usJOv10F/Bb4LU1HvIcQ5gP7l2cYo6cAfyH93I9wEa38mfc0vLjJbxdqRwEHoZwJ5GM/bFZ17CYVpcRJsvKWkbPi+Ckt62atFwH995W+0ATUqs+/D9VLgallqyU93UTt84ehuls5WhzIlRTDvL4OvMUToHAXcJf66XPQYj2qXyqDeMuSEc/6CdbSaUCguk6PEOHqCIrzpiYvB5Wtwnp11XCCKOdAD2YdStpYwivi3NYFL21v/dPkM3RCZZU+hUrMvMYdqpzZPIcfdLUq0lemna6bdQzjIlE+XYZSvkKEf6sSdS+JCC0EvlmYw2Wltmfea07hOpTq2MZ0ws6NXhZ1+3x1epgK15WhrNeKcmxhjvyuT3at0+NU+CllDlERoUhgdsExvxvh0F39GK9wCdq7lJT97//D481zMptecWysvRPYO65R+TfF8FmmX7+05NdunPlp0AuBzaNXFudmkLvmgU0832Gg5WiPzyP6BfLX/bVPv751nywTtvwJ6FdjPnRVUZ9p3fm6bbus57PyO+N0YeT6u4agX5I5zdck1n5PmjScMWMvBz2yTAri7zK7eb9Nfqu++j6QXWNP5iB6nPjmB0r+1r76IyCXo2wXXRAVizmZ9/DDJXNH6/89qCMmp52um+Xq9Mt5WCjKRdHFQ6fjv3xj4gGgooLjI4uHtU44pHmOfL/Ug12AxefKK81ePoPwTRGKkS39GSX66sOyYpE9CnPk0iTsWfDS1AbvpQyzjwG+mtJm/QyB9/VVPAAU5silqhxahjr6JhOHwBcKc2RuX8TD+vrxcpOnFrg4avePbnpD4+LDppdBPPyEls0+mIh4AKi59ncI74GuE2IkWFtOTml7XEQHM/osHgD2va2Dmmu/BvwoqkndJlb+MyF27P06kP2TFA8Acv7yFmYXPgPyvfLMnLhNjjvV53eJLh5Ef4es3TsJ8QAgvvmftLndgHsiW9yRyRxbygvGDWFSRk7zWpIYee2gSrOMDjDGdcaJj9LAaByjdb1AEBiHslOxc6NvhZYrTltRV+QXG/vTjOO1okX069FiVoV2B4c0evl70rdq8nJB3uszCFei0U6NrESZGHGw8lAWPrZorryQ5G0e87Iq7/UQVX4LHB6v7urndjxNT1t6nqwkJYjQIvCpxrnyYH+v1TxH/pyr1/n0MnVtycwrfL95tvymFL1e28v6rarN2VuVaXFz1GluAAAgAElEQVT62R7svxD3tcjioZ58w5zE75NveJJC7QdQroOomztrWfSZrzP9qldSIx2EFwmZT7DL1U+Xxrb571Ao7BFLeBbREZtopPtFtGZAOVpmF+6MU3QoswunaX0uAKfHdX49CWEKx0bdzyPyC2g6vjP0KMHbfLfxefXb7wsj/oCyX8T3O0Z9/izxhbbSKJK4fKio/LcU/4QMTar8R5R/qNKgyi8RLkCZL8ppopxG5ybUD6FlPujK6Z8a58lGD5Br3YZPgsSJX1ZUAsfFEA8bKHi5jsARQAeDj6UC+y/yyYqHN9iybUvh08DNET3qiGFVHLoJLxJ7BfOrjV7uL9XFVq3iXODJMtSfZ1pKuFr22IXSSuCbETuj7icFHv14FRAzPOIKcg3xzpnIN7Sxbt2RwB0R37GCTNsBm1B2cduj6plMu/qp0tUrH8B9DeKkHw0iWQq1Gw1j1NN2HEvn6m+sRnWxzGlqiO6JZjedCZHDUDexD0BPnFyFylERn+gSfOG4pMXD/1XzZetg+KF0ZmiM1VYngB5csqEtRoRxe9cZBELEDlYcvjBHfhX7/ZvmyI0qDK7zGIQ1IXBwwctzMW97m5eOYgsz6cxuEuld9aD0tCXuL3hKWoeXny8tKpxfhte5rIcZunouMufIrbE6JEEqOjP+dEHr6H2IFS4qPIzwZYS468y73rSWqspPoBHbo8oRKfKEz1O15jclv2rNNQ9F3cfhOjZ+kOzwEXsQK1JDeAppPaM83RnKunXHIvJ0amrWZpXvI1YWQpEFPDv860Jc/yF+wVra2g6NavcS7k01AZG44NNbukqFOeVUHR0rt7HC/YUC88tlh2YvlyH8dhAV7TeWzJXF5bjxw9+T1SHwGYTWOHWY/SafqFVpMLpTzk5in0kFXNWp56OqoUQGnSL8Jsrzi8j2vrvQRP1YNFsGTibf0FaWSrnTb1ch7rNEmjEX1Y9x/ydHpKSHu46d/tqaUPu4JKIo62IfhNbErMPiH1tVrpJcn+npW/FsvomVa4mU7UykBThaLllQlgP35JzHXqRYPCpW/6PwEfX5kiQOcesrbhqyuA9G+dDhnHR5jLgbxgGQfG5pEYoIX6ZByrlZlHUtfA3h+QFfrMLfmrxcXs5HWC9e5kR5XZHhFZvxgS5reayT7IXWguMfSVx6kZcXFB6IWYZBSWSTbytcLUJLjHcYva7bfRCx0p3exLSGP5fVJ9Rc8xBwTpyxrlQxYviu3X0jni8sXSjh22163e1ECy2sGF1WASFye1lCl96KL1yP8FBKeto4/iNwzvr0tuUbUsxdcjvCpXG6UUYB7yuZgBBnAiIZpac/Knh5rMuCdHE2z6hyUbOXB8ptj6XnyUoNnDXAi7XDdXBSGh5kLfwI4YkoTsexWwpeeXlfMxX1UGj/I+bLhEwyZfeYl1VECmNqzbDxmfBC7XiIcs5OGy4lmYk699I8FeVeRd0jHZ2cezCxa3eGo/0rjlcPXQiISGdFhfD9NBTn+hCeCyLdrMtxp/r8eGIc+CmyktaWC1LRllrDWQiRkiPoASUTEEYSg/bwVGhx3Zy+qiLwsQiNtL0onJcWuzQ3cwXCfwdswQrXdLUhPjbr4+ejrEIELe5RftMnM2P/fy/Jg9HeRVj5iJeXEpw0uC/Ge1RUdLECoRLpzBL5GbnrH02Fb9iroQUVH6kxpEFAtFO1akmyHWmkDaZCFyFMEuNA1GdwW/0tPZ1c5Q1xwmO7mQwqapwDBVV/UqpD+vptjXOWrIgm3kqUGMBCmJKplR04d/DD35PVXX2j2pNXZdsIg64bHvbyTGpM0yBFDfxwwJYs/DRNz7MWrhLhxcTrkeru3XiRKCETqjyerEhKWKC8uR4tS1igRBFDxWJXIUwhhoAIhOKFqXIQTq+E5MM0K7SbFcHgYoUwNSW2/2EDGVeI1CJHd+F0Notw8z+Jvy01WQrFL3wVuDeCzUM3Diz5E7IVpcNdlq4RhlwcQ7xpKE1onoUwJTLYkjmbChkS2D3KwxS5MG32aW3lKmDdgCtX4fGuNsSXi2Ve1qmSeGYtIbPVPl6z5S2AZMO1MplkBcpbiy7xwV0EMpku90DkItSHWxI7LK6v5Bva0OT3RxVh4iY3oSZv/0WJ36MtPBXpXd62AqG1ZFDGJj+QlbtT19lphEMStZtxp0TwH04ekPmNT6XJ7OILz6HcmPxYRsaqnz6pJALCViBK2CY0XFqYI3M33XaSj+8T4fHCXLkrbTZafyjZzQOvbLkplQ8WIuTvFpHn25hQ5vdMVEAUvLwcK7MVmmysfDtEOZtEoKtsQFtHaJDXprI9umLim2GDUMEjn968zB4x+VDUnfPPEiU7jXv7CsTkqeM2dVZBierxotTVYY2yeb3Lcg1Btolw9xtT6T9EfxenPy32O0zM9kCU1A/oPS3OfaOHDTRGjF9qB+ki3DIABcTdaXyuprncGyO7lcuw0XjgWFmYnEs+VAtldZwGwIokL/+IZwURDm8MYeMrECOKmnz+dqe3p9JR5K5fSIzN1K0dE7uoxHFWJpTkc9eLD0CM7IFv3wORycY5gyCTfTF1ddjJiggVqEsB0VqsSF4cO25N50ij5WaiRGjoNv03IRbCVCL+X8Va+UhPD4YSIfkY4RBhGbKvVbfIXQOtgDOB+9P5ZKJCBHGToawznh1FEu/URCIJCHg58ToRIaOHdpGGeoSGpOvKs6nZPP12cagQYeU3K5uV+T1jHX6V/AqEbOScG+mIIyBYuyqFtbgyeZt3fZ5PazGbrP9QFFoXpdDunSdUC/9OXkBpv8PzHEDRQpj6VxdVF1QKn1r0A1nTiwq8VfLPxaK02mx4hocHWDG/3DiPpamtg0QQN+X2ExkizIrx2uAQEAAkfrCaOCo2OrYNjE741un2H8qCCO2xrOf6IJlY+xOSn41VeXs9zmRHxzFk1YgU1uBRZRWGXR7sVzrxW85D+3rgP5IXEEFKIyCwFYj+VMQbK9bKBxd6ebWnP5nsdUziCl/RbAuPpNVsC7ysBV4aQCX9QBInIJeuGia+KReKXZy0GykLU+VrxFjqj3KasUYQEKoR/HrYuIAIaMKDIn0i3e4iwv4A18XBoBIphKkjE2sFIoKo31iCCI2UGcmNS131DRphtbmbNK6iSR+wu4w0I5L86mqpViCMvk5acOmWcHivVh6ATEfyoSDieKa3z1UG1g6gsn46zc9XLCb/fK1tr2bKqJBaI9XnOAKiGOXAoMRDP7pagQhOqhKuDy+m3GM8n3yj7yhn6s91TL8qzqFXSvLtfmMrEEikTIEdU1NXfSVCEoRu9kA4CVUJ3zvdY49iMfmMgOr6vcKWXa8Dy50QbmAhrJDAl5tmy/V9OVHMZRmZ9NygwqsDwJJhAJX6y6mukhlak65TgTWjy/aCSqzDfuIICI1Qn4Tk1yC6WIHogGQHAOrS7TsksyZx95bJljOt8qqIbf+1xMcnbmMrEMV1RBkYuenAH9JVf2VnNPFBinYtIDThCQhpSfdwI/MqSTtv6X+YqW2i7j3/1HZmFObI9f1QbYnPHMlAOGdByhzD25tH1UjpPfv6fMXk27CQGd/FIFIj1JVYDj+KgMhmkxdEEkGghy5WIIriKoZ0LxFChMG9brw9apRQy9XRbOki3GujKxAuUoitfiRNVVdPmjQc2CVGK+nSP7qE249qusceGRdjvDGq/00z1gBg4POACB9umi0fbZ4v/Y2/TXyQotrlAU9pom0Alf+oND+cClsk7tOyYzY6KxRpAmLtYKqTLS3JC6Jy7oFAExYvMQ746t+MQ/KrdUXGd3XzQSUgQoQQpo3tgfCF54kyESd7qX/XFqmpu2PHfhTVCOMHCX0RF6W5tds8ze6DYjFCuHD/95nYHohN1TNhgQqf3lLYo+DlXyWS3cnHrgqbp964SsUAqgdjU/6IicesZiuGuS4qtEaoK4NqBcKtjbJCWLY9ECIJ+zjRd6S6NTrZPvl7dLFR3YXBJSDKlIVJOmNIkj9QTTUD2c+np1/Wo+KUa9f1tKiS8AqBbpnu7jzEEJT9npSzEKbuB43zC152bfZy9W1eStYhDouQfUhgi0kn6fCU23fCQKkLCu9KtS0dEXLCu7Yu7j1oViBUu8g0VeLe4bELpTVC+0p+mb6LFQhRTdqO70y3w5DtIti+2JW6ivCGr8UzpiQv6je6BwKAxyJ1MCfq8TPKPqGmZ9VsBxwaqVy7m+BIepJ1a9KMSITnk9IICDsHosvBxJff5bXkSnCBl7UkfMiTKpmxY5mWVtvueJqOVU39rP4byUU74bVvAmdMhHt0dDGQSX7/xSDaAyESZz+NavICQtYn4nj70EDbEr7xFO6vTbP/SH4AIF1MasXZAxEvi41o8qJ+o3sgAOG+SG/5DrZuOaHstTardXTRpqMKCE1YNCqb6dlTdkixgJg+ECYB7ByI7tmiAs5NqONdnvjTB3ZLq2ErK6Ns0iqlwxmd9+ycWn8DOyZ9D1fGtLsxBsPrDdmefFWKk+BAI4RKdrWJWpy8lPDLZRjOnil2GJOSv0VY3cXnEfpziZcFSyWC4NaKLvrQ/0R04l7PmFq20GOdld8N9Ivx7hi6rENBJflDQ53bPcUjjvdEKPF+j0HdeldgAqJLH80X814/lMClE4+tVMeBabVrJpPmzr/LAdkBKX64fITB4tMb72MjxNrHy9jVFqGsYq2mJJ4qVrrYx7TOSfIHval+LLXtUZgRwYk+02WpJE/MLDYx9iVtfNa9PdxLvHTj46l0lynxk+rrKdNHkuE3xNwX281KWcaF5M9dci6VY5D15b9rhDstLYmAiOhU29nY8r2wGuEJYCHwL4TrERoQGhT+jlCgXGcGCKJwQd5rZYlryYMRnv5DO56mY1PaSD4x0ASERIsN7R15r+NFkg9Xy7SX7zC9oJEmOWLsgZAo+yyiCAhk4wKiRTJPJX9vmYn69CUCaT5ye5Rtk6+r4ZkyevB4/XGMECbpIhTvnCUrIoYxARyMr/5m9AHrqI6fozoltlvv6g/DMm0RTprXg8sh1jaJn7YDJJ9VkaL7b0lUtzhU43TPNzd5OWiy1zHD15EB2HwYq3uyQTnvdWvgIIVTUHaKPNrNB+FUYF7JWo6wIPF5IqVq+HA+B/w0Te1jutdJRXjvQFv2UmVGtdf3NHt5IGWPtr8qyaZ909C+RYV7totpiMSH94NpBUIiTYY4eDnxNtZVJjUJyxPvm5VtaSrsA/wrVa0xFA9Nvmy1NRRk44LeaUh8u1bMM3xUQ4S6VNHN7MVNiOwR733lh+pzL4lvujLOgDV/XrTMS29xEl3W74w+QfLjo3fi83vjC3emqzvv2D+Crgm0u6YS9DFEPwfiMS+rFp8rryw+V17paXajgpfnCl4uGQ67INwUvaorZ+W95kp1vQq4P9LswlfxmqpZunY4PvEBb3L14GupEzZwdPLeJjR11VZdjBCmeCuQMc5oieJvNcLGc5Euz4FoilT5T0qdkwgcFaEOLWZmQ/kOw9KIKxBxTh3veuOwy8QebziUX2pd/rhEzVpLRutz/4vqd8rTmXazVydoc6R6fFTq/IfKpyPcZYmcu/iV/ldUBlYa1wVe1rbBZ4FlkW89TOGqUoUyLfKyHFiafGWkujpCh9ZTppyqox2cwMDl6JqztTotDzPN61SBxE8ydS57D0MAjRNeNGjEUJczt0EKkd7xQBYfNj01FWhR7QeR5DdAqnQXAhtjD4SLF/rhIogV7VpAiG9chMjiyDUpi+glWp+/aP3J0KV9XT99S3K5mylrX9zNRvwQ4kxAiByjfso2qel/ZuV3Rtk7wnv/uzRKdwDymJdVInxOhLgzMMrOCmeWsBP4a5Q24pg//RQdmYaycyP4jurAOf9hY45ds3w/LQ9TVGbFWM0RuKebvyXewavGiVV1IcoeiFgTNsmvpnTVh0xvWCbEOEEYQdx5qfEOjlmR7tR12EWIsTqg2Wg2jbHasalJ1KCXlmlI+VXGjnlIfb4kiVzU49RXHw0dC4kw8dRnAZGd+F+Ncf6H6nA0e1Z6/EeoQ2L0deH/lUxADMRzIApe7lT4cfz2zFk1XkuzQz7EERAo2xVHlX/QO+VsneLgFAY4qhyY8/rZcj9HtdcPoHw6Qv3R0Mbfyj40i9JUkk99Gi0cS6Nt1t6oSFK4N9Ld9qdwePlXWQuH1wIfjlKy2ew/uzF+hJPhYwoIF2MFonubtWWuVGRdWeqVshOqt2h97h/qa/bpy8ZfPX5GhfrcZ9HqB1H5FcrE8vekXadxFX9bhxDujmTgY9VPLftBsVqX+zAqh0S4VQet+ucB0yknxaqVzAKWRL5tNsAlM47Xfp8aOcJxq4pGSemogROq67RsaV338ZrNZvmlKsMZHFyQ9/qOsomxU3W0wGUxZitUdHHzd+XZrv5ejLECMcB91VsEqEa6T/IzeN3VP400QdJZSX9MobZs7ZElR26DSpxkFUqBqVd3nYEpE0FAiMTbw+ZinGvRvQ+Tcxe/IqK/KrPr+AgabqU+t1zrc/+rdfnj1Nfsoz6/0UML1efHa11+P/W5C9hm3dMovwFJT7jfpg48FBdr0qoSld+W8yRwPXXKaJxcGmX1QbhdzllSknM2BnSnvPx8aZHA0RHTIm5w4O9u2br/oUwLvKwFuTbKMwviHL8t5Ubw3vCC8kPVgXf2Qzd1YDOFP5QnNEwlO4JLY2UjcyLXl9vcInE23UfaDzaY9kB0JyBujlhFtkC5kYc+F789FmoraS/+DtgyzoCahhR4wMG1AkEP2n27nqMq7Smw/TbACYhegoZbUX1W63MrtD733w3/hLrcy6iuQPRmlBNRTWPY8CbKNfw9Yg+zK9usnVuWoYTHMTxzJaqRTsbWG0rnigY4hblyH4H6+CMazs7N0lKkdrs8WkVVxgJ/ij1znqvTE4FvMNhQ3t0xkitLsRrVG6o9s1U5ItI7akcHv+m2KcQIgdQU5utOOy7CqdrdzZhNa2gEnor4xruQWfc7CrWVEX2AEORyhA9Eu2Nwv+3+GxFm7CWigEDLH8IEyPzmJ0T05ylt7eOBHTf8I8Jm6XdQmzjN3Dc/CCyPV83kO+qrj407hEDQ3PnAQXHGgNoCVVeZgHgDTY7zgP8X+bZZyfCrSSdpv0Jymj13QFgarcIqOwC3TfW6fRTx4PUbwE8G8TDt4JZtuH7yiVoVRzzo2aLRNmoCeufD8+TxbruBCLP2sVYgBhmJr0C47oSdoKhcHvmdP4lyHY9+PPn2eOs+WZoOvwyJmgryLqZds4kDoGLsgYi5AhEjJKuHq4KSPU9V1pprKYl+0O6LBCWuYHOo/DyWiNBaMtTnLibi5KqI/E78wldLKiAyboDP7nkJxSLHS4S8528ZjE8ZO5bZ/SxSFXHnR37uHZzyn6mz9IOJ3aRWMzmvP0D5SZysAq8r+rtRfTRq/VM+WTGefyW5sjPpJB2eq9dfihJ3mdX1IK47wgpEtD0QAzChRNf9c4QsdZtq204vjiFk3iYi2kb9jYW1yZ0G3XzI5kyYcBMqX4xbqD2YjNEoAiLiHghNRwgTIH7RciGciVEaD7XJKZDMpRo3GcR6EZHz6vdJTCTrmdUTyef+ARwf1+Tuf0trrEHCw/Pk4RA4I/Z9VTk5X6f79ucaw+By1fBy5Eff0jn+mavT+lLPnk85W3fI5fg7ysnxfRL1gvwk/m3ZS5UHc15nlvrauVmaHzOGu4HPR67dT24Jm4yXjLRvYND4qsHEJtPr5hueQ/Ta+A/GB8mykMW1pc9qsrj2oxSzC4H9IzuZxynw+02/+yALYYpzaF3P7/HciJ8p0mStv99tdNNhY99tfF4k+p4fh1IPL9ypZ1fvVNpXRtRXH02lewhl38j+42/iG+8vraEGEc2OCxHuiF3ZVLh8stcxfb3AAi9rxbkflsFkWQRfOZ6FNV4/AdqvlYIZXkfk6vSMTJbFwIeiv41wR7OXf+L4FfBSGew5HuWanNe/TPXa77RwU8/QzXP1eg6OB4Bdovt3kfN7clJ8jDTQEslXBTd4ViAitblN+4yg3yfexvE3sgXCDTTW3krjEbv1+2qF2hyLa3+P8HdgUhlGXOf17PTpGAfJRRQQMc576kVmNLlkQbsIXwDpMAeQsO8AKLp5qhr/1HVlDzKyUH31HPWTx/T7cnW5D+Nzt3em0S3DpvZi6fcKu84Ji0GyQdFLCHBs7FAmYPsqpV8CYF0LF6HhlTJZbmpQbsrVc3++To/Z8TQd25sf15yl21XX6Vnr4BGE76KMLENjV4WzAQpeXlPle2WcWfm4U5rzXv9U7fWA3p5enve6S87rBa6SZcDpQGUZXuLJFrg4LU1bbQUinfRkc/u06xeBXFnGp9wHwr001t5F4fAvU6gd3+Nf3v/JETTNPJjG2j+gLEY4uEzv8Cgt4y9PUbnHExAhwkC9lxMH4gv3ovptcwAJ+w5A5jU2iytbXzQClVlQ+YzW536pdbkPa23Pw/fUv2sL9fmva331fQj/RHl/ecSa/FnmNv1n4M4iRGKJl0fydTob4dzIA5xjq+v0D81zpE8HdCw9T1ZWez1VlEvLaL73qHDFsOG05ur1VoQ7HNytsHTYMzy74BI6pp3OuDCMiQG2F9gF5ZMBdhdwWsa5W3Vc3ezl9Y30IxwXrQ36TRHZtkyP5FQ5UOBAhVdzXv+scD+BgnM8Lm2slkBbh2NYppIJCjUou6lwoEZKz9qtv1E5fdnsMh2c1I/OZkAQ6SRqcWjSbVJ7Oosoepoon1TKmh1mL1T2Av6XxtpmRO8hyCKcLkNc56nZgQyqW4L8D6LvB95L0BEpqP+z2PWS9hTV4Xh7IEQ6SLrJaB9WyOY0/VTrc/sLHGBqIGFaWs8Kw0Yc5ghbl6n9jQQ+j/B5crnntJ57UBaCLAN9Aaft68VuBcgknE4B2QfYBdUMZey+VKVdih2JhJNnB2NdKzTzg1yew1B2i3lfcVw69QydtuQc6dMhHc1webWGr4q4d5e5s6oC9kfZf4NXbZkIuXo615KVdI3mlDXFDr7zxo8WeFmbq9OvAX9IwROOQzlK4CgEVGFD4lcB3hSxnI4AmjsLc7h6SA66A0VLGJsA+YbntPHwb4H8KhW1CXKo5JBOFcQblZakpyGuf55/kG+4NmXtMd6KoGh7lETRva9Eqi3FI8OwijuchJ2tkfe6XHvsaeW8pSu1LncCkor+fGvg4M7VSH19JuVNvkPT40NEOF/mPfxwEtd26/89uLrMBimGIl8idvYPZWKmkr6fRuolOHVfVqVo3qVX1D8yX55+64dNc+RG7cEmYONNdbi1WOTY3sRRR8niFuv0ZrC45t51ID0fSNZc92usPfZ2kPoacGzvBLQm3x5jhj3HCGHSvu3Rke89vNoV2w5UleVWWxNuC3OablTlRrNEb6q1LEeSy9w4aOOKl8yVxQjnxC8wjqyu0z4f8lWYK/c5Fzf8akA7FeH2JkeXaXCLHXwDZbVZqof2dPiH58nDaXsujbQJ15mASJYOvuFglRmih/Ve5SzyDU+mUNnEExASUrcH4k2PN/+Rp8WxX1D34iAZdD6DyOLkb7Q+bLBX/ZOcEFSsP++ZtTpEOEx84TUTEH2gbQXnANHTrYlwweQz+rXLfo6ijdYANtW5shI4Gt91PulH5svTCieZtXo0KLilUOD7vS6HCLOREimEKcbpzbEIEUSX9nZvyi4NTweVr1lj65Fxr2XatRf0YRZAorSUeB1qjBWIfvkX8YUmF4p7D/SVCIUXpNjxIYKeF+Fmr/XBzs85p2ebc+gR54ov3Ju4Exg0WZjewmMXSqsTjiH+rOKWVVVc2NcfF7y0aZDPqGiLtYFuHf6XC142OTvXPEd+IfAzM1q3Bn3OtXEUDZLW8LkQp1oNnhUIF1Iqhmqu/S0WyrQJLc8ztMvX0/2I0XxT8vVYtd/tXuY1PyqOvVV5ZGDqVZ4VkX074+UjJNBwoW8rCb7pQtKxtzHFrVNuRybMTrwIB7sdG73cr4ovQ2M8Il+n+/X190vmymIX5HOxYr8HnLNzzGueI9f09PvDnuVbCreZ5TbmbLRdghze+F15vo9exPZApFJBJC8gpC/CTlBGjjxK4D5rfBsrNl2twkd5T8OLfWzPMQb38c71iLEHAleStiK+8KS4tt0Qrh9givVRCcW9xReaXu9hk69Bq/v2qCgin1OVZvMWb6dDM49A60Hib0u83QyJ3OojnuN7IiyIPsgVftSfU54Lc+R6HKdak3ibA/l1s5e63vxmwSXSnm3lUNDHzIJvUroqQT5dmCt3pfoxY+2BiDNrH0ukJJ5EQvt6yNcOV6xTV6wV4UVrhG82aRD5IvmGtJ90HC9BSYwQJindKof4x1bhm2oROVlVBkBIpFwNbbvKvIcff8NnMQ5KfK3vNi68Ji7MVJU15jLe2J3L6mzQg8U/FmWfmVuvNQd14sIFl0h7RwdHAWsj3zpXuXnvY8rfSJPnh8Dl1jReVw+3rFzFCX356eJz5ZUgcqAqT5shNwzMZVZhjqR+tizWHogoKxBKa5yRaIQViP5kjMvd8ITCoaLaai3xdYueSL7hugHwoPEGxhIhhKnEYVICKr7wI1F9N3BnSgebryB8TmYXPv22AafojhFGnyv6ZWPf3ChOPoaJCAACskpc2EfmNUZbmRkyp7s+PE8eRkp/lHcPBgtfy3vdvz/es2k2xyrhMlPX+nuBA5afL33eG7LEyyPOsZdqeNzGKnyneY7ML8FAddCETEQKYYoye6sRQpj6vTKUb7hTnXzEqb5m7ZETqbn2ohKUigyWOpzE4L6LoVAi95C5TQVmN30A0eNUeT4V9UxRRH8nHSEvvunKLupi8oeZtvNEv+3rG+/Gsb+qDOn9okHdGidhP/HND8S8rxtKRm7y/BDhb5Fv60LQq6f5/ih60a3EfYWhvHFIuLH9Ffl0wUu/O66ClyfVuQ+h/XdgA9acQn2Tlx8MHKHhABYAABqESURBVPUYZwUiEyMLk8RZgSDGCoSU4MyafMOdQeUTAkN1JlERTibf8NMB9MwRQ5hc8vUiwVWOztWI5stk9aodUPl2OYWEKregYW/xzZ+R7zY/281T1yT7HFKkYquSRAKIL9wpcITGPvcrLc5DZbXTjgPFN98T+95ufUczRM5eFc12HsrzStzBmowtwg2TTtLhfb3GbV46hj/LTIRfDsE28tMt4fDHLpSSDbyWeFnmirwf1QeHlrPRoghfLniZU7JrDqIQyCKsi3CbKB1dDDFUslSx0xtuV2Q/6UzNPJQaZAfKMeQbflTCAXeMpAYRs7VJhNWp5Fc55PzlLTKncL6sXrUDwueAv8RY8QxB1oBchsi73Zymj8jcJf/u1hJn1myF6rbJVh+eL+UmX5lTuElE9lDlmSEmHp6SIHvI3CW3l+P+Q2oFAmCRl+UCp8cvaXYeM6Z/B8QtuETam7x8UZWzh0h2pg6ErzTNlhNv86XfSNc4X55a62Qv4Ioh4m5eE+STBS+XDMCH3z7KUKUY5dDBWDNlid9HSjmQrLn2LnXsKuiiodAaBV7GsT/TGn4zAB9+h4jdQPJtMrhoezrk/OUt4puulNlNB4p0TETkC4j8RlVKtjcvBLcSuArhCJcZtqXMLhwnvrCwRz/OhgMSt4GwtOTX9IWF4jLvV5UlQ0Q8NEkxvD/mnoeyCgiBMWkwfMHLJWVJs6acWO314P5epnmOzMdxJAzeuGFFnxHlY01eLk7yPsu8rGuaLV9AOYFBvAQqwgJXlF2a5shfS9/5RliBEHaacbxWJO4QNcIpyZE2URcjnPgspd6bkm94TNe17gny60He/y/SIruSv+6W0hd8lD0QO/Hox6uiWEpd8gIiykbtjQ16H3lJfOEK8YWj3ZzCJCTzP4jUIswGvUGV/9JNG1NlXeg8OfrfwAUon0XCFDe3cTOZ3XSU+KZrxS/oXfIYx6eS9xu6LBl7Ll4qrmJPRH4/uGcf5DeyNrO7zG8uaxh2FiDjkBBhPluVPbb3OmyZl3Xltv+6Fr40bDi7oPxPRAUlovyi+kz9T/N35dn+XKrJy7XVZ+uDkuFq4D2Dqm3ArytFvrlwtrwa655Nc+TnuVl6Lxn9BSrvHkRSLCByfusKziplCFgZFGVF6wS2Bp5KVEBkWZ20LxSJsspBsZ1XstmEi0USCGXZ9aa1wDE0Hn6HiPxQNR0TTyWT28gFrNIz2athIG/8zLJu7JZJt0cAMq1r6Ehaq2gq0q2KX7wUWAq8KROX+nwl69xIMh1jqMhmaG9tZe3al935y0tah9RP3R7lwAj+vCk5Gy58FThUffWxBPdjREcOmt5cpUUc3xJfSEUUQewQpmGj4F1pePGl58lKhYMVjS1mxlPJD0txoeZ58mjby+wF/IhBcACWij6NcnBhthyz0McTD6+LiLnyYFNBdlPlW4gOhg2dC53IHk1eTklSPGQi7YEoRvBXr7UkP7jXSHH+w1pJvA1Jktmxaq67TDOZahhgh3J1zaMIH6Xm2pOSFQ8aZ09Spi3O+GHKH1/LoAnLepfq8xrEF9rk3MWvyPzmJ8QvXirzH3laSiwe1tvh26yfWE66b0reZs2X4dgF9O5B4j9uFlfMpUU8lENA0FFks7S8fLOXRqdySnRnEDiyxuuupbjWYxdKa9NsOTkE3oNw6wCVDm0C80Yg72qaIzeW9VEapNg8R36SRaai2oDqgNtrouhLqnx1S2G3Ri/3DxLnSUUFic/YLj2PVYommjJWJI6AWPQDWZP0u2jSm2mnXv0MNQ2HI3xKlCcHYr0VeA3kdIQa8g3/GiztkXb9/+3de5QcZZ3G8e/vrZ7JTK4k3CHcQkhmpmcCGtAj4oIR5KKeFdxEXcWDIt4OwsF1BSETKpNwURRdb+tmRTeIgEQXxRUQ1gXlsqzIokl6JgkBA4QYBhKWQDK37ve3f0xUhEBu3TU908/nHM7hj0l191NvVb9PVVdVT0YB+thirOzZU/MBapy3N83E+WQ2M0/L5OYllhZWM7/rOMw+4Nja4blm7AnM32/zO0+1dMWaanpngw+Sy/AuTElSXU8eLXTYN83jNRl/o1h0LijnIlcssGWdqc3CmQMMi4uI3L0EXFcqWVNhvrU/lNqWanlvS1Nb29kR5kS3I4dNkTB/wYzLBswO7+qwf67EhedDOAt7cmlq3VmEGEsDFT375JDZ2bVY7Kn0dT2ZPJ+D/JJbPHAE2Lnm/sdhMmr7cfu6e24qrTd9gfySkXSN1ZMceXN3Vi+2R7FU4V8K1HaB8DQ/liT5HlmcfXB71NLC+gwLvFtauN6sYTpu8zyDa8PKMz+yDbh9ho190yzturEa32O2ZyCMQqEaJ7chfCrGgQczHh5z2i7ysp+N6eywJZ2dtJrxgeotEr7FjH+iZId3zrczVy60qn2o24oFtqyzI8yxYK0YP6jOI1Xebcbne3vsoEJqc1enlukOMosDEA63Z/Z5Sn0VPbJqMbtblRZLWyp65LYi10C8eonop/Wmb/oLdjj4BViVPlHeKIEvJkmm03bTebTdkO19/7O4jSt+e5YfaY+BUmXPQJTpLkz97a0f6b945rC6JtFTAh4X496Wzfj0IbnlqKUPbbGOwgLr7T0Ys887dFfl+sDW4nzWQt8U6yh8xb6+umqvXcwBlAIrg9MN7FOx7dMHekOsO5MFFqsthEJq/dNSP41i/4qQ1O+Z0XDO9fDsacAPyr7oJVYqLOF6ZvsPm/O8C+fsYJzqTjLEUf/GjcW5Xrth2ZX2HMNIIbVO4IP51M/D+PsY4zlmYcYQT1QeJHLNlmCLh/LGBCVnUxh8GFZFJi5OKSYDyYKsPk+MfZthXAXnKtkViFjc0seoSg5Bst+fD14/8FVumv11Wuw08I8Cp5HNb7dfyxPgi4nJYtp++OiQvYvomwj44Oopv1HusY/cgiw/0qTSQC80VvAVdv/AkKf5o4jxO9T12JaLj/pjY93ANZgtsXR51d6W2D89dRRefy1wRoYz5CH9GZ994bHngSs9PfSrMOZDuJ+J8+ZKfX/t6FaL2T3AIlvXsMQWPTQszoj9ObBpqe9lA33/GHL1p5hb2yvCHHzuwEbMn3OPG2Hw98gGoz2EA8xt323vwP2xUuy/fUtv99VPXnXwo9UcxvS5vdODxVP/skptrNngZ4pGnVsyxqCBSAPBxuLUmdkEgxwWduhK/+jxOXOejsT10PujlQvG35fFZ5t2iR+YJJxlgXcZHJ1JmXAc84fd7OdJkRuWL7QuRpB8ux9J4O8i8Z3mdiRmWdzOtOBwY4AbC6mtrpYsmub2nWFJ3Xwr8xNM3Xm+FF84a9XC8Zk9hb1pXvHbwZL3U67bTht9jj9L9KfBnna3C1cssGVZfJbmeX1fNKs/B9ijLB/FKDn+rEeeJbAO7LtdqQ396fUV7zuAYnwv5qeac7xDfUav3A3civF9WvJ3Y2lVHCCb8Pv3vGdzIC1aKOv2aMbzh/T0nrXm6J/9JMvP07j09C/3Jrmz3ZlQpkUOBPzZ4N5NZH3RwhXMWLJbR8b90uafgb1zW6MT8x8wwPeH+rabf/V+L2k+hBzXgx2bXXewovWFfezKZVV1ANHT/MHE+F6MOWCvJ6tf55ithHhdtY2NnS4QLzXzY143cAD7/mkn3AebVqVsAHv134HP9qR1GgcUw5/PYvR7H2tWftFeQKpK20U+MdYzC2OWG2/CaaMsR++8iFPA7CGcey1wWyG19bWQ6dTP+96jRnGSw4m4vw63Zmz3j/2asdLhfiL3eOTeroX2SDXn0HqJH0Qdx5QiE0MYLKkx0kNgg5XY4M7GkGNDIbWNf9pvNB/BPkk9h5Uix5hxFMYYHDfj4QS+m821D9s2M/XRm/torBvFhIESY9i6T7TkL///V1tAic1sfZ5IXcLmBNYPxR3FtmXyBd44cRQNNDCxVKIxQgNAAg0xeeXhXSvRF2HL1s/bl/TzzPLL6X7N74Fq8PszxxB63krgJLBjgKPwsh2+3gz8Duc2nNtpyz9cLaVhm5a97yAoHgM2ka3bI5EeEtuAlzZgbMTDBvJLBrfHm2YntJb2oRQOAzsG4yiwMXh0gj1MsfjdLK992Kb7ZzcygUZKcQ9yudEU4+B+NvHRWHjlPjfSQ9x6t8WEHnK5bqbf8GxZJ6DtLW8k8MB2/ixi/Ipoi+kt/rt9ceWQzI18NgnNzWdh9qVyHVjYiRnnLy3tPLGadx+eTtsLkhNxOwnjeCJTynZ2wux53O/C/Q5icoctXF7VB9V3qUBIbZl8gTdOGMvrPaENZ3+Mg3D2N2PvrWcqxr9kQvsc8GJ0XsB4nMjjFng8wGO9G1g2rJ81UE6zPWnKc3gSaYswxYxJbuxpMIltHEVz6A3wBMaTDmsp8XguYeVQTp5FRoS7Tsix597NJH40bocCBwP7A5OBfQc71F95EVgHdGN0A6txKxBLBdra1lR1YZAhmnTm78D9pJ2YeW3G7WeY38yW0m1ZlAmfTUI+fzowL7PrHV7xuf0cS7u+M7zW7dTxMGoGxBlAC257g++D2d7AXq84kDQ4N3oa55nBfYh3ESkQYycLV64x8JEy7lUgRERERHZlgtnedDwh3L0bi+gdPDPhtxH8NktXrCpzuTkY/IM4ZwNThiwn2GLWv7+lqzdp1KhAiIiIiNRugUhbfo3zljIu8lngN8BvcVYR/FH6kz9w+fLu7R293vrzm6lgU8Ffj9tbgRkMwTO/tuHfbH7nhzViVCBEREREarc8zMufjGV0S1tjAKwbfB1/epq9MQpsNHgO5xCyvqZhh4PC8XikLVixTKNm5MgpAhEREZGdmRNjBL8is1+0O3XgBwIHvvRNDIuf1AdusVTlYaQJikBERERkJ6TNb8N5nYLYrghhoWJQgRARERGpbW4XKIQdssjS5b9VDCoQIiIiIrXbHdK2KcApSmI7jA1Y7lIFoQIhIiIiUuPieZo/ba9l4WAftHSpnmU0YvuhiIiIiGx/Xpwe2gCj1+FMVBqvObv8nqWdH1EQI5catIiIiMiOiKNPVnnYbnm4i3WNH1cQI5tu41rD/HPTxzE6+dvo4eSeGGYavoeZeZ3F9TmLDxLt53QVbrUllJRWBdfDx2bWcUDvbNzfNuChucdzkyIW3H3jOCvekzP/NesbbrdFDw0oLRGRIRTsXbgrh1e3hv7wfn1f1UJPlNqbsF44ZQINjRcX3c7NWRz9mn+LrTHnI9ZRuEvJVWBdzMuf7Ma3DJ/yWn/X78lz9aF4NRsGrrKvr+5TciIi2eubO+Op+qR4gJLYxveZU7Cin2SXd/1RaahAyEjbwNPWYyN+U3A/cCf+WcTtE9ZR+FclWNbycI6bf9t24qeEJQ+PJqH0bku7litBEZEsvz+n7eUx94xp5rQtyxnwt6s81A5dA1FTO7/8ce5+506WB4Dg+L/4vOZ3KMWyFbm3u7FT5QEgsXh4JPza25tmKkURkSyN2/JMz7jHlMPLGD+mp3SsykOtrXaplfIwyd2XGezyqdei2/pc4AhLCy8q0d1YFxdOmdDfMHpFPXG/XV4GrLW+ZIZduew5JSoiktH++4LJjT5uws1mfnLNZwG95sylo/NqA10YUmN0BqJmtnT/h90pDwA58/3AP6Ewd1Njwxd2pzxsbf6TaYhXKUwRkezYV9b2WEfhVMw+DtTkwTR3HFhkAz7FOjq/rPJQo9uCIqiBjT0leGzpNmPP3V1Wvycb6sMLky1d06tkd2FdzG0+wkPoMvOkDIvbgvXvb+nqTUpWRCTj/Xl7S56ES8HOwMuyT696JQ+/SoLPtbRwr0ZAbdMZiJrY4pvy5SgPAPVW2hNGn6VQd1EutJepPACMhvpTFKqISPZsQWfB0s45FItHgH0RWDcymxJewu7A7C25juUnqDwI6AxETfC0+UTc7izX8iL2RDCOsLTQr3R3Zj00HYqHRyjn81fcLrKOwheUrojIEO/jZ5PQ3DyLwKm4vRWYwTA+UOtuWyywGMLXLF22QmtYXkoPkqsFEStnVQz4weAfBb6lcHdmb5ycD17ebS5EPRFVRKQKDD50tetO4E4YvHkJxL/ZWiZm4eTL+21cga8piOZ2J8Gvs83JzfalpZu1ZmWb410R1MC8NW1uxW1ZmRe7jk2bptpX1vYo4R1YBxe1TaSh9DjOuPIu2M6yjsJiJSwiUuXfAxe37kvOZxF422Ch8MOq4n05fzTjF7jfTgh3WlrYqLUl26MzEDVh4AmoL/dCD2Dc+E8BX1a+O6A+nlv28gAQ+L3CFRGpfnb58qeBG7b+h1/cvD85WiG0Esjj3ga0AGMr9ybseTwWwJbjdj/R7g0Llz+qtSM7PZQUQW14oX3GxrGhOLHMo+c5+uIRdsWKDUr41XmaHwu+Bi/Phex/roUe+urCXmMtvbuolEVERsD3BRiXtE6mjoPADyDGAwnhQNz3x+ygP5eLwbs+jX/Zv36RwVvLvjhYFOx58E04qwj2CCSrLF26VilLOegMRO00xf8GTivznm4io+wK4GNK+LVy8kugvOUBoGjhvnqVBxGRkfRd7Vy2/EngSaUh1Uy3ca0RY5KBX1Vmcmwf9rS5VQm/Sjxp/mDMzq/Esht94HYlLCIiIioQUhml8t3G9WVyEL7h+jncqzSI+BXcG8u/XJwYf6SARURERAVCKmNB5+/c7enKTJL9eNLmTyrkl8WStr4T7IxKLLto4SFbuPIPSllERERUIKQiDNyCX1e52bJd5Wl+qpLeGseFUyZAXFSp5ecsfl8pi4iIiAqEVHpae30FFz4a/NueakwB0NCY4uxfoaVHBoo/VsgiIiKiAiEVZWnX/2LcU7l+wtsg31HzNS1tmYP7+ZVbkdxpl616SiNaREREVCAkixpxeWVnz36Jz2t+b82Wh/ammTiLsUpeVO6XaxyLiIjIkM0mFUGNTXDBfF7LMjPyFXyZTZi9ydJCZ01le1HbRBpK/4NzRAVf5jc2v/ONGskiIiIyVHQGovYao1uwSh/BHo/7XZ42TauZ8pDmJ9FQuqvC5QHMLtMoFhERERUIyda6hiUYhQq/yj54+Kmn0/Ya8eXhszPG4P5TnCMr/FIroPAfGsAiIiKiAiGZskUPDUA4F8cr/FJNkLvV0/ykEV0exhRvAY6r/ItxkaVEjWARERFRgZDsS0S6/G6CX5vBpPcY4LeetjWNuPIwd/phjCk+AMzK4OVutY7On2rkioiIiAqEDKG6z5WwTZWfafthULrf25uOHzHlIW09gVzyINBa+Q5m/Zidr/EqIiIiKhAypCxd2p2YX5jNjJuJJMltnracN5wfNudgnjZ/FPxWnD0zWU/4ty0trNaIFRERkaqYQyoCiZe23mzEd2f4kvdi8WxLV6waVuXhkuZDyLEI7O0ZbqFPQv0MS3/3fxqpIiIiogIh1TExTvOTim6FHHG/7Eae9RCZz/qGqwcv6q7mfE7IEZ/5OMGvwBmXYUYliLMs7fq1RqmIiIioQEi1lYg3RLg/uCcZj8BHwc+ztOvWqstkNgn5/Nm4XwIcnP3W6e2Wdi3U6BQREREVCKnOEjGv5fMYl2f/wjiB68HSavitv6cEYvOpGCnY0UO0Zd4H+5xg6d1FjUwRERFRgZDqLBBgffNmLBllxfcM0VuIGDeDf8nSrgcy//wXtU2kvvQRAp/EOXzo1oM9a8V4tF3W9bhGpYiIiKhASHWXiAsmN24eO+nBMaGYH+J3cj8WbmBg4Ga7bNVTFXuVdOZoYu+pmJ8BvBsYPbQlzvotMssWFO7TaBQREREVCBkeJSKdMbk3+u8brDT0T5B2nGAPEPkpXnqApPiwpat3+dkVfsHkRsaOn0HiMyGcCJyCe2N1BI8T+JClnddpFIqIiIgKhAyvEtHe8rqBkNxbR2l0db0xHOMRzB4GX0u0p8C7Cf70K/422hgCh4BNxjkIYgtYC5Cr0s1xoc0vtGv0iYiIiAqEDNcS8ZYBC7+ss1inNCq+KV7L/MJZBq4sREREpJrpSdTy6lPaBZ331AU/pehBdwKqbNLfUnkQERERFQgZGVPbtPBfuVA607GoNCqS8LV0Fs5TeRAREREVCBlBJaLrRnM+qBJR7mB9MVb4sC2hpDBERERk2ExhFIHsKJ/X/I6SJT9JiDmlsdtb3nzSzvk68yAiIiIqEDKyS0TaMsfdfmC4SsSu5AfRzM63tPANpSEiIiIqEFIbk+D2pjfFJLk5uO+rNHamPNgms/geS7v+U2mIiIiICoTU1mR47vTDYpLcEqBVaexQeXjMYmmOLVjxkNIQERGR4UwXUcuuNc+FK/8QbMsxYNcqje36mm16vlXlQUREREbEPFARyO5wMOa1fMaNhQYNSuQl2TibLfinLO1SyRIREREVCJG/miynTdMgfBfnzUoDMPsVxXiOLex6RGGIiIiICoTItkoEGGn+HNyvAsbXZAbO44Z92joKP9OIEBERkZFI10BIOduoW1pYRKl0FHAdUDMPnnMoAldb6J+h8iAiIiIjfM4nUqFJdXtTG0m4DOddI7k4GHY9Fq6wdNkKrXURERFRgRDZ3Ul22nosXroUt5OwkTHmHOs1/DsU/Ut2WdfjWssiIiKiAiFS9iLR1gTFc8E+hDNuWH4G96fM7Bos901Ll3ZrrYqIiIgKhEjFi8TU8TDqQ7ifDRxV9e8XiobfgnENha5f2BJKWosiIiKiAiEyFJPzudMPI5c7HffTgWOpkgv7Hdtixl1E/wXFcJNdvvxprS0RERERFQippjKR5vcjcjLGcY4fZ870rK6ZcLc+8KVm/BK3OwjcZ2mhX2tFRERERAVChk2hmLYX1B0LvAH3w8APjRYOD+777kZRGIjY+sRKj0L4HRYfpuQPk+zXZendRaUuIiIiogIhI65YHNoA4w6lNDARC3uA7QFxDwgveXhd7CWEnsH/ZQPua0lKT8LK9ZbWzvMpREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREQE+H8DGzmErscn4wAAAABJRU5ErkJggg==" alt="Roomongo" />
          <span class="roomongo-tagline">Discounted Hotels &amp; 5-Star Service</span>
        </div>
        <div class="roomongo-partner-tag">${window.days}-day stay · curated for breeders</div>
      </div>
      <div class="roomongo-body">
        <div class="trip-pitch">
          <div class="trip-pitch-eyebrow">Take a Trip</div>
          <div class="trip-pitch-heading">You deserve a break.</div>
          <p class="trip-pitch-sub">
            You have <strong>${window.days} days</strong> open between
            ${fmt(window.start)} and ${fmt(window.end)} with no breeding,
            whelping, or puppy duties. That's a real window. Long enough for
            an actual vacation. Here's what's available in the Caribbean and
            Mexico for your exact dates.
          </p>
        </div>
        <p class="roomongo-human-note">
          Just like BreederHQ, Roomongo is run by real humans who actually care
          about you and go the extra mile to make sure you're satisfied.
          <strong>How do we know? We've personally been booking our trips through them for years! They are the best!</strong>
        </p>
        <div class="destinations">
          ${ROOMONGO_DEMO_DESTINATIONS.map(d => `
            <a class="destination" href="${escapeAttr(url)}" target="_blank" rel="noopener">
              <div class="dest-image" style="background-image: url('${escapeAttr(d.image)}')"></div>
              <div class="dest-body">
                <div class="dest-name">${escapeHtml(d.name)}</div>
                <div class="dest-region">${escapeHtml(d.region)}</div>
                <div class="dest-price">from $${d.fromNightly} <span class="price-note">/ night</span></div>
              </div>
            </a>
          `).join('')}
        </div>
        <div class="roomongo-cta-row">
          <div class="cta-meta">Curated by Roomongo for BreederHQ breeders.</div>
          <a class="roomongo-cta-btn" href="${escapeAttr(url)}" target="_blank" rel="noopener">
            See all stays for these dates →
          </a>
        </div>
      </div>
      <div class="roomongo-disclosure">
        Demo card. Property listings and rates shown are illustrative only.
        Final integration pulls real availability from Roomongo for the exact
        dates of your open window.
      </div>
    </div>
  `;
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------- Event handlers ---------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Sync the picker-row name field (and dependent chip tooltips) for a dog,
// without re-rendering the row. Called from the live 'name' input handler
// so typing in either the dog-card name input OR the picker-row name input
// keeps both in sync without stealing focus.
function updatePickerRowName(dog, sourceInput) {
  const rows = document.querySelectorAll('#picker-strip .picker-row');
  rows.forEach(row => {
    const input = row.querySelector(`.picker-row-name[data-dog="${dog.id}"]`);
    if (!input) return;
    if (input !== sourceInput) input.value = dog.name;
    // Grow input width with the typed text
    input.setAttribute('size', String(Math.max(4, (dog.name || 'name').length)));
    // Refresh chip tooltips that reference the dog name
    row.querySelectorAll(`.chip[data-dog="${dog.id}"]`).forEach((chip, i) => {
      const date = chip.textContent.trim().replace(/^[●○]\s*/, '');
      chip.title = `Lock ${dog.name || 'this animal'} to breed on ${date}`;
    });
  });
  // Mirror the dog-card name input too (in case the user typed in the picker)
  const cardInput = document.querySelector(`#dog-cards input[data-dog="${dog.id}"][data-field="name"]`);
  if (cardInput && cardInput !== sourceInput) cardInput.value = dog.name;
}

// Update only the lane label text in the gantt, no full re-render.
function updateGanttLaneName(dog) {
  const labels = document.querySelectorAll('#lane-labels-col .lane-label-row');
  // labels are rendered in the same order as state.dogs; find by index
  const idx = state.dogs.findIndex(d => d.id === dog.id);
  if (idx < 0 || !labels[idx]) return;
  const labelRow = labels[idx];
  const mode = dogMode(dog);
  // Replace only the leading text node (the name); preserve the mode span
  const modeSpan = labelRow.querySelector('.lane-mode');
  labelRow.innerHTML = `${escapeHtml(dog.name || `(unnamed ${speciesOf(dog).adjective})`)}`;
  if (modeSpan) {
    const newMode = document.createElement('span');
    newMode.className = `lane-mode ${mode}`;
    newMode.textContent = mode === 'anchored' ? 'Anchored' : 'Scenario';
    labelRow.appendChild(newMode);
  }
}

function updateDogCardChrome(dog, sourceEl) {
  // Update only the bits of the dog card that depend on state, without
  // tearing down the inputs themselves. The optional sourceEl is the element
  // the user is currently typing into — we never overwrite that one, or the
  // browser caret jumps to the start mid-keystroke.
  const card = document.querySelector(`#dog-cards .dog-card input[data-dog="${dog.id}"][data-field="lastHeat"]`)?.closest('.dog-card');
  if (!card) return;
  card.classList.toggle('example', !!dog.isExample);
  const sp = speciesOf(dog);
  // Header — name (contenteditable) + EXAMPLE pill
  const headerNameEl = card.querySelector('.dog-card-header .header-name');
  if (headerNameEl && headerNameEl !== sourceEl) {
    headerNameEl.textContent = dog.name;
  }
  const header = card.querySelector('.dog-card-header');
  const existingPill = header.querySelector('.example-pill');
  if (dog.isExample && !existingPill) {
    const pill = document.createElement('span');
    pill.className = 'example-pill';
    pill.textContent = 'Example';
    header.appendChild(pill);
  } else if (!dog.isExample && existingPill) {
    existingPill.remove();
  }
  // Mode indicator text
  const modeEl = card.querySelector('.mode-indicator');
  const mode = dogMode(dog);
  modeEl.className = 'mode-indicator ' + mode;
  modeEl.textContent = mode === 'anchored'
    ? `Projecting from your last heat date`
    : `Add a last heat date to see ${dog.name || 'your animal'}'s projection`;
  // Toggle the "needs-date" amber-outline class on the whole card
  card.classList.toggle('needs-date', mode === 'scenario');
  // Show/hide Clear button next to the date input
  const dateRow = card.querySelector('.date-clear-row');
  const existingClear = dateRow.querySelector('button.clear-btn');
  if (dog.lastHeat && !existingClear) {
    const btn = document.createElement('button');
    btn.className = 'clear-btn';
    btn.dataset.action = 'clear-date';
    btn.dataset.dog = String(dog.id);
    btn.textContent = 'Clear';
    dateRow.appendChild(btn);
  } else if (!dog.lastHeat && existingClear) {
    existingClear.remove();
  }
}

// Pressing Enter in the contenteditable name should commit, not insert a
// newline. Also prevent rich-text paste (HTML carrying styles through).
document.addEventListener('keydown', e => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (t.classList && t.classList.contains('header-name') && t.dataset.field === 'name') {
    if (e.key === 'Enter') {
      e.preventDefault();
      t.blur();
    }
  }
});
document.addEventListener('paste', e => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (t.classList && t.classList.contains('header-name') && t.dataset.field === 'name') {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.dog && t.dataset.field) {
    const dog = state.dogs.find(d => d.id === Number(t.dataset.dog));
    if (!dog) return;
    if (t.dataset.field === 'species') {
      if (!SPECIES[t.value]) return;
      dog.speciesCode = t.value;
      dog.isExample = false;
      dog.selectedCycleIdx = 0;
      state.selectedAvailabilityIdx = null;
      // Species change rewrites labels, name placeholder, seasonal note,
      // and phase labels — full re-render is correct here. Select inputs
      // don't lose UX value the way text inputs do when re-mounted.
      render();
      return;
    }
    if (t.dataset.field === 'name') {
      // Read from .value for <input> elements OR .textContent for contenteditable.
      const newName = (t.value !== undefined) ? t.value : (t.textContent || '');
      dog.name = newName;
      dog.isExample = false;
      // Update only chrome elements that show the name (card header sync to
      // picker, gantt lane label, availability prompt). DO NOT re-render
      // renderPickerStrip / renderDogCards: that would destroy the focused
      // editable element mid-keystroke.
      updateDogCardChrome(dog, t);
      updatePickerRowName(dog, t);
      updateGanttLaneName(dog);
      renderAvailabilityDetail();
    } else if (t.dataset.field === 'lastHeat') {
      // Text input — accept MM/DD/YYYY or YYYY-MM-DD. Only commit when the
      // value parses to a real date with a sane year; otherwise wait for the
      // user to finish typing.
      const raw = t.value;
      if (raw === '') {
        if (dog.lastHeat !== null) {
          dog.lastHeat = null;
          dog.isExample = false;
          dog.selectedCycleIdx = 0;
          state.selectedAvailabilityIdx = null;
          updateDogCardChrome(dog);
          renderPickerStrip();
          renderGantt();
          renderAvailabilityDetail();
        }
        return;
      }
      const parsed = parseUserDate(raw);
      if (!parsed) return;
      // Same value? Skip.
      if (dog.lastHeat && isoDate(dog.lastHeat) === isoDate(parsed)) return;
      dog.lastHeat = parsed;
      dog.isExample = false;
      dog.selectedCycleIdx = 0;
      state.selectedAvailabilityIdx = null;
      // Update chrome + downstream views, but DO NOT call renderDogCards()
      // — that would destroy and recreate the focused <input>.
      updateDogCardChrome(dog);
      renderPickerStrip();
      renderGantt();
      renderAvailabilityDetail();
    }
  }
});

// Normalize the date field's visible text to MM/DD/YYYY after the user finishes
// typing. Doing this on 'blur' (not 'input') so we don't fight the caret while
// they're still typing. If they typed "11252025" we rewrite it to "11/25/2025".
document.addEventListener('blur', e => {
  const t = e.target;
  if (!(t instanceof HTMLInputElement)) return;
  if (t.dataset.field !== 'lastHeat') return;
  const raw = t.value.trim();
  if (raw === '') return;
  const parsed = parseUserDate(raw);
  if (!parsed) return;
  const canonical = formatDateForInput(parsed);
  if (t.value !== canonical) t.value = canonical;
}, true);  // useCapture: blur doesn't bubble, capture lets one listener catch all inputs

document.addEventListener('click', e => {
  const t = e.target.closest('[data-action], [data-cycle], [data-window-idx], .availability-band');
  if (!t) return;
  if (t.dataset.action === 'clear-date') {
    const dog = state.dogs.find(d => d.id === Number(t.dataset.dog));
    if (dog) {
      dog.lastHeat = null;
      dog.isExample = false;
      dog.selectedCycleIdx = 0;
      state.selectedAvailabilityIdx = null;
      render();
    }
  } else if (t.dataset.action === 'remove') {
    const id = Number(t.dataset.dog);
    state.dogs = state.dogs.filter(d => d.id !== id);
    state.selectedAvailabilityIdx = null;
    render();
  } else if (t.dataset.action === 'move-up' || t.dataset.action === 'move-down') {
    const id = Number(t.dataset.dog);
    const idx = state.dogs.findIndex(d => d.id === id);
    const swapWith = t.dataset.action === 'move-up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapWith < 0 || swapWith >= state.dogs.length) return;
    [state.dogs[idx], state.dogs[swapWith]] = [state.dogs[swapWith], state.dogs[idx]];
    state.selectedAvailabilityIdx = null;
    render();
  } else if (t.dataset.cycle !== undefined) {
    const dog = state.dogs.find(d => d.id === Number(t.dataset.dog));
    if (dog) {
      dog.selectedCycleIdx = Number(t.dataset.cycle);
      state.selectedAvailabilityIdx = null;
      render();
    }
  } else if (t.classList.contains('availability-band')) {
    state.selectedAvailabilityIdx = Number(t.dataset.windowIdx);
    renderAvailabilityDetail();
    // scroll into view
    setTimeout(() => {
      document.getElementById('availability-detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }
});

document.getElementById('add-dog-btn').addEventListener('click', () => {
  if (state.dogs.length >= 3) {
    document.getElementById('fourth-modal').classList.add('open');
    return;
  }
  state.dogs.push(makeDog({ name: '' }));
  render();
  // focus the new dog's name input
  setTimeout(() => {
    const inputs = document.querySelectorAll('#dog-cards input[data-field="name"]');
    const last = inputs[inputs.length - 1];
    if (last) last.focus();
  }, 30);
});

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('fourth-modal').classList.remove('open');
});

render();
