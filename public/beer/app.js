(() => {
  const config = window.BEER_APP_CONFIG || {};
  const publicUrl = config.publicUrl || "https://ivansays.com/beer";
  const stripePaymentLink = config.stripePaymentLink || "";

  const tipButton = document.getElementById("tipButton");
  const shareButton = document.getElementById("shareButton");
  const copyButton = document.getElementById("copyButton");
  const installButton = document.getElementById("installButton");
  const statusMessage = document.getElementById("statusMessage");

  const showStatus = (message) => {
    statusMessage.textContent = message;
    window.setTimeout(() => {
      if (statusMessage.textContent === message) statusMessage.textContent = "";
    }, 2800);
  };

  const ready =
    stripePaymentLink &&
    !stripePaymentLink.includes("REPLACE_WITH_YOUR_PAYMENT_LINK");

  if (ready) {
    tipButton.href = stripePaymentLink;
    tipButton.target = "_blank";
  } else {
    tipButton.addEventListener("click", (event) => {
      event.preventDefault();
      showStatus("Stripe payment link has not been configured yet.");
    });
  }

  shareButton.addEventListener("click", async () => {
    const shareData = {
      title: "Buy Ivan a Beer",
      text: "Tip Ivan for internet nonsense.",
      url: publicUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(publicUrl);
        showStatus("Link copied.");
      }
    } catch (error) {
      if (error && error.name !== "AbortError") showStatus("Could not share the link.");
    }
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      showStatus("Copied: " + publicUrl);
    } catch {
      showStatus(publicUrl);
    }
  });

  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installButton.hidden = true;
    showStatus("Installed.");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/beer/sw.js").catch(() => {});
    });
  }
})();
