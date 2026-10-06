import QRCode from "qrcode";

function initQrMaker() {
  const root = document.querySelector<HTMLElement>("[data-qr-maker]");
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = "true";

  const form = root.querySelector<HTMLFormElement>("form")!;
  const content = form.querySelector<HTMLTextAreaElement>('[name="content"]')!;
  content.defaultValue = content.defaultValue.trim();
  content.value = content.defaultValue;
  const foreground = form.querySelector<HTMLInputElement>(
    '[name="foreground"]',
  )!;
  const background = form.querySelector<HTMLInputElement>(
    '[name="background"]',
  )!;
  const canvas = root.querySelector<HTMLCanvasElement>("canvas")!;
  const placeholder = root.querySelector<HTMLElement>("[data-qr-placeholder]")!;
  const error = root.querySelector<HTMLElement>("#qr-error")!;
  const status = root.querySelector<HTMLElement>("[data-qr-status]")!;
  const buttons = [
    ...root.querySelectorAll<HTMLButtonElement>("[data-qr-export]"),
  ];
  const copyButton = buttons.find(
    (button) => button.dataset.qrExport === "copy",
  )!;
  const canCopy =
    !!navigator.clipboard?.write && typeof ClipboardItem !== "undefined";
  let valid = false;
  let revision = 0;
  let busy = false;
  let timer: ReturnType<typeof setTimeout>;
  const lifecycle = new AbortController();

  function settings() {
    const data = new FormData(form);
    return {
      width: Number(data.get("size")),
      margin: 3,
      errorCorrectionLevel: data.get(
        "correction",
      ) as QRCode.QRCodeErrorCorrectionLevel,
      color: { dark: foreground.value, light: background.value },
    };
  }

  function updateButtons() {
    buttons.forEach((button) => {
      button.disabled = !valid || busy || (button === copyButton && !canCopy);
    });
  }

  async function render() {
    const current = ++revision;
    valid = false;
    updateButtons();
    status.textContent = "";
    error.hidden = true;
    root!.querySelector<HTMLElement>("[data-qr-count]")!.textContent =
      `${content.value.length.toLocaleString()} characters`;
    [foreground, background].forEach((input) => {
      form.querySelector<HTMLOutputElement>(
        `output[for="${input.id}"]`,
      )!.value = input.value.toUpperCase();
    });
    if (!content.value.trim()) {
      canvas.hidden = true;
      placeholder.hidden = false;
      placeholder.textContent = "Add content to create your QR code.";
      return;
    }
    try {
      const preview = document.createElement("canvas");
      await QRCode.toCanvas(preview, content.value.trim(), {
        ...settings(),
        width: 420,
      });
      if (current !== revision || lifecycle.signal.aborted) return;
      canvas.width = preview.width;
      canvas.height = preview.height;
      canvas.getContext("2d")!.drawImage(preview, 0, 0);
      canvas.hidden = false;
      placeholder.hidden = true;
      valid = true;
    } catch {
      if (current !== revision || lifecycle.signal.aborted) return;
      canvas.hidden = true;
      placeholder.hidden = false;
      placeholder.textContent = "Shorten your content to create a QR code.";
      error.textContent =
        "That content is too long for a QR code. Try shortening it or lowering error correction.";
      error.hidden = false;
    }
    updateButtons();
  }

  function download(href: string, filename: string) {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    link.click();
  }

  buttons.forEach((button) =>
    button.addEventListener(
      "click",
      async () => {
        if (!valid || busy) return;
        const value = content.value.trim();
        const options = settings();
        busy = true;
        updateButtons();
        status.textContent = "";
        try {
          switch (button.dataset.qrExport) {
            case "png":
              download(await QRCode.toDataURL(value, options), "qr-code.png");
              status.textContent = "PNG downloaded.";
              break;
            case "svg": {
              const svg = await QRCode.toString(value, {
                ...options,
                type: "svg",
              });
              const url = URL.createObjectURL(
                new Blob([svg], { type: "image/svg+xml" }),
              );
              download(url, "qr-code.svg");
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              status.textContent = "SVG downloaded.";
              break;
            }
            case "copy": {
              // Start the clipboard write during the click to preserve browser user activation.
              const blob = (async () => {
                const exported = document.createElement("canvas");
                await QRCode.toCanvas(exported, value, options);
                return new Promise<Blob>((resolve, reject) =>
                  exported.toBlob((result) => {
                    if (result) resolve(result);
                    else reject(new Error("PNG export failed"));
                  }, "image/png"),
                );
              })();
              let clipboardTimeout: ReturnType<typeof setTimeout> | undefined;
              try {
                await Promise.race([
                  navigator.clipboard.write([
                    new ClipboardItem({ "image/png": blob }),
                  ]),
                  new Promise<never>((_, reject) => {
                    clipboardTimeout = setTimeout(
                      () => reject(new Error("Clipboard request timed out")),
                      5000,
                    );
                  }),
                ]);
              } finally {
                clearTimeout(clipboardTimeout);
              }
              status.textContent = "PNG copied to clipboard.";
              break;
            }
          }
        } catch {
          status.textContent =
            button === copyButton
              ? "Could not copy the image. Download the PNG instead, or allow clipboard access in your browser."
              : "Could not export your QR code. Please try again.";
        } finally {
          busy = false;
          updateButtons();
        }
      },
      { signal: lifecycle.signal },
    ),
  );

  form.addEventListener("submit", (event) => event.preventDefault(), {
    signal: lifecycle.signal,
  });
  form.addEventListener(
    "input",
    () => {
      valid = false;
      ++revision;
      updateButtons();
      clearTimeout(timer);
      timer = setTimeout(() => void render(), 100);
    },
    { signal: lifecycle.signal },
  );
  form.addEventListener(
    "reset",
    () => {
      clearTimeout(timer);
      timer = setTimeout(() => void render(), 0);
    },
    { signal: lifecycle.signal },
  );
  if (!canCopy)
    copyButton.title =
      "Clipboard image copying is unavailable in this browser. Download PNG instead.";
  document.addEventListener(
    "astro:before-swap",
    () => {
      lifecycle.abort();
      clearTimeout(timer);
      ++revision;
    },
    { once: true },
  );
  void render();
}

document.addEventListener("astro:page-load", initQrMaker);
initQrMaker();
