const { readCollection, writeCollection, generateId } = require('../db/index');

class CategoryModel {
  static async findOne(query) {
    const categories = await readCollection('categories');
    const category = categories.find(c => {
      for (let key in query) {
        if (c[key] !== query[key]) return false;
      }
      return true;
    });
    return category || null;
  }

  static async findById(id) {
    const categories = await readCollection('categories');
    return categories.find(c => c._id === id) || null;
  }

  static async find(query = {}) {
    const categories = await readCollection('categories');
    return categories.filter(c => {
      for (let key in query) {
        if (c[key] !== query[key]) return false;
      }
      return true;
    });
  }

  static async create(data) {
    const categories = await readCollection('categories');
    const newCategory = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    categories.push(newCategory);
    await writeCollection('categories', categories);
    return newCategory;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const categories = await readCollection('categories');
    const index = categories.findIndex(c => c._id === id);
    if (index === -1) return null;
    
    const updatedCategory = {
      ...categories[index],
      ...updates,
      updatedAt: new Date(),
    };
    categories[index] = updatedCategory;
    await writeCollection('categories', categories);
    return options.new ? updatedCategory : categories[index];
  }

  static async findByIdAndDelete(id) {
    const categories = await readCollection('categories');
    const index = categories.findIndex(c => c._id === id);
    if (index === -1) return null;
    const deleted = categories[index];
    categories.splice(index, 1);
    await writeCollection('categories', categories);
    return deleted;
  }
}

module.exports = CategoryModel;
