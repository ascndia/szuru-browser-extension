// Popup script for settings management
document.addEventListener("DOMContentLoaded", loadSettings);

// Load existing settings
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      "szuruEndpoint",
      "szuruUser",
      "szuruToken",
    ]);

    if (settings.szuruEndpoint || settings.szuruUser || settings.szuruToken) {
      // Show current settings
      document.getElementById("current-settings").style.display = "block";
      document.getElementById("current-endpoint").textContent =
        settings.szuruEndpoint || "-";
      document.getElementById("current-user").textContent =
        settings.szuruUser || "-";
      document.getElementById("current-token").textContent = settings.szuruToken
        ? "••••••••"
        : "-";

      // Fill form with current values
      document.getElementById("endpoint").value = settings.szuruEndpoint || "";
      document.getElementById("username").value = settings.szuruUser || "";
      document.getElementById("token").value = settings.szuruToken || "";
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
}

// Handle settings form submission
document
  .getElementById("settings-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const endpoint = document.getElementById("endpoint").value.trim();
    const username = document.getElementById("username").value.trim();
    const token = document.getElementById("token").value.trim();

    if (!endpoint || !username || !token) {
      showStatus("Please fill in all fields", "error");
      return;
    }

    // Remove trailing slash from endpoint
    const cleanEndpoint = endpoint.replace(/\/$/, "");

    try {
      // Save settings
      await chrome.storage.sync.set({
        szuruEndpoint: cleanEndpoint,
        szuruUser: username,
        szuruToken: token,
      });

      showStatus("Settings saved successfully!", "success");

      // Update current settings display
      document.getElementById("current-settings").style.display = "block";
      document.getElementById("current-endpoint").textContent = cleanEndpoint;
      document.getElementById("current-user").textContent = username;
      document.getElementById("current-token").textContent = "••••••••";
    } catch (error) {
      showStatus("Error saving settings: " + error.message, "error");
    }
  });

// Handle test connection button
document.getElementById("test-btn").addEventListener("click", async () => {
  const endpoint = document.getElementById("endpoint").value.trim();
  const username = document.getElementById("username").value.trim();
  const token = document.getElementById("token").value.trim();

  if (!endpoint || !username || !token) {
    showStatus("Please fill in all fields first", "error");
    return;
  }

  const testBtn = document.getElementById("test-btn");
  testBtn.disabled = true;
  testBtn.textContent = "Testing...";

  try {
    // Test connection by calling info endpoint
    const cleanEndpoint = endpoint.replace(/\/$/, "");
    const authToken = btoa(`${username}:${token}`);

    const response = await fetch(`${cleanEndpoint}/api/info/`, {
      method: "GET",
      headers: {
        Authorization: `Token ${authToken}`,
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      showStatus(
        `✓ Connection successful! Server: ${data.name || "Szurubooru"}`,
        "success"
      );
    } else {
      const errorText = await response.text();
      showStatus(
        `✗ Connection failed: ${response.status} - ${errorText}`,
        "error"
      );
    }
  } catch (error) {
    showStatus(`✗ Connection error: ${error.message}`, "error");
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = "Test Connection";
  }
});

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = "block";

  // Auto-hide success messages after 3 seconds
  if (type === "success") {
    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 3000);
  }
}
