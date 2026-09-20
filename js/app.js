/**
 * Prometheus Flow Knowledge — load JSON, render, filter, search, export.
 */
(function () {
  "use strict";

  const DATA_URL = "data/tidbits.json";

  const TIER_CLASS = {
    Established: "badge-established",
    Promising: "badge-promising",
    Speculative: "badge-speculative",
    Contested: "badge-contested",
  };

  let data = null;
  let activeTier = "all";
  let activeTheme = null;
  let searchQuery = "";

  const els = {
    themes: document.getElementById("theme-grid"),
    list: document.getElementById("tidbit-list"),
    meta: document.getElementById("results-meta"),
    search: document.getElementById("search-input"),
    tierFilters: document.getElementById("tier-filters"),
    exportBtn: document.getElementById("export-btn"),
    lane: document.getElementById("lane-note"),
    tagline: document.getElementById("tagline"),
  };

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function themeTitle(id) {
    const t = (data.themes || []).find(function (th) {
      return th.id === id;
    });
    return t ? t.title : id;
  }

  function renderLane() {
    if (!data.lane || !els.lane) return;
    els.lane.innerHTML =
      "<strong>Prometheus</strong> — " +
      escapeHtml(data.lane.prometheus) +
      '<span class="sep">·</span>' +
      "<strong>Helix</strong> — " +
      escapeHtml(data.lane.helix) +
      " (hand off, do not duplicate)";
  }

  function renderThemes() {
    if (!els.themes) return;
    const themes = data.themes || [];
    els.themes.innerHTML = themes
      .map(function (th) {
        const active = activeTheme === th.id ? " active" : "";
        return (
          '<button type="button" class="theme-chip' +
          active +
          '" data-theme="' +
          escapeHtml(th.id) +
          '" title="' +
          escapeHtml(th.notes) +
          '">' +
          '<span class="theme-title">' +
          escapeHtml(th.title) +
          "</span>" +
          '<span class="theme-notes">' +
          escapeHtml(th.notes) +
          "</span>" +
          "</button>"
        );
      })
      .join("");

    els.themes.querySelectorAll(".theme-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.getAttribute("data-theme");
        activeTheme = activeTheme === id ? null : id;
        renderThemes();
        renderTidbits();
      });
    });
  }

  function renderTierFilters() {
    if (!els.tierFilters) return;
    const tiers = ["all"].concat(data.evidenceTiers || []);
    els.tierFilters.innerHTML = tiers
      .map(function (tier) {
        const label = tier === "all" ? "All tiers" : tier;
        const active = activeTier === tier ? " active" : "";
        return (
          '<button type="button" class="filter-btn' +
          active +
          '" data-tier="' +
          escapeHtml(tier) +
          '">' +
          escapeHtml(label) +
          "</button>"
        );
      })
      .join("");

    els.tierFilters.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeTier = btn.getAttribute("data-tier");
        renderTierFilters();
        renderTidbits();
      });
    });
  }

  function matchesSearch(t, q) {
    if (!q) return true;
    const hay = [
      t.title,
      t.claim,
      t.caveats,
      t.practice,
      t.evidenceTier,
      (t.themeIds || []).map(themeTitle).join(" "),
      (t.sources || [])
        .map(function (s) {
          return (s.citation || "") + " " + (s.doiOrUrl || "");
        })
        .join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function filteredTidbits() {
    const all = (data.tidbits || []).filter(function (t) {
      return t.status === "active";
    });
    return all.filter(function (t) {
      if (activeTier !== "all" && t.evidenceTier !== activeTier) return false;
      if (activeTheme && !(t.themeIds || []).includes(activeTheme)) return false;
      if (!matchesSearch(t, searchQuery)) return false;
      return true;
    });
  }

  function renderSources(sources) {
    if (!sources || !sources.length) return "";
    const items = sources
      .map(function (s) {
        const cite = escapeHtml(s.citation || "");
        const url = s.doiOrUrl ? escapeHtml(s.doiOrUrl) : "";
        const n = s.n ? '<span class="n">N: ' + escapeHtml(s.n) + "</span>" : "";
        const link = url
          ? '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + cite + "</a>"
          : cite;
        return "<li>" + link + n + "</li>";
      })
      .join("");
    return (
      '<div class="meta-block"><span class="meta-label">Sources</span><ul class="sources">' +
      items +
      "</ul></div>"
    );
  }

  function renderCard(t) {
    const badgeClass = TIER_CLASS[t.evidenceTier] || "badge-speculative";
    const tags = (t.themeIds || [])
      .map(function (id) {
        return '<span class="theme-tag">' + escapeHtml(themeTitle(id)) + "</span>";
      })
      .join("");
    const dates =
      "Added " +
      escapeHtml(t.added || "—") +
      " · Reviewed " +
      escapeHtml(t.lastReviewed || "—");

    return (
      '<article class="tidbit-card" data-id="' +
      escapeHtml(t.id) +
      '">' +
      '<div class="card-top">' +
      "<h2>" +
      escapeHtml(t.title) +
      "</h2>" +
      '<span class="badge ' +
      badgeClass +
      '">' +
      escapeHtml(t.evidenceTier) +
      "</span>" +
      "</div>" +
      '<p class="claim">' +
      escapeHtml(t.claim) +
      "</p>" +
      (t.caveats
        ? '<div class="meta-block"><span class="meta-label">Caveats</span><p class="caveats">' +
          escapeHtml(t.caveats) +
          "</p></div>"
        : "") +
      renderSources(t.sources) +
      (t.practice
        ? '<div class="meta-block"><span class="meta-label">Practice</span><p class="practice">' +
          escapeHtml(t.practice) +
          "</p></div>"
        : "") +
      '<div class="tag-row">' +
      tags +
      '<span class="dates">' +
      dates +
      "</span>" +
      "</div>" +
      "</article>"
    );
  }

  function renderTidbits() {
    if (!els.list) return;
    const items = filteredTidbits();
    const total = (data.tidbits || []).filter(function (t) {
      return t.status === "active";
    }).length;

    if (els.meta) {
      els.meta.textContent =
        "Showing " + items.length + " of " + total + " active tidbit" + (total === 1 ? "" : "s");
    }

    if (!items.length) {
      els.list.innerHTML =
        '<div class="empty-state">No tidbits match the current filters. Clear search or reset tier/theme.</div>';
      return;
    }

    els.list.innerHTML = items.map(renderCard).join("");
  }

  function exportJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tidbits.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function bindControls() {
    if (els.search) {
      els.search.addEventListener("input", function () {
        searchQuery = els.search.value.trim().toLowerCase();
        renderTidbits();
      });
    }
    if (els.exportBtn) {
      els.exportBtn.addEventListener("click", exportJson);
    }
  }

  function showError(msg) {
    if (els.list) {
      els.list.innerHTML = '<div class="error-state">' + escapeHtml(msg) + "</div>";
    }
    if (els.meta) els.meta.textContent = "";
  }

  async function load() {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error("HTTP " + res.status);
      data = await res.json();
    } catch (err) {
      showError(
        "Could not load data/tidbits.json (" +
          (err && err.message ? err.message : "error") +
          "). Serve the site over HTTP (e.g. python -m http.server) rather than opening the file directly if fetch fails."
      );
      return;
    }

    if (els.tagline && data.purpose) {
      els.tagline.textContent = data.purpose;
    }

    renderLane();
    renderThemes();
    renderTierFilters();
    bindControls();
    renderTidbits();
  }

  load();
})();
