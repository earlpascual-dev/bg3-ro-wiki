#!/usr/bin/env node
/* ==========================================================================
   build.js — optional packaging step for bg3-ro-wiki.

   Produces dist/bg3-ro-wiki.html: one self-contained file with the CSS, the
   JS and all four JSON data files inlined. That single file works from
   file:// (no server needed) as well as over HTTP.

   You do NOT need this to deploy. The plain folder already works on any HTTP
   host, GitHub Pages included. This exists only for the single-file variant.

   The JSON files remain the source of truth — this reads them, it never
   writes them. Re-run it after editing data/*.json.

   Zero dependencies. Requires only Node.

     node build.js
   ========================================================================== */

'use strict';

var fs = require('fs');
var path = require('path');

var root = __dirname;
/* Must stay in sync with the fetch list in js/app.js. Adding a data file to
   one and not the other silently drops it from the single-file build. */
var DATA_FILES = ['characters', 'gear', 'rotations', 'checklist', 'locations'];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function kb(str) {
  return (Buffer.byteLength(str, 'utf8') / 1024).toFixed(1) + ' KB';
}

/* Escaping < prevents a "</script>" inside any string value from closing the
   inline script tag early. < is a valid escape in both JSON and JS. */
function embed(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function main() {
  var html = read('index.html');
  var css = read('css/styles.css');
  var js = read('js/app.js');

  var data = {};
  DATA_FILES.forEach(function (name) {
    var raw = read(path.join('data', name + '.json'));
    try {
      data[name] = JSON.parse(raw);
    } catch (e) {
      console.error('\n  data/' + name + '.json is not valid JSON:\n  ' + e.message + '\n');
      process.exit(1);
    }
  });

  var linkTag = '<link rel="stylesheet" href="css/styles.css">';
  var scriptTag = '<script src="js/app.js"></script>';

  if (html.indexOf(linkTag) === -1 || html.indexOf(scriptTag) === -1) {
    console.error('\n  index.html no longer contains the expected asset tags.');
    console.error('  build.js needs these exact strings to substitute:');
    console.error('    ' + linkTag);
    console.error('    ' + scriptTag + '\n');
    process.exit(1);
  }

  /* Guard against the two lists drifting apart again: every data/*.json on
     disk must be in DATA_FILES, or it would be silently omitted. */
  var onDisk = fs.readdirSync(path.join(root, 'data'))
    .filter(function (f) { return /\.json$/.test(f); })
    .map(function (f) { return f.replace(/\.json$/, ''); });
  var missed = onDisk.filter(function (n) { return DATA_FILES.indexOf(n) === -1; });
  if (missed.length) {
    console.error('\n  data/' + missed.join('.json, data/') + '.json exists but is not in DATA_FILES.');
    console.error('  Add it to build.js AND to the fetch list in js/app.js, then rebuild.\n');
    process.exit(1);
  }

  var out = html
    .replace(linkTag, '<style>\n' + css + '\n</style>')
    .replace(scriptTag,
      '<script>window.__BG3_DATA__ = ' + embed(data) + ';</script>\n' +
      '<script>\n' + js + '\n</script>');

  var distDir = path.join(root, 'dist');
  fs.mkdirSync(distDir, { recursive: true });

  var outPath = path.join(distDir, 'bg3-ro-wiki.html');
  fs.writeFileSync(outPath, out, 'utf8');

  console.log('\n  Built dist/bg3-ro-wiki.html');
  console.log('    html   ' + kb(html));
  console.log('    css    ' + kb(css));
  console.log('    js     ' + kb(js));
  DATA_FILES.forEach(function (n) {
    console.log('    ' + (n + '           ').slice(0, 11) + kb(JSON.stringify(data[n])));
  });
  console.log('    ------');
  console.log('    total  ' + kb(out));
  console.log('\n  Self-contained. Open it directly or host it anywhere.\n');
}

main();
