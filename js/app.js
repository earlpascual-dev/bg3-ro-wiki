/* ==========================================================================
   Geffen Codex — BG3 build wiki
   All build content lives in /data/*.json. This file fetches and renders it.
   index.html contains no build data.
   ========================================================================== */
(function () {
  'use strict';

  var STORE_KEY = 'bg3_ro_wiki_checklist_v1';

  var DB = { characters: null, gear: null, rotations: null, checklist: null, locations: null };
  var doneSet = loadDone();

  var els = {
    nav: document.getElementById('navList'),
    view: document.getElementById('view'),
    search: document.getElementById('searchBox'),
    searchResults: document.getElementById('searchResults'),
    viewTitle: document.getElementById('viewTitle')
  };

  /* ---------- utilities ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function mod(score) {
    var m = Math.floor((score - 10) / 2);
    return (m >= 0 ? '+' : '') + m;
  }

  function loadDone() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) { return {}; }
  }

  function saveDone() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(doneSet)); }
    catch (e) { /* private mode / quota — checklist just will not persist */ }
  }

  function charById(id) {
    var list = (DB.characters && DB.characters.characters) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function charName(id) {
    if (id === 'party') return 'Whole party';
    var c = charById(id);
    return c ? c.name : id;
  }

  function badgeFor(id) {
    if (id === 'party') return '<span class="badge party">Party</span>';
    var c = charById(id);
    if (!c) return '';
    return '<span class="badge ' + esc(c.badge) + '">' + esc(c.name) + '</span>';
  }

  function win(title, bodyHtml, extraClass) {
    return '' +
      '<section class="ro-window ' + (extraClass || '') + '">' +
        '<div class="ro-titlebar"><span>' + esc(title) + '</span><span class="ro-close"></span></div>' +
        '<div class="ro-body">' + bodyHtml + '</div>' +
      '</section>';
  }

  function list(items, cls) {
    if (!items || !items.length) return '';
    return '<ul class="' + (cls || '') + '">' +
      items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
  }

  /* ---------- navigation ---------- */

  function buildNav() {
    var chars = (DB.characters && DB.characters.characters) || [];
    var html = '';
    html += '<li><a href="#/overview" data-route="/overview">Overview</a></li>';
    html += '<li class="nav-section">Characters</li>';
    chars.forEach(function (c) {
      html += '<li><a href="#/character/' + esc(c.id) + '" data-route="/character/' + esc(c.id) + '">' +
                '<span class="badge ' + esc(c.badge) + '">' + esc(c.roClass.slice(0, 3)) + '</span>' +
                esc(c.name) +
              '</a></li>';
    });
    html += '<li class="nav-section">Reference</li>';
    html += '<li><a href="#/progression" data-route="/progression">Party Progression</a></li>';
    html += '<li><a href="#/locations" data-route="/locations">Area Guides</a></li>';
    html += '<li><a href="#/gear" data-route="/gear">Gear by Act</a></li>';
    html += '<li><a href="#/rotations" data-route="/rotations">Rotations</a></li>';
    html += '<li><a href="#/checklist" data-route="/checklist">Checklist</a></li>';
    els.nav.innerHTML = html;
  }

  function markActive(route) {
    var links = els.nav.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var r = links[i].getAttribute('data-route');
      links[i].classList.toggle('active', route.indexOf(r) === 0 && (route === r || route.charAt(r.length) === '/'));
    }
  }

  /* ---------- views ---------- */

  function viewOverview() {
    var meta = DB.characters.meta || {};
    var chars = DB.characters.characters || [];
    var html = '';

    html += win('Party Overview', (function () {
      var s = '<div class="parch"><strong>' + esc(meta.subtitle || '') + '</strong></div>';
      s += '<div class="char-card-grid" style="margin-top:8px">';
      chars.forEach(function (c) {
        s += '<a class="char-card" href="#/character/' + esc(c.id) + '">' +
               '<span class="badge ' + esc(c.badge) + '">' + esc(c.roClass) + '</span>' +
               '<div class="cc-name">' + esc(c.name) + '</div>' +
               '<div class="cc-build">' + esc(c.bg3Build) + '</div>' +
               '<div class="cc-role">' + esc(c.role) + '</div>' +
             '</a>';
      });
      s += '</div>';
      return s;
    })());

    html += win('RO to BG3 — Party Mapping', (function () {
      var s = '<div class="table-scroll"><table class="kv-table"><thead><tr>' +
        '<th>Slot</th><th>RO concept</th><th>BG3 build</th><th>Role</th></tr></thead><tbody>';
      chars.forEach(function (c) {
        s += '<tr><td>' + badgeFor(c.id) + '</td><td>' + esc(c.roClass) + '</td><td>' +
             esc(c.bg3Build) + '</td><td>' + esc(c.role) + '</td></tr>';
      });
      s += '</tbody></table></div>';
      return s;
    })());

    if (meta.analogyTopLevel) {
      html += win('Where the RO Analogy Breaks Down', (function () {
        return meta.analogyTopLevel.map(function (t) {
          return '<div class="break-strip"><span class="bl">Analogy break</span><br>' + esc(t) + '</div>';
        }).join('');
      })());
    }

    if (meta.partySlots) {
      var ps = meta.partySlots;
      html += win('Five Builds, Four Seats — the party slot problem', (function () {
        var s = '<div class="break-strip"><span class="bl">Roster exceeds party size</span><br>' + esc(ps.summary) + '</div>';
        if (ps.theRealReason) s += '<div class="parch">' + esc(ps.theRealReason) + '</div>';
        if (ps.recommendedFour) s += '<h3 class="ro-h3">Recommended active four</h3><div class="note-strip"><strong>' + esc(ps.recommendedFour) + '</strong></div>';
        if (ps.whatYouLose) s += '<h3 class="ro-h3">What benching Astarion costs</h3>' +
          '<div class="parch" style="border-left:4px solid var(--ro-red)">' + list(ps.whatYouLose, 'details-list') + '</div>';
        if (ps.mitigations) s += '<h3 class="ro-h3">How to cover it</h3><div class="parch alt">' + list(ps.mitigations, 'details-list') + '</div>';
        if (ps.verdict) s += '<div class="note-strip" style="margin-top:8px"><strong>Verdict:</strong> ' + esc(ps.verdict) + '</div>';
        return s;
      })());
    }

    if (meta.provenance) {
      var p = meta.provenance;
      html += win('Sources & Confidence — read before trusting anything here', (function () {
        var s = '<div class="break-strip"><span class="bl">No sources were consulted</span><br>' + esc(p.summary) + '</div>';
        if (p.patchRisk) s += '<div class="break-strip"><span class="bl">Patch drift</span><br>' + esc(p.patchRisk) + '</div>';
        if (p.high) s += '<h3 class="ro-h3">High confidence</h3><div class="parch">' + list(p.high, 'details-list') + '</div>';
        if (p.medium) s += '<h3 class="ro-h3">Medium confidence — may be off by a level</h3><div class="parch alt">' + list(p.medium, 'details-list') + '</div>';
        if (p.low) s += '<h3 class="ro-h3">Low confidence — verify before relying on it</h3>' +
          '<div class="parch" style="border-left:4px solid var(--ro-red)">' + list(p.low, 'details-list') + '</div>';
        if (p.verifyOrder) s += '<h3 class="ro-h3">What to check, in order</h3><div class="note-strip">' + list(p.verifyOrder, 'details-list') + '</div>';
        return s;
      })());
    }

    if (meta.assumptions) {
      html += win('Assumptions This Guide Makes', '<div class="parch">' + list(meta.assumptions, 'details-list') + '</div>');
    }

    if (meta.irreversibleMeaning) {
      html += win('What "Irreversible" Means Here',
        '<div class="note-strip">' + esc(meta.irreversibleMeaning) + '</div>');
    }

    els.viewTitle.textContent = 'Overview';
    els.view.innerHTML = html;
  }

  function viewCharacter(id) {
    var c = charById(id);
    if (!c) { els.view.innerHTML = win('Not found', '<div class="empty">No character with id "' + esc(id) + '".</div>'); return; }

    var html = '';

    html += win(c.name + ' — ' + c.bg3Build, (function () {
      var s = '<div class="parch">';
      s += '<span class="badge ' + esc(c.badge) + '">' + esc(c.roClass) + '</span> ';
      s += '<strong>' + esc(c.role) + '</strong>';
      s += '<div style="margin-top:6px">' + esc(c.summary) + '</div>';
      s += '</div>';
      return s;
    })());

    /* stats */
    html += win('Ability Scores — final (level 12)', (function () {
      var order = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
      var s = '<div class="stat-grid">';
      order.forEach(function (k) {
        var v = c.stats[k];
        s += '<div class="stat-cell">' +
               '<div class="s-name">' + k.toUpperCase() + '</div>' +
               '<div class="s-val">' + esc(v) + '</div>' +
               '<div class="s-mod">' + mod(v) + '</div>' +
             '</div>';
      });
      s += '</div>';
      s += '<h3 class="ro-h3">What each stat is doing</h3>';
      order.forEach(function (k) {
        if (!c.statNotes || !c.statNotes[k]) return;
        s += '<div class="parch" style="margin-bottom:4px"><strong>' + k.toUpperCase() + ' ' +
             esc(c.stats[k]) + '</strong> — ' + esc(c.statNotes[k]) + '</div>';
      });
      if (c.statPlan) {
        s += '<h3 class="ro-h3">How to build the array</h3>';
        s += '<div class="parch alt">' + list(c.statPlan, 'details-list') + '</div>';
      }
      return s;
    })());

    /* RO mapping */
    if (c.roMapping && c.roMapping.length) {
      html += win('Skill Mapping — and where it breaks', (function () {
        return c.roMapping.map(function (m) {
          return '<div class="parch" style="margin-bottom:6px">' +
                   '<strong style="color:#24406b">' + esc(m.roSkill) + '</strong> &rarr; ' +
                   '<strong>' + esc(m.bg3) + '</strong>' +
                   '<div class="break-strip" style="margin-top:5px;margin-bottom:0">' +
                     '<span class="bl">Breaks down</span><br>' + esc(m.breaks) +
                   '</div>' +
                 '</div>';
        }).join('');
      })());
    }

    /* level tree */
    html += win('Level Tree 1 to 12 — exact clicks', (function () {
      var s = '<div class="note-strip">Every row is one level-up screen. <strong>Pick</strong> is what to click; ' +
              'rejected options and the reason are listed underneath. Rows with a red edge and a warning badge ' +
              'lock a choice that costs 100g at Withers to undo.</div>';
      s += '<div class="skilltree">';
      c.levels.forEach(function (lv) {
        s += '<div class="skillnode">';
        s += '<div class="skillbox' + (lv.irreversible ? ' locked' : '') + '">';
        s += '<div class="skillbox-head">' +
               '<span class="lvl-chip">Lv ' + esc(lv.level) + '</span>' +
               '<span class="menu-label">' + esc(lv.menu) + '</span>' +
               (lv.irreversible ? '<span class="warn-badge">Locks in</span>' : '') +
             '</div>';
        s += '<div class="skillbox-body">';
        s += '<div class="pick-line">' + esc(lv.choice) + '</div>';
        s += '<p class="reason">' + esc(lv.reasoning) + '</p>';
        if (lv.alternatives && lv.alternatives.length) {
          s += '<div class="alts"><strong>Rejecting:</strong>' + list(lv.alternatives) + '</div>';
        }
        if (lv.details && lv.details.length) {
          s += list(lv.details, 'details-list');
        }
        s += '</div></div></div>';
      });
      s += '</div>';
      return s;
    })());

    /* that character's gear, pulled from gear.json */
    html += win('Gear for ' + c.name, (function () {
      var acts = ['act1', 'act2', 'act3'];
      var any = false, s = '';
      acts.forEach(function (a) {
        var items = (DB.gear[a] || []).filter(function (g) { return g.wearer === c.id; });
        if (!items.length) return;
        any = true;
        s += '<h3 class="ro-h3">' + a.toUpperCase().replace('ACT', 'Act ') + '</h3>';
        s += '<div class="slot-grid">' + items.map(gearTile).join('') + '</div>';
      });
      return any ? s : '<div class="empty">No gear assigned to this character.</div>';
    })());

    /* rotation */
    var rot = (DB.rotations.rotations || []).filter(function (r) { return r.characterId === c.id; })[0];
    if (rot) html += win('Combat Rotation — ' + c.name, rotationBody(rot));

    els.viewTitle.textContent = c.name;
    els.view.innerHTML = html;
  }

  /* ---------- inventory icons ----------
     Drawn from scratch as inline SVG. No game assets, no sprites, no external
     files — same rule the RO window chrome follows. A gear entry may override
     the auto-detected icon with an explicit "icon" field naming a key below. */

  var ICONS = {
    bow: '<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
         '<path d="M5 2C11 5.5 11 10.5 5 14"/><path d="M5 2v12"/><path d="M3 8h11"/><path d="M11 5.5L14 8l-3 2.5"/></g>',
    sword: '<polygon points="8,1 9.6,4 9.6,10 6.4,10 6.4,4"/><rect x="4" y="10" width="8" height="1.6"/>' +
           '<rect x="7.2" y="11.6" width="1.6" height="3"/><rect x="5.9" y="13.9" width="4.2" height="1.4"/>',
    dagger: '<polygon points="8,3 9.4,5.6 9.4,9.5 6.6,9.5 6.6,5.6"/><rect x="4.8" y="9.5" width="6.4" height="1.4"/>' +
            '<rect x="7.3" y="10.9" width="1.4" height="3"/><rect x="6.3" y="13.7" width="3.4" height="1.3"/>',
    mace: '<rect x="7.3" y="7" width="1.4" height="8"/><rect x="6" y="13.9" width="4" height="1.3"/>' +
          '<polygon points="8,1 11.2,3 11.2,6.2 8,8.2 4.8,6.2 4.8,3"/>',
    polearm: '<rect x="7.4" y="5" width="1.2" height="10"/><polygon points="8,0.5 10.3,4 8,5.6 5.7,4"/>' +
             '<rect x="5.4" y="5.3" width="5.2" height="1"/>',
    armour: '<path d="M4 3l4 1.5L12 3l1 4c0 4-2.5 6.5-5 7.5C5.5 13.5 3 11 3 7z"/>',
    helm: '<path d="M3.5 7c0-3.5 2.5-5 4.5-5s4.5 1.5 4.5 5v5H10V9H6v3H3.5z"/>',
    shield: '<path d="M8 1.5l5.5 2v4.5c0 3.5-2.5 6-5.5 7-3-1-5.5-3.5-5.5-7V3.5z"/>',
    ring: '<g fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="10" r="4.2"/></g>' +
          '<polygon points="8,1.4 10.1,4 8,6.2 5.9,4"/>',
    amulet: '<g fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 2c0 5 2 6.5 4 6.5s4-1.5 4-6.5"/></g>' +
            '<polygon points="8,8.4 11.1,12 8,15.5 4.9,12"/>',
    gloves: '<path d="M4.6 6.2V3.6c0-.9 1.5-.9 1.5 0v2.6h.6V2.9c0-.9 1.5-.9 1.5 0v3.3h.6V3.3c0-.9 1.5-.9 1.5 0V7l1.3-1.4c.7-.7 1.7.4 1.1 1.2l-2.1 3.2V14H5v-3.4L3.8 8.1c-.5-1 .4-1.7.8-1.9z"/>',
    boots: '<path d="M5 2h4v7l3.5 2c1 .6 1 3-0.5 3H5z"/>',
    potion: '<path d="M6.5 1.5h3V5l2.5 5c.8 2-.5 4.5-2.5 4.5h-3C4.5 14.5 3.2 12 4 10l2.5-5z"/>' +
            '<rect x="5.6" y="0.8" width="4.8" height="1.4"/>',
    cloak: '<path d="M8 1.5c1.7 0 2.6.9 3.2 1.7l2.6 3.4-2 1.3.8 6.6H9.4l-.5-5h-1.8l-.5 5H3.4l.8-6.6-2-1.3 2.6-3.4C5.4 2.4 6.3 1.5 8 1.5z"/>',
    scroll: '<path d="M4 2h8v12H4z"/><g fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3.2 2.6a1.6 1.6 0 000 3.2M12.8 10.2a1.6 1.6 0 000 3.2"/></g>' +
            '<g stroke="#000" stroke-width=".8" opacity=".45"><path d="M5.6 6h4.8M5.6 8h4.8M5.6 10h3"/></g>',
    gem: '<polygon points="8,1.5 13,6 8,14.5 3,6"/>',
    star: '<polygon points="8,0.8 9.7,5.9 15.1,5.9 10.7,9.1 12.4,14.2 8,11 3.6,14.2 5.3,9.1 0.9,5.9 6.3,5.9"/>',
    box: '<rect x="3" y="3.5" width="10" height="9"/>'
  };

  var ICON_RULES = [
    [/one-time permanent/i, 'star'],
    [/spell component|gem|diamond/i, 'gem'],
    [/scroll|scribe|spellbook/i, 'scroll'],
    [/consumable/i, 'potion'],
    [/bow|ranged/i, 'bow'],
    [/dagger/i, 'dagger'],
    [/quarterstaff|staff/i, 'polearm'],
    [/shortsword|main-hand|sword/i, 'sword'],
    [/mace|carried|off-hand/i, 'mace'],
    [/polearm|glaive|halberd|spear/i, 'polearm'],
    [/shield/i, 'shield'],
    [/cloak|cape/i, 'cloak'],
    [/chest|armour|armor/i, 'armour'],
    [/head|helm|mask/i, 'helm'],
    [/ring/i, 'ring'],
    [/amulet/i, 'amulet'],
    [/glove/i, 'gloves'],
    [/boot/i, 'boots']
  ];

  function iconFor(g) {
    if (g.icon && ICONS[g.icon]) return ICONS[g.icon];
    var slot = String(g.slot || '');
    for (var i = 0; i < ICON_RULES.length; i++) {
      if (ICON_RULES[i][0].test(slot)) return ICONS[ICON_RULES[i][1]];
    }
    return ICONS.box;
  }

  function gearTile(g) {
    var s = '<div class="slot-tile">';
    s += '<div class="tile-top">' +
           '<div class="tile-icon w-' + esc(g.wearer) + '">' +
             '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">' + iconFor(g) + '</svg>' +
           '</div>' +
           '<div><div class="tile-name">' + esc(g.item) + '</div>' +
           '<div class="tile-slot">' + esc(g.slot) + '</div></div>' +
         '</div>';
    s += '<div class="tile-body">';
    s += '<div class="tile-row"><span class="k">Wearer</span> ' + badgeFor(g.wearer) + '</div>';
    s += '<div class="tile-row"><span class="k">Effect</span> ' + esc(g.effect) + '</div>';
    s += '<div class="tile-row"><span class="k">Where</span> ' + esc(g.location) + '</div>';
    s += '<div class="tile-row"><span class="k">Replaces</span> ' + esc(g.replaces) + '</div>';
    if (g.missable) s += '<div class="tile-row"><span class="miss-badge">Missable</span></div>';
    if (g.note) s += '<div class="tile-note">' + esc(g.note) + '</div>';
    s += '</div></div>';
    return s;
  }

  /* Pivots characters[].levels by party level, because the whole party levels
     together — this is the view you actually use at a level-up screen. */
  function viewProgression() {
    var meta = DB.characters.meta || {};
    var chars = DB.characters.characters || [];
    var html = '';

    if (meta.progressionPrimer) {
      html += win('How Levelling Works — vs Ragnarok Online', (function () {
        return meta.progressionPrimer.map(function (t) {
          return '<div class="break-strip"><span class="bl">Differs from RO</span><br>' + esc(t) + '</div>';
        }).join('');
      })());
    }

    /* find the level range present in the data */
    var maxLevel = 0;
    chars.forEach(function (c) {
      (c.levels || []).forEach(function (lv) { if (lv.level > maxLevel) maxLevel = lv.level; });
    });

    var body = '<div class="note-strip">One row per character, per party level. ' +
               '<strong>Click this</strong> is what to select on the level-up screen. ' +
               'Levels with no locks and no feat are marked as free — read and click Next.</div>';

    for (var L = 1; L <= maxLevel; L++) {
      var rows = [], locks = 0, feats = 0;

      chars.forEach(function (c) {
        var lv = (c.levels || []).filter(function (x) { return x.level === L; })[0];
        if (!lv) return;
        if (lv.irreversible) locks++;
        /* \b matters: "feature" must not count as "feat" */
        var isFeat = /\bfeats?\b/i.test(lv.menu || '') || /\bfeats?\b/i.test(lv.choice || '');
        if (isFeat) feats++;
        var isMulti = /multiclass|Fighter \d|back to/i.test(lv.menu || '');
        rows.push(
          '<tr>' +
            '<td>' + badgeFor(c.id) + '</td>' +
            '<td>' + esc(lv.menu) +
              (isMulti ? '<br><span class="miss-badge">Multiclass — do not autopilot</span>' : '') + '</td>' +
            '<td><strong>' + esc(lv.choice) + '</strong>' +
              (lv.irreversible ? ' <span class="warn-badge">Locks in</span>' : '') + '</td>' +
          '</tr>'
        );
      });

      if (!rows.length) continue;

      var tag = locks
        ? '<span class="warn-badge">' + locks + ' choice(s) lock in</span>'
        : (feats ? '<span class="badge party">Feat level</span>'
                 : '<span class="badge party">Free level — nothing to decide</span>');

      body += '<h3 class="ro-h3">Party Level ' + L + ' &nbsp;' + tag + '</h3>';
      body += '<div class="table-scroll"><table class="kv-table"><thead><tr>' +
                '<th style="width:15%">Who</th><th style="width:32%">Menu shown</th><th>Click this</th>' +
              '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
    }

    html += win('Party Progression — Level 1 to ' + maxLevel, body);
    els.viewTitle.textContent = 'Party Progression';
    els.view.innerHTML = html;
  }

  function confBadge(c) {
    if (!c) return '';
    var s = String(c).toLowerCase();
    if (s.indexOf('high') === 0) return '<span class="badge sniper">Confident</span>';
    if (s.indexOf('medium') === 0) return '<span class="warn-badge">Verify</span>';
    return '<span class="miss-badge">Unsure</span>';
  }

  function viewLocations() {
    var meta = (DB.locations && DB.locations.meta) || {};
    var locs = (DB.locations && DB.locations.locations) || [];
    var html = '';

    if (meta.disclaimer) {
      html += win('How To Read These Guides',
        '<div class="break-strip"><span class="bl">Confidence warning</span><br>' + esc(meta.disclaimer) + '</div>' +
        (meta.highlightTip ? '<div class="note-strip">' + esc(meta.highlightTip) + '</div>' : ''));
    }

    if (!locs.length) {
      html += win('Area Guides', '<div class="empty">No area guides yet.</div>');
    }

    locs.forEach(function (L) {
      var b = '';

      b += '<div class="parch"><strong>Act ' + esc(L.act) + ' &mdash; ' + esc(L.region) + '</strong>' +
           '<div style="margin-top:4px">Recommended level: <strong>' + esc(L.recommendedLevel) + '</strong></div>' +
           (L.partyState ? '<div>' + esc(L.partyState) + '</div>' : '') + '</div>';

      b += '<h3 class="ro-h3">Why you are here</h3>';
      b += '<div class="note-strip"><strong>' + esc(L.why) + '</strong></div>';
      if (L.blocks) b += '<div class="parch alt">Blocked until you do this:' + list(L.blocks, 'details-list') + '</div>';
      if (L.sequencing) b += '<div class="break-strip"><span class="bl">Do it in this order</span><br>' + esc(L.sequencing) + '</div>';

      if (L.prepare) {
        b += '<h3 class="ro-h3">What to prepare</h3><div class="parch">' + list(L.prepare, 'details-list') + '</div>';
      }

      if (L.entrances) {
        b += '<h3 class="ro-h3">Getting in</h3>';
        L.entrances.forEach(function (e) {
          b += '<div class="parch" style="margin-bottom:5px"><strong>' + esc(e.name) + '</strong> ' +
               confBadge(e.confidence) + '<div style="margin-top:4px">' + esc(e.detail) + '</div></div>';
        });
      }

      if (L.walkthrough) {
        b += '<h3 class="ro-h3">Walkthrough</h3><div class="skilltree">';
        L.walkthrough.forEach(function (w) {
          b += '<div class="skillnode"><div class="skillbox">' +
                 '<div class="skillbox-head"><span class="lvl-chip">' + esc(w.step) + '</span>' +
                 '<span class="menu-label">' + esc(w.title) + '</span></div>' +
                 '<div class="skillbox-body"><p class="reason">' + esc(w.what) + '</p>' +
                 (w.watchFor ? '<div class="alts"><strong>Watch for:</strong> ' + esc(w.watchFor) + '</div>' : '') +
                 '</div></div></div>';
        });
        b += '</div>';
      }

      if (L.encounters) {
        b += '<h3 class="ro-h3">Fights</h3>';
        L.encounters.forEach(function (e) {
          b += '<div class="parch" style="margin-bottom:6px"><strong style="color:#24406b">' + esc(e.name) + '</strong>' +
               '<div class="stat-note"><em>Threat: ' + esc(e.threat) + '</em></div>' +
               '<div style="margin-top:5px">' + esc(e.how) + '</div>' +
               (e.roNote ? '<div class="break-strip" style="margin:5px 0 0"><span class="bl">RO note</span><br>' + esc(e.roNote) + '</div>' : '') +
               '</div>';
        });
      }

      if (L.tactics) b += '<h3 class="ro-h3">Tactics</h3><div class="parch">' + list(L.tactics, 'details-list') + '</div>';

      if (L.loot) {
        b += '<h3 class="ro-h3">Loot</h3>';
        L.loot.forEach(function (i) {
          b += '<div class="parch" style="margin-bottom:5px"><strong>' + esc(i.item) + '</strong> ' + confBadge(i.confidence) +
               '<div class="stat-note">Where: ' + esc(i.where) + ' &nbsp;|&nbsp; Confidence: ' + esc(i.confidence) + '</div>' +
               '<div style="margin-top:4px">' + esc(i.note) + '</div></div>';
        });
      }

      if (L.traps) b += '<h3 class="ro-h3">Traps</h3><div class="parch alt">' + list(L.traps, 'details-list') + '</div>';
      if (L.missable) b += '<h3 class="ro-h3">Missable?</h3><div class="note-strip">' + list(L.missable, 'details-list') + '</div>';
      if (L.afterwards) b += '<h3 class="ro-h3">What to do next</h3><div class="parch">' + list(L.afterwards, 'details-list') + '</div>';
      if (L.roFraming) {
        b += '<h3 class="ro-h3">In Ragnarok terms</h3>';
        b += L.roFraming.map(function (t) {
          return '<div class="break-strip"><span class="bl">RO framing</span><br>' + esc(t) + '</div>';
        }).join('');
      }

      html += win(L.name, b);
    });

    els.viewTitle.textContent = 'Area Guides';
    els.view.innerHTML = html;
  }

  var gearFilter = { act: 'all', wearer: 'all' };

  function viewGear() {
    var meta = DB.gear.meta || {};
    var chars = DB.characters.characters || [];
    var html = '';

    if (meta.disclaimer) {
      html += win('Read This First', '<div class="break-strip"><span class="bl">Verify in-game</span><br>' +
        esc(meta.disclaimer) + '</div>' +
        (meta.actNote ? '<div class="note-strip">' + esc(meta.actNote) + '</div>' : '') +
        (meta.vendorTip ? '<div class="note-strip">' + esc(meta.vendorTip) + '</div>' : ''));
    }

    var bar = '<div class="filterbar"><span class="flabel">Act</span>';
    ['all', 'act1', 'act2', 'act3'].forEach(function (a) {
      bar += '<button class="fbtn' + (gearFilter.act === a ? ' on' : '') + '" data-gfilter="act" data-val="' + a + '">' +
             (a === 'all' ? 'All' : a.replace('act', 'Act ')) + '</button>';
    });
    bar += '</div><div class="filterbar"><span class="flabel">Wearer</span>';
    bar += '<button class="fbtn' + (gearFilter.wearer === 'all' ? ' on' : '') + '" data-gfilter="wearer" data-val="all">All</button>';
    chars.forEach(function (c) {
      bar += '<button class="fbtn' + (gearFilter.wearer === c.id ? ' on' : '') + '" data-gfilter="wearer" data-val="' + esc(c.id) + '">' + esc(c.name) + '</button>';
    });
    bar += '</div>';

    var acts = gearFilter.act === 'all' ? ['act1', 'act2', 'act3'] : [gearFilter.act];
    var body = bar;
    var total = 0;

    acts.forEach(function (a) {
      var items = (DB.gear[a] || []).filter(function (g) {
        return gearFilter.wearer === 'all' || g.wearer === gearFilter.wearer;
      });
      if (!items.length) return;
      total += items.length;
      body += '<h3 class="ro-h3">' + a.replace('act', 'Act ') + ' &mdash; ' + items.length + ' item(s)</h3>';
      body += '<div class="slot-grid">' + items.map(gearTile).join('') + '</div>';
    });

    if (!total) body += '<div class="empty">Nothing matches that filter.</div>';

    html += win('Gear by Act', body);
    els.viewTitle.textContent = 'Gear';
    els.view.innerHTML = html;
  }

  function rotationBody(r) {
    var s = '';
    if (r.notes && r.notes.length) {
      s += r.notes.map(function (n) {
        var isBreak = n.indexOf('ANALOGY BREAK') === 0 || n.indexOf('ANALOGY BREAK') > -1;
        return isBreak
          ? '<div class="break-strip"><span class="bl">Analogy break</span><br>' + esc(n) + '</div>'
          : '<div class="note-strip">' + esc(n) + '</div>';
      }).join('');
    }
    s += '<div class="rot-grid">';
    if (r.preCombat) s += '<div class="rot-col pre"><h4>Pre-combat / Camp</h4>' + orderedList(r.preCombat) + '</div>';
    s += '<div class="rot-col opener"><h4>Opener</h4>' + orderedList(r.opener) + '</div>';
    s += '<div class="rot-col sustain"><h4>Sustain</h4>' + orderedList(r.sustain) + '</div>';
    s += '<div class="rot-col panic"><h4>Emergency / Panic</h4>' + orderedList(r.panic) + '</div>';
    s += '</div>';
    return s;
  }

  function orderedList(arr) {
    if (!arr || !arr.length) return '<ul><li>&mdash;</li></ul>';
    return '<ol>' + arr.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>';
  }

  function viewRotations() {
    var meta = DB.rotations.meta || {};
    var html = '';
    var strips = '';
    ['actionEconomy', 'concentrationRule', 'restRule'].forEach(function (k) {
      if (meta[k]) strips += '<div class="note-strip">' + esc(meta[k]) + '</div>';
    });
    if (strips) html += win('Combat Rules That Differ From RO', strips);

    (DB.rotations.rotations || []).forEach(function (r) {
      html += win(r.name || charName(r.characterId), rotationBody(r));
    });

    els.viewTitle.textContent = 'Rotations';
    els.view.innerHTML = html;
  }

  function viewChecklist() {
    var meta = DB.checklist.meta || {};
    var tasks = (DB.checklist.tasks || []).slice().sort(function (a, b) { return a.order - b.order; });
    var doneCount = tasks.filter(function (t) { return doneSet[t.id]; }).length;
    var pct = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;

    var html = '';
    var intro = '';
    if (meta.startingPoint) intro += '<div class="note-strip">' + esc(meta.startingPoint) + '</div>';
    if (meta.respecCost) intro += '<div class="note-strip">' + esc(meta.respecCost) + '</div>';
    if (meta.pointOfNoReturn) intro += '<div class="break-strip"><span class="bl">Point of no return</span><br>' + esc(meta.pointOfNoReturn) + '</div>';
    if (intro) html += win('How To Use This List', intro);

    var body = '<div class="progress-wrap">' +
                 '<div class="progress-bar" style="width:' + pct + '%"></div>' +
                 '<div class="progress-text">' + doneCount + ' / ' + tasks.length + ' complete (' + pct + '%)</div>' +
               '</div>' +
               '<div class="filterbar"><button class="fbtn" id="resetChecklist">Reset progress</button>' +
               '<span class="flabel">Progress is saved in this browser</span></div>';

    var currentAct = null;
    tasks.forEach(function (t) {
      if (t.act !== currentAct) {
        currentAct = t.act;
        body += '<h3 class="ro-h3">Act ' + esc(currentAct) + '</h3>';
      }
      var isDone = !!doneSet[t.id];
      body += '<div class="task' + (isDone ? ' done' : '') + '" data-task="' + esc(t.id) + '">';
      body += '<div class="task-check">' + (isDone ? '&#10003;' : '') + '</div>';
      body += '<div style="flex:1">';
      body += '<div class="task-title"><span class="task-order">' + esc(t.order) + '.</span>' + esc(t.task) + '</div>';
      body += '<div class="task-meta">' + badgeFor(t.characterId) +
              ' &nbsp;Cost: <strong>' + esc(t.cost) + '</strong></div>';
      if (t.detail) body += '<div class="task-detail">' + esc(t.detail) + '</div>';
      if (t.warning) body += '<div class="task-warn"><strong>WARNING:</strong> ' + esc(t.warning) + '</div>';
      body += '</div></div>';
    });

    html += win('Chronological Action Checklist', body);
    els.viewTitle.textContent = 'Checklist';
    els.view.innerHTML = html;
  }

  /* ---------- search ---------- */

  function collectSearchIndex() {
    var idx = [];

    (DB.characters.characters || []).forEach(function (c) {
      idx.push({ kind: 'Character', title: c.name, text: [c.bg3Build, c.role, c.roClass, c.summary].join(' '), route: '#/character/' + c.id });
      (c.levels || []).forEach(function (lv) {
        idx.push({
          kind: c.name + ' — Level ' + lv.level,
          title: lv.choice,
          text: [lv.menu, lv.reasoning, (lv.alternatives || []).join(' '), (lv.details || []).join(' ')].join(' '),
          route: '#/character/' + c.id
        });
      });
      (c.roMapping || []).forEach(function (m) {
        idx.push({ kind: c.name + ' — Mapping', title: m.roSkill + ' to ' + m.bg3, text: m.breaks, route: '#/character/' + c.id });
      });
    });

    ['act1', 'act2', 'act3'].forEach(function (a) {
      (DB.gear[a] || []).forEach(function (g) {
        idx.push({
          kind: 'Gear — ' + a.replace('act', 'Act '),
          title: g.item,
          text: [g.effect, g.location, g.slot, g.replaces, g.note, charName(g.wearer)].join(' '),
          route: '#/gear'
        });
      });
    });

    (DB.rotations.rotations || []).forEach(function (r) {
      idx.push({
        kind: 'Rotation',
        title: r.name || charName(r.characterId),
        text: [].concat(r.preCombat || [], r.opener || [], r.sustain || [], r.panic || [], r.notes || []).join(' '),
        route: '#/rotations'
      });
    });

    (DB.checklist.tasks || []).forEach(function (t) {
      idx.push({
        kind: 'Checklist — Act ' + t.act,
        title: t.order + '. ' + t.task,
        text: [t.detail, t.warning, t.cost, charName(t.characterId)].join(' '),
        route: '#/checklist'
      });
    });

    ((DB.locations && DB.locations.locations) || []).forEach(function (L) {
      idx.push({
        kind: 'Area Guide — Act ' + L.act,
        title: L.name,
        text: [L.region, L.why, L.sequencing, (L.prepare || []).join(' '), (L.tactics || []).join(' '),
               (L.roFraming || []).join(' '), (L.afterwards || []).join(' ')].join(' '),
        route: '#/locations'
      });
      (L.walkthrough || []).forEach(function (w) {
        idx.push({
          kind: L.name + ' — Step ' + w.step,
          title: w.title,
          text: [w.what, w.watchFor].join(' '),
          route: '#/locations'
        });
      });
      (L.loot || []).forEach(function (i) {
        idx.push({
          kind: L.name + ' — Loot',
          title: i.item,
          text: [i.where, i.note, i.confidence].join(' '),
          route: '#/locations'
        });
      });
      (L.encounters || []).forEach(function (e) {
        idx.push({
          kind: L.name + ' — Fight',
          title: e.name,
          text: [e.threat, e.how, e.roNote].join(' '),
          route: '#/locations'
        });
      });
    });

    return idx;
  }

  var SEARCH_INDEX = null;

  function highlight(text, q) {
    var i = text.toLowerCase().indexOf(q);
    if (i < 0) return esc(text.slice(0, 120));
    var start = Math.max(0, i - 40);
    var snip = (start > 0 ? '...' : '') + text.slice(start, i + q.length + 70);
    var at = snip.toLowerCase().indexOf(q);
    return esc(snip.slice(0, at)) + '<mark>' + esc(snip.slice(at, at + q.length)) + '</mark>' + esc(snip.slice(at + q.length));
  }

  function runSearch() {
    var q = els.search.value.trim().toLowerCase();
    if (q.length < 2) { els.searchResults.innerHTML = ''; return; }
    if (!SEARCH_INDEX) SEARCH_INDEX = collectSearchIndex();

    var hits = [];
    for (var i = 0; i < SEARCH_INDEX.length && hits.length < 40; i++) {
      var e = SEARCH_INDEX[i];
      var hay = (e.title + ' ' + e.text).toLowerCase();
      if (hay.indexOf(q) > -1) hits.push(e);
    }

    if (!hits.length) { els.searchResults.innerHTML = '<div class="empty">No matches.</div>'; return; }

    els.searchResults.innerHTML = hits.map(function (h) {
      return '<div class="search-hit" data-route="' + esc(h.route) + '">' +
               '<div class="hit-kind">' + esc(h.kind) + '</div>' +
               '<div class="hit-title">' + esc(h.title) + '</div>' +
               '<div class="hit-snip">' + highlight(h.title + ' ' + h.text, q) + '</div>' +
             '</div>';
    }).join('');
  }

  /* ---------- router ---------- */

  function route() {
    var hash = location.hash.replace(/^#/, '') || '/overview';
    markActive(hash);
    window.scrollTo(0, 0);

    if (hash === '/overview') return viewOverview();
    if (hash.indexOf('/character/') === 0) return viewCharacter(hash.split('/')[2]);
    if (hash === '/progression') return viewProgression();
    if (hash === '/locations') return viewLocations();
    if (hash === '/gear') return viewGear();
    if (hash === '/rotations') return viewRotations();
    if (hash === '/checklist') return viewChecklist();

    els.view.innerHTML = win('Not found', '<div class="empty">Unknown route: ' + esc(hash) + '</div>');
  }

  /* ---------- delegated events ---------- */

  document.addEventListener('click', function (ev) {
    var hit = ev.target.closest ? ev.target.closest('.search-hit') : null;
    if (hit) { location.hash = hit.getAttribute('data-route'); return; }

    var fbtn = ev.target.closest ? ev.target.closest('[data-gfilter]') : null;
    if (fbtn) {
      gearFilter[fbtn.getAttribute('data-gfilter')] = fbtn.getAttribute('data-val');
      viewGear();
      return;
    }

    if (ev.target.id === 'resetChecklist') {
      doneSet = {};
      saveDone();
      viewChecklist();
      return;
    }

    var task = ev.target.closest ? ev.target.closest('[data-task]') : null;
    if (task) {
      var id = task.getAttribute('data-task');
      if (doneSet[id]) delete doneSet[id]; else doneSet[id] = true;
      saveDone();
      viewChecklist();
    }
  });

  els.search.addEventListener('input', runSearch);

  window.addEventListener('hashchange', route);

  /* ---------- boot ---------- */

  function fetchJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error(path + ' -> HTTP ' + r.status);
      return r.json();
    });
  }

  /* Two supply routes for the same data, one codebase:
       - Normal folder (dev, or GitHub Pages): fetch the four JSON files.
       - Single-file build from build.js: the data is already inlined on
         window.__BG3_DATA__, so no fetch happens and file:// works too.
     JSON files stay the single source of truth in both cases. */
  var source = window.__BG3_DATA__
    ? Promise.resolve([
        window.__BG3_DATA__.characters,
        window.__BG3_DATA__.gear,
        window.__BG3_DATA__.rotations,
        window.__BG3_DATA__.checklist,
        window.__BG3_DATA__.locations
      ])
    : Promise.all([
        fetchJSON('data/characters.json'),
        fetchJSON('data/gear.json'),
        fetchJSON('data/rotations.json'),
        fetchJSON('data/checklist.json'),
        fetchJSON('data/locations.json')
      ]);

  source.then(function (res) {
    DB.characters = res[0];
    DB.gear = res[1];
    DB.rotations = res[2];
    DB.checklist = res[3];
    DB.locations = res[4] || { locations: [] };

    var meta = DB.characters.meta || {};
    if (meta.title) document.title = meta.title;

    buildNav();
    route();
  }).catch(function (err) {
    els.view.innerHTML =
      '<div class="error-box"><strong>Could not load the build data.</strong>' +
      '<p>This wiki reads its content from the JSON files with <code>fetch()</code>, which browsers block on ' +
      'the <code>file://</code> protocol. Opening index.html by double-clicking it will always fail with a CORS error.</p>' +
      '<p>Serve the folder over HTTP instead:</p>' +
      '<code>npx -y http-server . -p 8126 -c-1</code>' +
      '<p>Then open <strong>http://localhost:8126</strong></p>' +
      '<code>' + esc(err.message) + '</code></div>';
  });
})();
