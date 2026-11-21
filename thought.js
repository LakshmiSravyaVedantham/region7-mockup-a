/* Thought for the day (Home): show today's official Sai Message for the Day
   from sathyasai.org. The official page has no CORS headers, so the
   browser first tries the same-origin /api/sai-message function (Vercel).
   If that is not available, it uses the static snapshot sai-message.json.
   If both fail, it falls back to local quotes in thoughts-data.js. */
(function () {
  var SOURCE_URL = "https://www.sathyasai.org/";
  var box = document.querySelector("[data-thought]");
  if (!box) return;
  var textEl = box.querySelector(".thought-text");
  var citeEl = box.querySelector(".thought-cite");
  var btn = box.querySelector(".thought-next");
  var officialLink = box.querySelector(".thought-source a");
  var local = window.R7_THOUGHTS || [];

  function setCite(cite, href) {
    citeEl.textContent = "";
    if (href) {
      var a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = cite;
      citeEl.appendChild(a);
    } else {
      citeEl.textContent = cite;
    }
  }

  function showOfficial(data) {
    if (!data || !data.text || !isFresh(data.fetchedAt)) return false;
    textEl.textContent = data.text;
    setCite(data.cite || "", data.citeUrl || "");
    if (officialLink) {
      officialLink.href = data.sourceUrl || SOURCE_URL;
    }
    box.classList.add("is-official");
    box.classList.remove("is-changing");
    if (btn) btn.hidden = true;
    return true;
  }

  function isFresh(fetchedAt) {
    if (!fetchedAt) return false;
    var fetched = new Date(fetchedAt);
    if (isNaN(fetched.getTime())) return false;
    var now = new Date();
    return fetched.getFullYear() === now.getFullYear() &&
      fetched.getMonth() === now.getMonth() &&
      fetched.getDate() === now.getDate();
  }

  function showLocal() {
    if (!local.length || !textEl) return;
    if (officialLink) officialLink.textContent = "Visit sathyasai.org for today's thought";
    var start = new Date(new Date().getFullYear(), 0, 0);
    var day = Math.floor((new Date() - start) / 864e5);
    var i = day % local.length;
    function put(k, animate) {
      var q = local[k];
      function write() {
        textEl.textContent = q.text;
        setCite(q.cite, "");
        box.classList.remove("is-changing");
      }
      if (animate) {
        box.classList.add("is-changing");
        setTimeout(write, 380);
      } else write();
    }
    put(i, false);
    if (btn) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        i = (i + 1) % local.length;
        put(i, true);
      });
    }
  }

  function getJson(url) {
    return fetch(url, { credentials: "same-origin" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  getJson("api/sai-message")
    .then(function (data) {
      if (!showOfficial(data)) throw new Error("empty");
    })
    .catch(function () {
      return getJson("sai-message.json").then(function (data) {
        if (!showOfficial(data)) throw new Error("empty snapshot");
      });
    })
    .catch(function () {
      showLocal();
    });
})();
