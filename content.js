// Aster YouTube Recovery V2 - content script
(() => {
  if (window.__ASTER_YT_RECOVERY_V2__) return;
  window.__ASTER_YT_RECOVERY_V2__ = true;

  const STATE = {
    lastTime: 0,
    lastAdvanceAt: Date.now(),
    lastCheckpointAt: 0,
    lastErrorAt: 0,
    video: null,
    url: location.href
  };

  function videoId() {
    try {
      const u = new URL(location.href);
      if (u.hostname === "youtu.be") return u.pathname.replace(/^\/+/, "").split("/")[0] || "";
      if (u.pathname === "/watch") return u.searchParams.get("v") || "";
      const m = u.pathname.match(/\/(?:shorts|embed)\/([^/?#]+)/);
      return m ? m[1] : "";
    } catch (_) {
      return "";
    }
  }

  function send(type, extra = {}) {
    try {
      browser.runtime.sendMessage({
        aster: true,
        type,
        source: "youtube",
        url: location.href,
        videoId: videoId(),
        at: Date.now(),
        ...extra
      });
    } catch (_) {}
  }

  function checkpoint(reason = "interval") {
    const v = document.querySelector("video");
    if (!v || !Number.isFinite(v.currentTime)) return;

    STATE.lastTime = v.currentTime;
    STATE.lastCheckpointAt = Date.now();

    send("ASTER_MEDIA_CHECKPOINT", {
      reason,
      seconds: Math.max(0, Math.floor(v.currentTime)),
      duration: Number.isFinite(v.duration) ? Math.floor(v.duration) : null,
      paused: !!v.paused,
      ended: !!v.ended,
      readyState: v.readyState,
      networkState: v.networkState
    });
  }

  function reportError(reason, detail = {}) {
    const now = Date.now();
    if (now - STATE.lastErrorAt < 8000) return;
    STATE.lastErrorAt = now;

    const v = document.querySelector("video");
    if (v && Number.isFinite(v.currentTime)) STATE.lastTime = v.currentTime;

    send("ASTER_MEDIA_ERROR", {
      reason,
      seconds: Math.max(0, Math.floor(STATE.lastTime || 0)),
      readyState: v ? v.readyState : null,
      networkState: v ? v.networkState : null,
      mediaErrorCode: v && v.error ? v.error.code : null,
      ...detail
    });
  }

  function bindVideo() {
    const v = document.querySelector("video");
    if (!v || v === STATE.video) return;
    STATE.video = v;
    STATE.lastTime = Number.isFinite(v.currentTime) ? v.currentTime : 0;
    STATE.lastAdvanceAt = Date.now();

    v.addEventListener("timeupdate", () => {
      if (v.currentTime > STATE.lastTime + 0.15) {
        STATE.lastTime = v.currentTime;
        STATE.lastAdvanceAt = Date.now();
      }
    });

    v.addEventListener("error", () => {
      checkpoint("video-error");
      reportError("video_error");
    });

    v.addEventListener("stalled", () => {
      checkpoint("stalled");
      setTimeout(() => {
        if (!v.paused && !v.ended && v.readyState < 3) reportError("stalled");
      }, 9000);
    });

    v.addEventListener("waiting", () => {
      const waitingAt = Date.now();
      setTimeout(() => {
        if (
          STATE.video === v &&
          !v.paused &&
          !v.ended &&
          Date.now() - waitingAt >= 9000 &&
          v.readyState < 3
        ) reportError("waiting_too_long");
      }, 9500);
    });

    v.addEventListener("pause", () => checkpoint("pause"));
    v.addEventListener("ended", () => checkpoint("ended"));
    v.addEventListener("loadedmetadata", () => checkpoint("metadata"));
  }

  function detectYouTubeErrorOverlay() {
    const selectors = [
      ".ytp-error",
      ".ytp-error-content-wrap",
      "yt-playability-error-supported-renderers",
      "ytd-player-error-message-renderer"
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.getClientRects().length) {
        const text = (el.innerText || el.textContent || "").trim().slice(0, 300);
        if (text) {
          checkpoint("youtube-error-ui");
          reportError("youtube_error_ui", { message: text });
          return;
        }
      }
    }
  }

  setInterval(() => {
    bindVideo();
    detectYouTubeErrorOverlay();

    const v = STATE.video;
    if (!v) return;

    if (!v.paused && !v.ended && v.readyState < 3 &&
        Date.now() - STATE.lastAdvanceAt > 12000) {
      checkpoint("playback-not-advancing");
      reportError("playback_not_advancing");
    }

    if (Date.now() - STATE.lastCheckpointAt > 5000) checkpoint("interval");
  }, 2000);

  // YouTube is an SPA: detect navigation without requiring a full page reload.
  setInterval(() => {
    if (location.href !== STATE.url) {
      checkpoint("navigation");
      STATE.url = location.href;
      STATE.video = null;
      STATE.lastAdvanceAt = Date.now();
      send("ASTER_MEDIA_NAVIGATION", {});
    }
  }, 1000);

  bindVideo();
  checkpoint("startup");
})();
