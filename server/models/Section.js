const { readCollection, writeCollection, generateId } = require('../db/index');

class SectionModel {
  static async findOne(query) {
    const sections = await readCollection('sections');
    const section = sections.find(s => {
      for (let key in query) {
        if (s[key] !== query[key]) return false;
      }
      return true;
    });
    return section || null;
  }

  static async findById(id) {
    const sections = await readCollection('sections');
    return sections.find(s => s._id === id) || null;
  }

  static async find(query = {}) {
    const sections = await readCollection('sections');
    return sections.filter(s => {
      for (let key in query) {
        if (s[key] !== query[key]) return false;
      }
      return true;
    });
  }

  static async create(data) {
    const sections = await readCollection('sections');
    const newSection = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    sections.push(newSection);
    await writeCollection('sections', sections);
    return newSection;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const sections = await readCollection('sections');
    const index = sections.findIndex(s => s._id === id);
    if (index === -1) return null;
    
    const updatedSection = {
      ...sections[index],
      ...updates,
      updatedAt: new Date(),
    };
    sections[index] = updatedSection;
    await writeCollection('sections', sections);
    return options.new ? updatedSection : sections[index];
  }

  static async findByIdAndDelete(id) {
    const sections = await readCollection('sections');
    const index = sections.findIndex(s => s._id === id);
    if (index === -1) return null;
    const deleted = sections[index];
    sections.splice(index, 1);
    await writeCollection('sections', sections);
    return deleted;
  }
}

module.exports = SectionModel;
