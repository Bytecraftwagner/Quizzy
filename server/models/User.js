const { readCollection, writeCollection, generateId } = require('../db/index');

class UserModel {
  static async findOne(query) {
    const users = await readCollection('users');
    const user = users.find(u => {
      for (let key in query) {
        if (u[key] !== query[key]) return false;
      }
      return true;
    });
    return user || null;
  }

  static async findById(id) {
    const users = await readCollection('users');
    return users.find(u => u._id === id) || null;
  }

  static async find(query = {}) {
    const users = await readCollection('users');
    return users.filter(u => {
      for (let key in query) {
        if (u[key] !== query[key]) return false;
      }
      return true;
    });
  }

  static async create(data) {
    const users = await readCollection('users');
    const newUser = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.push(newUser);
    await writeCollection('users', users);
    return newUser;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const users = await readCollection('users');
    const index = users.findIndex(u => u._id === id);
    if (index === -1) return null;
    
    const updatedUser = {
      ...users[index],
      ...updates,
      updatedAt: new Date(),
    };
    users[index] = updatedUser;
    await writeCollection('users', users);
    return options.new ? updatedUser : users[index];
  }

  static async findByIdAndDelete(id) {
    const users = await readCollection('users');
    const index = users.findIndex(u => u._id === id);
    if (index === -1) return null;
    const deleted = users[index];
    users.splice(index, 1);
    await writeCollection('users', users);
    return deleted;
  }

  static async populate(user, field) {
    // Simple populate implementation
    if (!user || !user[field]) return user;
    
    const relatedData = await readCollection(field);
    if (Array.isArray(user[field])) {
      user[field] = user[field].map(id => 
        relatedData.find(item => item._id === id)
      ).filter(Boolean);
    } else {
      user[field] = relatedData.find(item => item._id === user[field]) || null;
    }
    return user;
  }
}

module.exports = UserModel;
