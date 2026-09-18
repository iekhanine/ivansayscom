(() => {
  const cfg = window.BEER_APP_CONFIG || {};
  const publicUrl = cfg.publicUrl || "https://ivansays.com/beer";
  const link = cfg.squarePaymentLink || "";
  const pay = document.getElementById("payButton");
  const status = document.getElementById("status");
  const install = document.getElementById("installButton");

  const ready = link && !link.includes("REPLACE_WITH_YOUR_SQUARE_LINK");
  if (ready) {
    pay.href = link;
    pay.target = "_blank";
    pay.rel = "noopener noreferrer";
  } else {
    pay.onclick = (e) => {
      e.preventDefault();
      status.textContent = "Add your Square Payment Link in /beer/config.js.";
    };
  }

  document.getElementById("copyButton").onclick = async () => {
    await navigator.clipboard.writeText(publicUrl);
    status.textContent = "Copied: " + publicUrl;
  };

  document.getElementById("shareButton").onclick = async () => {
    if (navigator.share) {
      try { await navigator.share({title:"Buy Ivan a Beer", text:"Tip Ivan on IvanSays.", url:publicUrl}); } catch {}
    } else {
      await navigator.clipboard.writeText(publicUrl);
      status.textContent = "Link copied.";
    }
  };

  let promptEvent;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    promptEvent = e;
    install.hidden = false;
  });
  install.onclick = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    install.hidden = true;
    promptEvent = null;
  };

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/beer/sw.js"));
  }
})();
