/* Shared helper: read today's Sai Message for the Day from the official
   SSSIO home page HTML. The quote is server-rendered in a Drupal Views
   block (weekly_quote_view, display homepage). There is no public CORS
   API or RSS item for this message. */
'use strict';

var SOURCE_URL = 'https://www.sathyasai.org/';
var FILES_BASE = 'https://www.sathyasai.org/sites/default/files/';

function decodeEntities(text) {
  if (!text) return '';
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
    .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); });
}

function stripTags(html) {
  return decodeEntities(String(html || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function fieldContent(block, fieldClass) {
  var re = new RegExp(
    fieldClass + '[\\s\\S]*?<div class="field-content">([\\s\\S]*?)</div>'
  );
  var m = block.match(re);
  return m ? m[1] : '';
}

function extractSaiMessage(html) {
  if (!html) return null;
  var start = html.indexOf('<div class="thought-for-the-day">');
  if (start < 0) return null;
  var after = html.indexOf('<div class="col-dsm-4', start + 1);
  var end = after > start ? after : start + 10000;
  var block = html.slice(start, end);

  var textHtml = fieldContent(block, 'views-field-field-quote-text');
  var refHtml = fieldContent(block, 'views-field-field-quote-reference');
  var text = stripTags(textHtml);
  var cite = stripTags(refHtml);
  if (!text || !cite) return null;

  var citeUrl = '';
  var href = String(refHtml).match(/href="([^"]+)"/i);
  if (href) citeUrl = decodeEntities(href[1]);

  var title = 'Sai Message for the Day';
  var titleMatch = block.match(/class="tftd-title">([\s\S]*?)</);
  if (titleMatch) {
    var t = stripTags(titleMatch[1]);
    if (t) title = t;
  }

  var imageUrl = '';
  var pre = html.slice(Math.max(0, start - 20000), start);
  var feat = pre.lastIndexOf('featured-image');
  if (feat >= 0) {
    var featChunk = pre.slice(feat);
    var rel = featChunk.match(/imgRelPath(?:&quot;|")\s*:\s*(?:&quot;|")([^&"]+)(?:&quot;|")/);
    if (rel) {
      var relPath = rel[1].replace(/\\\//g, '/').replace(/^\/+/, '');
      imageUrl = FILES_BASE + relPath;
    }
  }

  return {
    text: text,
    cite: cite,
    citeUrl: citeUrl || '',
    imageUrl: imageUrl || '',
    sourceUrl: SOURCE_URL,
    sourceTitle: title
  };
}

async function fetchOfficialHtml() {
  var res = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent': 'Region7SaiCenters/1.0 (sai-message preview)',
      'Accept': 'text/html'
    },
    redirect: 'follow'
  });
  if (!res.ok) {
    throw new Error('sathyasai.org returned HTTP ' + res.status);
  }
  return res.text();
}

async function fetchOfficialMessage() {
  var html = await fetchOfficialHtml();
  var data = extractSaiMessage(html);
  if (!data) throw new Error('Could not parse Sai Message for the Day from sathyasai.org');
  data.fetchedAt = new Date().toISOString();
  return data;
}

module.exports = {
  SOURCE_URL: SOURCE_URL,
  extractSaiMessage: extractSaiMessage,
  fetchOfficialMessage: fetchOfficialMessage
};
