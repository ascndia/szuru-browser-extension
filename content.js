// Content script - handles modal display and user interaction
let currentImageUrl = "";

// Close modal function
function closeSzuruModal() {
  const modal = document.getElementById("szuru-upload-modal");
  if (modal) {
    modal.remove();
  }
}

// Make close function globally available
window.closeSzuruModal = closeSzuruModal;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showUploadModal") {
    currentImageUrl = message.imageUrl;
    showUploadModal(message.imageUrl, message.settings);
  }
});

// Create and show upload modal
function showUploadModal(imageUrl, settings) {
  // Remove existing modal if any
  const existingModal = document.getElementById("szuru-upload-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modal = document.createElement("div");
  modal.id = "szuru-upload-modal";
  modal.innerHTML = `
    <div class="szuru-modal-overlay">
      <div class="szuru-modal-content">
        <div class="szuru-modal-header">
          <h3>Upload to Szurubooru</h3>
          <button class="szuru-close-btn">&times;</button>
        </div>
        
        <div class="szuru-modal-body">
          <div class="szuru-image-preview">
            <img src="${imageUrl}" alt="Image to upload" style="max-width: 200px; max-height: 200px;">
          </div>
          
          <form id="szuru-upload-form">
            <div class="szuru-form-group">
              <label for="szuru-tags">Tags (comma-separated):</label>
              <input type="text" id="szuru-tags" placeholder="tag1, tag2, tag3">
              <small>Tags are optional</small>
            </div>
            
            <div class="szuru-form-group">
              <label for="szuru-safety">Safety Rating:</label>
              <select id="szuru-safety" required>
                <option value="safe">Safe</option>
                <option value="sketchy">Sketchy</option>
                <option value="unsafe">Unsafe</option>
              </select>
            </div>
            
            <div class="szuru-form-group">
              <label>Server: ${settings.szuruEndpoint}</label>
              <label>User: ${settings.szuruUser}</label>
            </div>
            
            <div class="szuru-form-actions">
              <button type="button" class="szuru-btn-cancel">Cancel</button>
              <button type="submit" class="szuru-btn-upload">Upload</button>
            </div>
          </form>
          
          <div id="szuru-upload-status" style="display: none;"></div>
        </div>
      </div>
    </div>
  `;

  // Add modal to page
  document.body.appendChild(modal);

  // Add event listeners for closing the modal
  const closeBtn = modal.querySelector(".szuru-close-btn");
  const cancelBtn = modal.querySelector(".szuru-btn-cancel");
  const overlay = modal.querySelector(".szuru-modal-overlay");

  closeBtn.addEventListener("click", closeSzuruModal);
  cancelBtn.addEventListener("click", closeSzuruModal);

  // Close modal when clicking on overlay (but not the modal content)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeSzuruModal();
    }
  });

  // Close modal with Escape key
  const handleEscKey = (e) => {
    if (e.key === "Escape") {
      closeSzuruModal();
      document.removeEventListener("keydown", handleEscKey);
    }
  };
  document.addEventListener("keydown", handleEscKey);

  // Handle form submission
  const form = document.getElementById("szuru-upload-form");
  form.addEventListener("submit", handleUpload);

  // Setup tag autocomplete
  const tagsInput = document.getElementById("szuru-tags");
  if (window.tagAutocomplete) {
    window.tagAutocomplete.setupAutocomplete(tagsInput);
  }

  // Focus on tags input
  document.getElementById("szuru-tags").focus();
}

// Handle upload form submission
async function handleUpload(event) {
  event.preventDefault();

  const tags = document.getElementById("szuru-tags").value.trim();
  const safety = document.getElementById("szuru-safety").value;
  const statusDiv = document.getElementById("szuru-upload-status");
  const uploadBtn = event.target.querySelector(".szuru-btn-upload");

  // Show loading state
  uploadBtn.disabled = true;
  uploadBtn.textContent = "Uploading...";
  statusDiv.style.display = "block";
  statusDiv.innerHTML = '<div class="szuru-loading">Uploading image...</div>';

  try {
    // Get settings from storage
    const settings = await chrome.storage.sync.get([
      "szuruEndpoint",
      "szuruUser",
      "szuruToken",
    ]);

    // Send upload request to background script
    const response = await chrome.runtime.sendMessage({
      action: "uploadImage",
      data: {
        imageUrl: currentImageUrl,
        tags: tags,
        safety: safety,
        settings: settings,
      },
    });

    if (response.success) {
      statusDiv.innerHTML = `<div class="szuru-success">✓ ${response.result.message}</div>`;
      setTimeout(() => {
        closeSzuruModal();
      }, 2000);
    } else {
      statusDiv.innerHTML = `<div class="szuru-error">✗ Upload failed: ${response.error}</div>`;
    }
  } catch (error) {
    statusDiv.innerHTML = `<div class="szuru-error">✗ Error: ${error.message}</div>`;
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload";
  }
}
