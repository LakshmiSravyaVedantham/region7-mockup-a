/* Refresh the static snapshot at sai-message.json.
   Run from the site root: node scripts/fetch-sai-message.js
   Use this before a static deploy (GitHub Pages) or local preview
   when the Vercel /api/sai-message function is not available. */
'use strict';

var fs = require('fs');
var path = require('path');
var lib = require('../lib/sai-message');

var outFile = path.join(__dirname, '..', 'sai-message.json');

lib.fetchOfficialMessage()
  .then(function (data) {
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2) + '\n');
    console.log('Wrote', outFile);
    console.log(data.cite);
    console.log(data.text.slice(0, 120) + (data.text.length > 120 ? '...' : ''));
    if (data.imageUrl) console.log('image:', data.imageUrl);
  })
  .catch(function (err) {
    console.error(err);
    process.exit(1);
  });
