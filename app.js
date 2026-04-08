function renderBootstrapError(error) {
  const message = error && error.message ? error.message : "Unable to start the app.";
  const box = document.createElement("div");
  box.style.margin = "20px";
  box.style.padding = "16px";
  box.style.borderRadius = "16px";
  box.style.background = "#fff4f4";
  box.style.border = "1px solid #f1b7b7";
  box.style.color = "#9f1f1f";
  box.style.fontFamily = '"Trebuchet MS", "Segoe UI", sans-serif';
  box.innerHTML = `<strong>App startup issue</strong><p style="margin:8px 0 0;">${message}</p>`;
  document.body.prepend(box);
}

window.addEventListener("error", (event) => {
  renderBootstrapError(event.error || new Error(event.message || "Unknown script error"));
});

window.addEventListener("unhandledrejection", (event) => {
  renderBootstrapError(event.reason || new Error("Unhandled app error"));
});

import("./src/main.js").catch((error) => {
  renderBootstrapError(error);
});
