// ======= MATCHES YOUR ACTUAL index.html =======

const searchSection = document.getElementById("searchResultSection");
const grid = document.getElementById("searchGrid");
const downloadAllContainer = document.getElementById("downloadAllContainer");

// Small helper to show errors nicely
function showError(msg) {
    grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align:center; padding:40px; color:red;">
      ${msg}
    </div>`;
    searchSection.style.display = "block";
}

// This is called from hooks.js after previewMedia succeeds
window.renderPreview = function (data, originalUrl) {
    try {
        if (!data || !data.items) {
            showError("Invalid preview data from backend");
            return;
        }

        // Clear previous results
        grid.innerHTML = "";
        downloadAllContainer.innerHTML = "";
        searchSection.style.display = "block";

        data.items.forEach((item) => {
            const card = document.createElement("div");
            card.className = "media-card";

            const overlay =
                item.type === "video"
                    ? `<div class="media-overlay">
               <svg class="play-icon" viewBox="0 0 24 24">
                 <path fill="white" d="M8 5v14l11-7z"></path>
               </svg>
             </div>`
                    : "";

            card.innerHTML = `
        <img src="${item.thumbnail}" class="media-thumbnail"
             style="width:100%;height:200px;object-fit:cover;">
        ${overlay}
        <button class="download-btn"
                data-index="${item.id}">
          Download
        </button>
      `;

            grid.appendChild(card);

            // Wire individual download button
            card.querySelector(".download-btn").addEventListener("click", async (e) => {
                e.preventDefault();
                await window.downloadItem(originalUrl, item.id, data.type);
            });
        });

        // Add ZIP button only for carousel
        if (data.type === "carousel" && data.items.length > 1) {
            downloadAllContainer.innerHTML = `
        <div style="text-align:center; padding:30px 0;">
          <button class="download-all-btn"
            style="padding:12px 30px;
                   background:linear-gradient(135deg,#7B3FE4,#E91E63);
                   color:white; border:none; border-radius:8px;
                   font-size:16px; font-weight:600; cursor:pointer;">
            📦 Download All as ZIP
          </button>
        </div>
      `;

            downloadAllContainer
                .querySelector(".download-all-btn")
                .addEventListener("click", async () => {
                    await window.downloadAllAsZip(originalUrl);
                });
        }
    } catch (err) {
        console.error("renderPreview failed:", err);
        showError(err.message || "Preview crashed");
    }
};
