const fs = require('fs').promises;
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
async function ensureDbDir() {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating DB directory:', error);
  }
}

// Get file path for a collection
function getCollectionPath(collectionName) {
  return path.join(DB_DIR, `${collectionName}.json`);
}

// Read collection from JSON file
async function readCollection(collectionName) {
  try {
    const filePath = getCollectionPath(collectionName);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// Write collection to JSON file
async function writeCollection(collectionName, data) {
  try {
    const filePath = getCollectionPath(collectionName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${collectionName}:`, error);
    throw error;
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = {
  ensureDbDir,
  readCollection,
  writeCollection,
  generateId,
  getCollectionPath,
};
