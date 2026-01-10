const { readCollection, writeCollection, generateId } = require('../db/index');

class CourseProgressModel {
  static async findOne(query) {
    const progressList = await readCollection('courseprogress');
    const progress = progressList.find(p => {
      for (let key in query) {
        if (p[key] !== query[key]) return false;
      }
      return true;
    });
    return progress || null;
  }

  static async findById(id) {
    const progressList = await readCollection('courseprogress');
    return progressList.find(p => p._id === id) || null;
  }

  static async find(query = {}) {
    const progressList = await readCollection('courseprogress');
    return progressList.filter(p => {
      for (let key in query) {
        if (p[key] !== query[key]) return false;
      }
      return true;
    });
  }

  static async create(data) {
    const progressList = await readCollection('courseprogress');
    const newProgress = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    progressList.push(newProgress);
    await writeCollection('courseprogress', progressList);
    return newProgress;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const progressList = await readCollection('courseprogress');
    const index = progressList.findIndex(p => p._id === id);
    if (index === -1) return null;
    
    const updatedProgress = {
      ...progressList[index],
      ...updates,
      updatedAt: new Date(),
    };
    progressList[index] = updatedProgress;
    await writeCollection('courseprogress', progressList);
    return options.new ? updatedProgress : progressList[index];
  }

  static async findByIdAndDelete(id) {
    const progressList = await readCollection('courseprogress');
    const index = progressList.findIndex(p => p._id === id);
    if (index === -1) return null;
    const deleted = progressList[index];
    progressList.splice(index, 1);
    await writeCollection('courseprogress', progressList);
    return deleted;
  }
}

module.exports = CourseProgressModel;
