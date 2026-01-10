const { readCollection, writeCollection, generateId } = require('../db/index');

class ProfileModel {
  static async findOne(query) {
    const profiles = await readCollection('profiles');
    const profile = profiles.find(p => {
      for (let key in query) {
        if (p[key] !== query[key]) return false;
      }
      return true;
    });
    return profile || null;
  }

  static async findById(id) {
    const profiles = await readCollection('profiles');
    return profiles.find(p => p._id === id) || null;
  }

  static async find(query = {}) {
    const profiles = await readCollection('profiles');
    return profiles.filter(p => {
      for (let key in query) {
        if (p[key] !== query[key]) return false;
      }
      return true;
    });
  }

  static async create(data) {
    const profiles = await readCollection('profiles');
    const newProfile = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    profiles.push(newProfile);
    await writeCollection('profiles', profiles);
    return newProfile;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const profiles = await readCollection('profiles');
    const index = profiles.findIndex(p => p._id === id);
    if (index === -1) return null;
    
    const updatedProfile = {
      ...profiles[index],
      ...updates,
      updatedAt: new Date(),
    };
    profiles[index] = updatedProfile;
    await writeCollection('profiles', profiles);
    return options.new ? updatedProfile : profiles[index];
  }

  static async findByIdAndDelete(id) {
    const profiles = await readCollection('profiles');
    const index = profiles.findIndex(p => p._id === id);
    if (index === -1) return null;
    const deleted = profiles[index];
    profiles.splice(index, 1);
    await writeCollection('profiles', profiles);
    return deleted;
  }
}

module.exports = ProfileModel;
