// ==============================
// SINGLE SOURCE OF TRUTH
// ==============================
const API_BASE = "http://72.62.228.105:8082";

// ===================================================
// 1) TOP DOWNLOAD BUTTON (YOUR ORIGINAL LOGIC, FIXED)
// ===================================================
function wireDownloadButton() {
    const downloadBtn = document.getElementById("downloadBtn");
    if (!downloadBtn) {
        console.warn("downloadBtn not found yet, retrying...");
        setTimeout(wireDownloadButton, 100);
        return;
    }

    console.log("✓ downloadBtn found");

    downloadBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const input = document.getElementById("url");

        const url = input?.value?.trim();
        if (!url) {
            alert("Paste a link first");
            return;
        }

        try {
            console.log("⬇️ Calling backend:", url);

            const res = await fetch(`${API_BASE}/api/download`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert("Error: " + (err.error || "Unknown error"));
                return;
            }

            const blob = await res.blob();
            const cd = res.headers.get("content-disposition") || "";
            let filename = "download.mp4";

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
            console.error("Download failed:", err);
            alert("Download failed: " + err.message);
        }
    });
}

// ===================================================
// 2) AUTO FETCH ON PASTE / CHANGE (YOUR LOGIC, FIXED)
// ===================================================
function wireAutoFetch() {
    const input = document.getElementById("url");
    if (!input) {
        setTimeout(wireAutoFetch, 100);
        return;
    }

    input.addEventListener("paste", () => {
        setTimeout(() => {
            const url = input.value?.trim();
            if (url && isValidInstagramUrl(url)) {
                autoFetchMedia(url);
            }
        }, 100);
    });

    input.addEventListener("change", () => {
        const url = input.value?.trim();
        if (url && isValidInstagramUrl(url)) {
            autoFetchMedia(url);
        }
    });
}

function isValidInstagramUrl(url) {
    return (
        url.includes("instagram.com") &&
        (url.includes("/p/") ||
            url.includes("/reel/") ||
            url.includes("/tv/") ||
            url.includes("/stories/"))
    );
}

// ===================================================
// 3) PREVIEW MEDIA (YOUR GRID UI, FIXED BACKEND CALL)
// ===================================================
async function autoFetchMedia(url) {
    console.log("🔍 Auto-fetching media from:", url);

    const searchSection = document.getElementById("searchResultSection");
    const searchGrid = document.getElementById("searchGrid");
    const downloadAllContainer =
        document.getElementById("downloadAllContainer");

    searchGrid.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:40px;">Loading...</div>';

    downloadAllContainer.innerHTML = "";
    searchSection.style.display = "block";

    setTimeout(() => {
        searchSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    try {
        const res = await fetch(`${API_BASE}/api/preview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            searchGrid.innerHTML =
                `<div style="color:red;text-align:center;padding:40px;">
                   Error: ${err.error || "Failed to fetch"}
                 </div>`;
            return;
        }

        const data = await res.json();
        console.log("📦 Received preview data:", data);

        searchGrid.innerHTML = "";

        if (!data.items || data.items.length === 0) {
            searchGrid.innerHTML =
                `<div style="text-align:center;padding:40px;">No media found</div>`;
            return;
        }

        data.items.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "media-card";

            let overlay = item.type === "video"
                ? '<div class="media-overlay"><svg class="play-icon" viewBox="0 0 24 24"><path fill="white" d="M8 5v14l11-7z"></path></svg></div>'
                : '<div class="media-overlay"></div>';

            card.innerHTML = `
                <img src="${item.thumbnail}"
                     class="media-thumbnail"
                     style="width:100%;height:200px;object-fit:cover;">
                ${overlay}
                <button class="download-btn" data-index="${index}">
                    Download
                </button>
            `;

            searchGrid.appendChild(card);

            card.querySelector(".download-btn").addEventListener("click", (e) => {
                e.preventDefault();
                downloadItem(url, index);
            });
        });

        // Download All for carousel
        if (data.type === "carousel" && data.items.length > 1) {
            downloadAllContainer.innerHTML = `
                <div style="text-align:center;padding:30px;">
                    <button id="zipBtn" class="download-all-btn">
                        📦 Download All as ZIP
                    </button>
                </div>
            `;

            document.getElementById("zipBtn")
                .addEventListener("click", () => downloadAllAsZip(url));
        }

    } catch (err) {
        console.error("Auto-fetch failed:", err);
        searchGrid.innerHTML =
            `<div style="color:red;text-align:center;padding:40px;">
                ${err.message}
             </div>`;
    }
}

// ===================================================
// 4) DOWNLOAD ONE ITEM (FIXED PORT + API)
// ===================================================
async function downloadItem(url, itemIndex) {
    try {
        console.log("⬇️ Downloading item", itemIndex);

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
            `item_${itemIndex}.mp4`;

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);

    } catch (err) {
        console.error("Download failed:", err);
        alert("Download failed: " + err.message);
    }
}

// ===================================================
// 5) DOWNLOAD ALL AS ZIP (FIXED PORT)
// ===================================================
async function downloadAllAsZip(url) {
    try {
        console.log("📦 Downloading all as ZIP:", url);

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

    } catch (err) {
        console.error("Download failed:", err);
        alert("Download failed: " + err.message);
    }
}

// ===================================================
// START EVERYTHING
// ===================================================
wireDownloadButton();
wireAutoFetch();
