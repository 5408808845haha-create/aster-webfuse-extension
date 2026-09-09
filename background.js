// Aster YouTube Recovery V2.2 - background diagnostics
(function () {
  const safeBroadcast = (payload) => {
    try {
      browser.webfuseSession.broadcastMessage(JSON.stringify({
        aster: true,
        payload
      }));
    } catch (error) {
      console.error("[Aster YT Recovery] broadcast failed", error);
    }
  };

  // Prove background loaded.
  safeBroadcast({
    type: "ASTER_BACKGROUND_ALIVE",
    source: "background",
    at: Date.now()
  });

  browser.runtime.onMessage.addListener((message, sender) => {
    if (!message || message.aster !== true) return;

    const ssid = sender && sender.tab && Number.isFinite(Number(sender.tab.id))
      ? Number(sender.tab.id)
      : null;

    safeBroadcast({
      ...message,
      ssid
    });

    if (message.type === "ASTER_EXTENSION_ALIVE") {
      safeBroadcast({
        type: "ASTER_BACKGROUND_ACK",
        source: "background",
        ssid,
        at: Date.now()
      });
    }
  });
})();
