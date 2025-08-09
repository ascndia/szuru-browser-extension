// Tag autocomplete functionality
class TagAutocomplete {
  constructor() {
    this.tagsData = [];
    this.isLoaded = false;
    this.currentFocus = -1;
    this.loadTags();
  }

  async loadTags() {
    try {
      const response = await fetch(chrome.runtime.getURL("tags/danbooru.csv"));
      const csvText = await response.text();
      this.parseCsvData(csvText);
      this.isLoaded = true;
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  }

  parseCsvData(csvText) {
    const lines = csvText.trim().split("\n");
    this.tagsData = lines
      .map((line) => {
        // Parse CSV line considering quoted aliases
        const match = line.match(/^([^,]+),([^,]+),([^,]+),"?([^"]*)"?$/);
        if (match) {
          const [, tag, type, count, aliases] = match;
          return {
            tag: tag.trim(),
            type: parseInt(type),
            count: parseInt(count),
            aliases: aliases
              ? aliases
                  .split(",")
                  .map((a) => a.trim())
                  .filter((a) => a)
              : [],
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  formatNumber(count) {
    if (count < 1000) return count.toString();
    if (count < 1000000) return Math.round(count / 1000) + "K";
    return (count / 1000000).toFixed(1) + "M";
  }

  highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<strong>$1</strong>");
  }

  getTagTypeClass(type) {
    const typeClasses = {
      0: "tag-general", // General
      1: "tag-artist", // Artist
      2: "tag-unknown", // Unknown
      3: "tag-copyright", // Copyright
      4: "tag-character", // Character
      5: "tag-meta", // Meta
    };
    return typeClasses[type] || "tag-general";
  }

  getSuggestions(input, maxResults = 10) {
    if (!this.isLoaded || !input || input.length < 1) {
      return [];
    }

    const query = input.toLowerCase();
    const suggestions = [];

    for (const item of this.tagsData) {
      if (suggestions.length >= maxResults) break;

      // Check if tag starts with query
      if (item.tag.toLowerCase().startsWith(query)) {
        suggestions.push({
          ...item,
          matchType: "tag",
          highlightedTag: this.highlightMatch(item.tag, input),
        });
        continue;
      }

      // Check aliases
      const matchingAlias = item.aliases.find((alias) =>
        alias.toLowerCase().startsWith(query)
      );
      if (matchingAlias) {
        suggestions.push({
          ...item,
          matchType: "alias",
          matchingAlias: matchingAlias,
          highlightedTag: this.highlightMatch(item.tag, ""), // Don't highlight main tag for alias matches
          highlightedAlias: this.highlightMatch(matchingAlias, input),
        });
      }
    }

    // Sort by count (popularity) descending
    return suggestions.sort((a, b) => b.count - a.count);
  }

  setupAutocomplete(inputElement) {
    if (!inputElement) return;

    // Create autocomplete container
    const container = document.createElement("div");
    container.className = "szuru-autocomplete-container";
    inputElement.parentNode.insertBefore(container, inputElement.nextSibling);

    const suggestionsList = document.createElement("div");
    suggestionsList.className = "szuru-autocomplete-suggestions";
    suggestionsList.style.display = "none";
    container.appendChild(suggestionsList);

    // Input event handler
    const handleInput = () => {
      const value = inputElement.value;
      const cursorPos = inputElement.selectionStart;
      const textUpToCursor = value.substring(0, cursorPos);
      const lastSpaceIndex = textUpToCursor.lastIndexOf(" ");
      const currentTag = textUpToCursor.substring(lastSpaceIndex + 1).trim();

      if (currentTag.length < 1) {
        this.hideSuggestions(suggestionsList);
        return;
      }

      const suggestions = this.getSuggestions(currentTag);
      this.showSuggestions(
        suggestions,
        suggestionsList,
        inputElement,
        currentTag
      );
    };

    // Keyboard navigation
    const handleKeydown = (e) => {
      const items = suggestionsList.querySelectorAll(
        ".szuru-autocomplete-item"
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.currentFocus = Math.min(this.currentFocus + 1, items.length - 1);
        this.updateFocus(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.currentFocus = Math.max(this.currentFocus - 1, -1);
        this.updateFocus(items);
      } else if (e.key === "Enter") {
        if (this.currentFocus >= 0 && items[this.currentFocus]) {
          e.preventDefault();
          this.selectSuggestion(items[this.currentFocus], inputElement);
        } else if (suggestionsList.style.display === "block") {
          // If suggestions are visible but none selected, hide them and allow normal Enter behavior
          this.hideSuggestions(suggestionsList);
        }
        // If no suggestions are visible or selected, let Enter work normally (form submission)
      } else if (e.key === "Escape") {
        this.hideSuggestions(suggestionsList);
      }
    };

    inputElement.addEventListener("input", handleInput);
    inputElement.addEventListener("keydown", handleKeydown);

    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        this.hideSuggestions(suggestionsList);
      }
    });
  }

  showSuggestions(suggestions, container, inputElement, currentTag) {
    if (suggestions.length === 0) {
      this.hideSuggestions(container);
      return;
    }

    container.innerHTML = "";
    this.currentFocus = -1;

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement("div");
      item.className = "szuru-autocomplete-item";

      const tagClass = this.getTagTypeClass(suggestion.type);
      const countFormatted = this.formatNumber(suggestion.count);

      if (suggestion.matchType === "alias") {
        item.innerHTML = `
          <div class="tag-info">
            <span class="tag-name ${tagClass}">${suggestion.highlightedTag}</span>
            <span class="tag-alias">← ${suggestion.highlightedAlias}</span>
          </div>
          <span class="post-count">${countFormatted}</span>
        `;
      } else {
        item.innerHTML = `
          <div class="tag-info">
            <span class="tag-name ${tagClass}">${suggestion.highlightedTag}</span>
          </div>
          <span class="post-count">${countFormatted}</span>
        `;
      }

      item.addEventListener("click", () => {
        this.selectSuggestion(item, inputElement, suggestion.tag);
      });

      container.appendChild(item);
    });

    container.style.display = "block";
  }

  hideSuggestions(container) {
    container.style.display = "none";
    this.currentFocus = -1;
  }

  updateFocus(items) {
    items.forEach((item, index) => {
      item.classList.toggle("focused", index === this.currentFocus);
    });
  }

  selectSuggestion(item, inputElement, tagValue = null) {
    const tag = tagValue || item.querySelector(".tag-name").textContent;
    const value = inputElement.value;
    const cursorPos = inputElement.selectionStart;
    const textUpToCursor = value.substring(0, cursorPos);
    const textAfterCursor = value.substring(cursorPos);
    const lastSpaceIndex = textUpToCursor.lastIndexOf(" ");

    const beforeCurrentTag = textUpToCursor.substring(0, lastSpaceIndex + 1);
    const newValue = beforeCurrentTag + tag + " " + textAfterCursor.trim();

    inputElement.value = newValue;
    inputElement.setSelectionRange(
      beforeCurrentTag.length + tag.length + 1,
      beforeCurrentTag.length + tag.length + 1
    );

    this.hideSuggestions(item.closest(".szuru-autocomplete-suggestions"));
    inputElement.focus();
  }
}

// Create global instance
window.tagAutocomplete = new TagAutocomplete();
