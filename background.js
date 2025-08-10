// Background script - handles context menus and communication
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for images (open modal)
  chrome.contextMenus.create({
    id: "uploadToSzuru",
    title: "Upload to Szurubooru...",
    contexts: ["image"],
  });

  // Create context menu for direct upload
  chrome.contextMenus.create({
    id: "quickUploadToSzuru",
    title: "Quick Upload to Szurubooru",
    contexts: ["image"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Get settings first, as both actions need them
  const settings = await chrome.storage.sync.get([
    "szuruEndpoint",
    "szuruUser",
    "szuruToken",
  ]);

  if (!settings.szuruEndpoint || !settings.szuruUser || !settings.szuruToken) {
    // Open settings popup if not configured, for both actions
    chrome.runtime.openOptionsPage
      ? chrome.runtime.openOptionsPage()
      : window.open(chrome.runtime.getURL("popup.html"));
    return;
  }

  if (info.menuItemId === "uploadToSzuru") {
    // Send message to content script to show upload modal
    chrome.tabs.sendMessage(tab.id, {
      action: "showUploadModal",
      imageUrl: info.srcUrl,
      settings: settings,
    });
  } else if (info.menuItemId === "quickUploadToSzuru") {
    // Directly upload with default values
    try {
      const result = await uploadToSzurubooru({
        imageUrl: info.srcUrl,
        tags: "", // No tags for quick upload
        safety: "safe", // Default to "safe"
        settings: settings,
      });

      // Notify user of success
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Upload Successful",
        message: `Image uploaded as post #${result.postId}.`,
      });
    } catch (error) {
      // Notify user of failure
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Upload Failed",
        message: `Error: ${error.message}`,
      });
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "uploadImage") {
    uploadToSzurubooru(message.data)
      .then((result) => sendResponse({ success: true, result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Function to upload image to Szurubooru
async function uploadToSzurubooru(data) {
  const { imageUrl, tags, safety, settings } = data;

  try {
    // Download image as blob
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();

    // Create form data
    const formData = new FormData();
    formData.append("content", imageBlob, "upload.jpg");

    // Prepare metadata
    const metadata = {
      tags: tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [],
      safety: safety,
    };

    // Add metadata as JSON blob
    const metadataBlob = new Blob([JSON.stringify(metadata)], {
      type: "application/json",
    });
    formData.append("metadata", metadataBlob, "metadata.json");

    // Create auth token
    const authToken = btoa(`${settings.szuruUser}:${settings.szuruToken}`);

    // Upload to Szurubooru
    const uploadResponse = await fetch(`${settings.szuruEndpoint}/api/posts/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${authToken}`,
        Accept: "application/json",
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const result = await uploadResponse.json();
    return {
      success: true,
      postId: result.id,
      message: `Successfully uploaded as post #${result.id}`,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
