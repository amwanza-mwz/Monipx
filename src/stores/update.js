import { defineStore } from 'pinia';

// GitHub Repository Configuration
// IMPORTANT: Update this with your actual GitHub username and repository name
const GITHUB_REPO = 'amwanza-mwz/Monipx'; // Format: username/repository
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export const useUpdateStore = defineStore('update', {
  state: () => ({
    currentVersion: '',
    latestVersion: '',
    updateAvailable: false,
    lastCheck: null,
    checking: false,
    githubReleasesUrl: GITHUB_RELEASES_URL,
  }),

  actions: {
    async loadCurrentVersion() {
      try {
        // Fetch current version from the backend API
        const response = await fetch('/api/status');
        const data = await response.json();
        this.currentVersion = `v${data.version}`;
        console.log('📦 Current version loaded:', this.currentVersion);
      } catch (error) {
        console.error('Failed to load current version:', error);
        this.currentVersion = 'v1.1.0'; // Fallback
      }
    },

    async checkForUpdates() {
      try {
        this.checking = true;

        // Make sure we have the current version first
        if (!this.currentVersion) {
          await this.loadCurrentVersion();
        }

        const response = await fetch(GITHUB_API_URL);

        // Check if repository exists
        if (response.status === 404) {
          console.warn('GitHub repository not found. Please update GITHUB_REPO in src/stores/update.js');
          this.latestVersion = 'Unknown';
          this.checking = false;
          return false;
        }

        const data = await response.json();

        this.latestVersion = data.tag_name || 'Unknown';
        this.lastCheck = new Date();

        // Compare versions
        this.updateAvailable = this.latestVersion !== this.currentVersion;

        // Store in localStorage
        localStorage.setItem('lastUpdateCheck', this.lastCheck.toISOString());
        localStorage.setItem('latestVersion', this.latestVersion);
        localStorage.setItem('updateAvailable', this.updateAvailable.toString());

        return this.updateAvailable;
      } catch (error) {
        console.error('Failed to check for updates:', error);
        return false;
      } finally {
        this.checking = false;
      }
    },

    loadCachedData() {
      const cachedLastCheck = localStorage.getItem('lastUpdateCheck');
      const cachedLatestVersion = localStorage.getItem('latestVersion');
      const cachedUpdateAvailable = localStorage.getItem('updateAvailable');
      
      if (cachedLastCheck) this.lastCheck = new Date(cachedLastCheck);
      if (cachedLatestVersion) this.latestVersion = cachedLatestVersion;
      if (cachedUpdateAvailable) this.updateAvailable = cachedUpdateAvailable === 'true';
    },

    dismissUpdate() {
      this.updateAvailable = false;
      localStorage.setItem('updateAvailable', 'false');
    },
  },
});

