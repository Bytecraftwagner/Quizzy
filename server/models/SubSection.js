const { readCollection, writeCollection, generateId } = require('../db/index');

class SubSectionModel {
  static async findOne(query) {
    const subsections = await readCollection('subsections');
    const subsection = subsections.find(s => {
      for (let key in query) {
        if (s[key] !== query[key]) return false;
      }
      return true;
    });
    return subsection || null;
  }

  static async findById(id) {
    const subsections = await readCollection('subsections');
    return subsections.find(s => s._id === id) || null;
  }

  static async find(query = {}) {
    const subsections = await readCollection('subsections');
    return subsections.filter(s => {
      for (let key in query) {
        if (s[key] !== query[key]) return false;
      }
      return true;
    });
  }

  static async create(data) {
    const subsections = await readCollection('subsections');
    const newSubsection = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    subsections.push(newSubsection);
    await writeCollection('subsections', subsections);
    return newSubsection;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const subsections = await readCollection('subsections');
    const index = subsections.findIndex(s => s._id === id);
    if (index === -1) return null;
    
    const updatedSubsection = {
      ...subsections[index],
      ...updates,
      updatedAt: new Date(),
    };
    subsections[index] = updatedSubsection;
    await writeCollection('subsections', subsections);
    return options.new ? updatedSubsection : subsections[index];
  }

  static async findByIdAndDelete(id) {
    const subsections = await readCollection('subsections');
    const index = subsections.findIndex(s => s._id === id);
    if (index === -1) return null;
    const deleted = subsections[index];
    subsections.splice(index, 1);
    await writeCollection('subsections', subsections);
    return deleted;
  }
}

module.exports = SubSectionModel;
