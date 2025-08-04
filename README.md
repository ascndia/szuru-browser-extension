# Szurubooru Browser Extension

A Chrome/Edge browser extension for uploading images directly to Szurubooru with right-click context menu.

## Features

- 🖱️ **Right-click upload**: Right-click any image and select "Upload to Szurubooru"
- 🏷️ **Tag input modal**: Easy-to-use popup for entering tags and safety rating
- ⚙️ **Settings management**: Configure server URL, username, and API token
- 🔐 **Secure storage**: Credentials stored locally in browser
- ✅ **Connection testing**: Test your settings before using
- 📱 **Responsive design**: Works on all screen sizes

## Installation

### Method 1: Load Unpacked (Development)

1. **Open Chrome/Edge Extensions page**:

   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. **Enable Developer Mode** (toggle in top-right)

3. **Load the extension**:

   - Click "Load unpacked"
   - Select the `szuru-browser-extension` folder

4. **The extension is now installed!** You should see the Szurubooru icon in your toolbar.

### Method 2: Package as .crx (Production)

1. Go to `chrome://extensions/`
2. Click "Pack extension"
3. Select the `szuru-browser-extension` folder
4. This creates a `.crx` file you can distribute

## Setup

### 1. Configure Settings

1. **Click the extension icon** in your browser toolbar
2. **Fill in your Szurubooru details**:

   - **Server URL**: Your Szurubooru server (e.g., `http://localhost:8080`)
   - **Username**: Your Szurubooru username
   - **API Token**: Get this from your Szurubooru user settings

3. **Click "Test Connection"** to verify your settings
4. **Click "Save Settings"** when everything works

### 2. Get API Token

1. Log into your Szurubooru web interface
2. Go to **Settings** → **Account**
3. Find the **API Tokens** section
4. **Create a new token** or copy existing one
5. **Paste the token** into the extension settings

## Usage

### Upload an Image

1. **Right-click any image** on any webpage
2. **Select "Upload to Szurubooru"** from context menu
3. **Fill in the upload form**:
   - **Tags**: Enter comma-separated tags (required)
   - **Safety**: Choose safe/sketchy/unsafe
4. **Click "Upload"** to submit

### Example Workflow

```
1. Browse to any website with images
2. Right-click an image
3. Click "Upload to Szurubooru"
4. Enter tags: "anime, girl, blue_hair"
5. Select safety: "safe"
6. Click "Upload"
7. ✓ Success: "Successfully uploaded as post #123"
```

## File Structure

```
szuru-browser-extension/
├── manifest.json          # Extension manifest
├── background.js          # Service worker for context menus
├── content.js            # Content script for modal
├── modal.css             # Styles for upload modal
├── popup.html            # Settings popup HTML
├── popup.js              # Settings popup logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Technical Details

### Permissions Used

- **`contextMenus`**: Create right-click menu for images
- **`activeTab`**: Access current tab for modal injection
- **`storage`**: Store user settings locally
- **`tabs`**: Communication between scripts
- **`host_permissions`**: Access any website for image uploads

### Security

- ✅ **Local storage only**: Credentials never leave your browser
- ✅ **HTTPS support**: Works with secure connections
- ✅ **Token-based auth**: Uses API tokens, not passwords
- ✅ **Content Security Policy**: Follows Chrome security guidelines

## Troubleshooting

### Extension doesn't appear in context menu

- Check if extension is enabled in `chrome://extensions/`
- Try refreshing the webpage
- Make sure you're right-clicking on an actual image

### Upload fails with 401/403 error

- Check your username and API token in settings
- Test connection in settings popup
- Verify your Szurubooru account has upload permissions

### Upload fails with 404 error

- Check your server URL in settings
- Ensure the URL doesn't end with `/api/`
- Verify your Szurubooru server is running

### Modal doesn't show

- Check if your settings are configured
- Look for JavaScript errors in browser console (F12)
- Try disabling other extensions that might conflict

### CORS errors

- This shouldn't happen with proper extension permissions
- If it does, check your Szurubooru server CORS settings

## Development

### Testing Locally

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click **"Reload"** button on your extension
4. Test the changes

### Adding New Features

The extension is modular:

- **Context menu logic**: Edit `background.js`
- **Upload modal**: Edit `content.js` and `modal.css`
- **Settings page**: Edit `popup.html` and `popup.js`

### Debugging

- **Background script**: Check in extension's service worker console
- **Content script**: Check in webpage's console (F12)
- **Popup**: Right-click extension icon → "Inspect popup"

## Compatibility

- ✅ **Chrome** 88+ (Manifest V3)
- ✅ **Edge** 88+ (Chromium-based)
- ✅ **Brave** (Chromium-based)
- ❌ **Firefox** (uses different extension format)

## Contributing

1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit pull request

## License

MIT License - feel free to modify and distribute.

---

**Made for Szurubooru users who want quick image uploads! 🚀**
