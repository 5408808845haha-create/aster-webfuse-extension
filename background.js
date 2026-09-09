// Aster YouTube Recovery V2 - Webfuse background
browser.runtime.onMessage.addListener((message, sender) => {
  if (!message || message.aster !== true) return;

  const payload = {
    ...message,
    ssid: sender && sender.tab && Number.isFinite(Number(sender.tab.id))
      ? Number(sender.tab.id)
      : null
  };

  try {
    browser.webfuseSession.broadcastMessage(JSON.stringify({
      aster: true,
      payload
    }));
  } catch (error) {
    console.error("[Aster YT Recovery] broadcast failed", error);
  }
});
