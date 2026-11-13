/* Vercel serverless function. Browser requests to sathyasai.org are
   blocked by CORS, so this same-origin endpoint fetches the official
   home page and returns today's Sai Message for the Day as JSON.
   Not used on GitHub Pages; the static sai-message.json file is the fallback. */
'use strict';

var lib = require('../lib/sai-message');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    var data = await lib.fetchOfficialMessage();
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = 502;
    res.end(JSON.stringify({
      error: "Could not load today's Sai Message for the Day from sathyasai.org.",
      details: String(err && err.message ? err.message : err)
    }));
  }
};
