// ===============================
// ======== CONFIG (IMPORTANT) ====
// ===============================

const API_BASE = "http://72.62.228.105:8082";   // <-- YOUR VPS BACKEND

// ===============================
// ===== MAIN DOWNLOAD BUTTON ====
// ===============================

function wireDownloadButton() {
    const downloadBtn = document.getElementById("downloadBtn");
    const input = document.getElementById("url");

    if (!downloadBtn || !input) {
        setTimeout(wireDownloadButton, 100);
        return;
    }

    console.log("✓ Main download button wired");

    downloadBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const url = input.value?.trim();
        console.log("Main button URL:", url);

        if (!url) {
            alert("Paste an Instagram link first");
            return;
        }

        try {
            console.log("Calling backend:", API_BASE + "/api/download");

            const res = await fetch(`${API_BASE}/api/download`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, itemIndex: 0 })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert("Error: " + (err.error || "Unknown error"));
                return;
            }

            const blob = await res.blob();
            const cd = res.headers.get("content-disposition") || "";
            let filename = "download";
            const match = cd.match(/filename[^;=\n]*=(["']?)([^"';\n]*)\1/);
            if (match) filename = match[2];

            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);

            alert("Downloaded: " + filename);

        } catch (err) {
            console.error(err);
            alert("Download failed: " + err.message);
        }
    });
}

// ===============================
// ===== AUTO PREVIEW FETCH ======
// ===============================

function wireAutoFetch() {
    const input = document.getElementById("url");
    if (!input) {
        setTimeout(wireAutoFetch, 100);
        return;
    }

    const handler = async () => {
        const url = input.value?.trim();
        if (url && isValidInstagramUrl(url)) {
            await autoFetchMedia(url);
        }
    };

    input.addEventListener("paste", () => setTimeout(handler, 100));
    input.addEventListener("change", handler);
}

function isValidInstagramUrl(url) {
    return url.includes("instagram.com") &&
        (url.includes("/p/") ||
            url.includes("/reel/") ||
            url.includes("/tv/") ||
            url.includes("/stories/"));
}

// ===============================
// ===== PREVIEW MEDIA GRID ======
// ===============================

async function autoFetchMedia(url) {
    console.log("Auto-fetching:", url);

    const searchSection = document.getElementById("searchResultSection");
    const searchGrid = document.getElementById("searchGrid");
    const downloadAllContainer = document.getElementById("downloadAllContainer");

    searchGrid.innerHTML = "<div style='padding:40px;text-align:center;'>Loading...</div>";
    downloadAllContainer.innerHTML = "";
    searchSection.style.display = "block";

    try {
        const res = await fetch(`${API_BASE}/api/preview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            searchGrid.innerHTML =
                `<div style='color:red;padding:40px;text-align:center'>
                 Error: ${err.error || "Failed to fetch"}
               </div>`;
            return;
        }

        const data = await res.json();
        console.log("Preview data:", data);

        searchGrid.innerHTML = "";

        if (!data.items || data.items.length === 0) {
            searchGrid.innerHTML =
                "<div style='padding:40px;text-align:center'>No media found</div>";
            return;
        }

        data.items.forEach((item) => {
            const card = document.createElement("div");
            card.className = "media-card";

            card.innerHTML = `
                <img src="${item.thumbnail}"
                     class="media-thumbnail"
                     style="width:100%;height:200px;object-fit:cover;">
                <button class="download-btn"
                        data-index="${item.id}">
                    Download
                </button>
            `;

            searchGrid.appendChild(card);

            // Individual download
            card.querySelector(".download-btn")
                .addEventListener("click", async (e) => {
                    e.preventDefault();
                    await downloadItem(url, item.id);
                });
        });

        // Show ZIP button only for carousel
        if (data.type === "carousel" && data.items.length > 1) {
            downloadAllContainer.innerHTML = `
              <div style="text-align:center;padding:30px 0;">
                <button class="download-all-btn">
                  📦 Download All as ZIP
                </button>
              </div>
            `;

            downloadAllContainer
                .querySelector(".download-all-btn")
                .addEventListener("click", async () => {
                    await downloadAllAsZip(url);
                });
        }

    } catch (err) {
        console.error(err);
        searchGrid.innerHTML =
            `<div style='color:red;padding:40px;text-align:center'>
             Error: ${err.message}
           </div>`;
    }
}

// ===============================
// ===== INDIVIDUAL DOWNLOAD =====
// ===============================

async function downloadItem(url, itemIndex) {
    console.log("Downloading item:", itemIndex);

    const res = await fetch(`${API_BASE}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, itemIndex })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Download failed: " + (err.error || "Unknown error"));
        return;
    }

    const blob = await res.blob();
    const cd = res.headers.get("content-disposition") || "";
    const filename =
        cd.match(/filename[^;=\n]*=(["']?)([^"';\n]*)\1/)?.[2] ||
        `item_${itemIndex}`;

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
}

// ===============================
// ===== DOWNLOAD ALL ZIP =========
// ===============================

async function downloadAllAsZip(url) {
    console.log("Downloading ZIP:", url);

    const res = await fetch(`${API_BASE}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Download failed: " + (err.error || "Unknown error"));
        return;
    }

    const blob = await res.blob();
    const cd = res.headers.get("content-disposition") || "";
    const filename =
        cd.match(/filename[^;=\n]*=(["']?)([^"';\n]*)\1/)?.[2] ||
        "carousel.zip";

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);

    alert("Downloaded: " + filename);
}

// ===============================
// ===== START EVERYTHING =========
// ===============================

wireDownloadButton();
wireAutoFetch();
