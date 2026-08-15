const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const settingsFilePath = path.resolve(__dirname, 'settings.json');

// Default settings from environment or fallback
const defaults = {
  nvidiaApiKey: process.env.NVIDIA_API_KEY,
  modelName: "nvidia/nemotron-3-ultra-550b-a55b",
  nvidiaBaseUrl: "https://integrate.api.nvidia.com/v1",
  enableThinking: true,
  showThinking: true
};

// Attempt to read saved settings from disk
let savedSettings = {};
try {
  if (fs.existsSync(settingsFilePath)) {
    const fileContent = fs.readFileSync(settingsFilePath, 'utf8');
    savedSettings = JSON.parse(fileContent);
  }
} catch (err) {
  // Silent fallback
}

// Config object loaded dynamically
const config = {
  nvidiaApiKey: defaults.nvidiaApiKey,
  nvidiaBaseUrl: defaults.nvidiaBaseUrl,
  
  modelName: savedSettings.modelName || defaults.modelName,
  enableThinking: savedSettings.enableThinking !== undefined ? savedSettings.enableThinking : defaults.enableThinking,
  showThinking: savedSettings.showThinking !== undefined ? savedSettings.showThinking : defaults.showThinking,

  // Method to serialize active settings to settings.json
  saveSettings() {
    try {
      const dataToSave = {
        modelName: this.modelName,
        enableThinking: this.enableThinking,
        showThinking: this.showThinking
      };
      fs.writeFileSync(settingsFilePath, JSON.stringify(dataToSave, null, 2), 'utf8');
    } catch (err) {
      console.error("❌ Failed to save settings to settings.json:", err.message);
    }
  }
};

// Check if API key is missing
if (!config.nvidiaApiKey) {
  console.error("❌ ERROR: NVIDIA_API_KEY is missing in your .env file!");
  console.error("Please add NVIDIA_API_KEY=your_key to the .env file.");
  process.exit(1);
}

module.exports = config;
