const { readCollection, writeCollection, generateId } = require('../db/index');

class OTPModel {
  static async findOne(query) {
    const otps = await readCollection('otps');
    const otp = otps.find(o => {
      for (let key in query) {
        if (o[key] !== query[key]) return false;
      }
      return true;
    });
    return otp || null;
  }

  static async find(query = {}) {
    const otps = await readCollection('otps');
    return otps.filter(o => {
      for (let key in query) {
        if (o[key] !== query[key]) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async create(data) {
    const otps = await readCollection('otps');
    const newOTP = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    otps.push(newOTP);
    await writeCollection('otps', otps);
    return newOTP;
  }

  static async findByIdAndDelete(id) {
    const otps = await readCollection('otps');
    const index = otps.findIndex(o => o._id === id);
    if (index === -1) return null;
    const deleted = otps[index];
    otps.splice(index, 1);
    await writeCollection('otps', otps);
    return deleted;
  }
}

module.exports = OTPModel;
