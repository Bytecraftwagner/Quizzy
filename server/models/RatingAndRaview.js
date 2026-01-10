const { readCollection, writeCollection, generateId } = require('../db/index');

class RatingAndReviewModel {
  static async findOne(query) {
    const reviews = await readCollection('ratingandreviews');
    const review = reviews.find(r => {
      for (let key in query) {
        if (r[key] !== query[key]) return false;
      }
      return true;
    });
    return review || null;
  }

  static async findById(id) {
    const reviews = await readCollection('ratingandreviews');
    return reviews.find(r => r._id === id) || null;
  }

  static async find(query = {}) {
    const reviews = await readCollection('ratingandreviews');
    return reviews.filter(r => {
      for (let key in query) {
        if (r[key] !== query[key]) return false;
      }
      return true;
    });
  }

  static async create(data) {
    const reviews = await readCollection('ratingandreviews');
    const newReview = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    reviews.push(newReview);
    await writeCollection('ratingandreviews', reviews);
    return newReview;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const reviews = await readCollection('ratingandreviews');
    const index = reviews.findIndex(r => r._id === id);
    if (index === -1) return null;
    
    const updatedReview = {
      ...reviews[index],
      ...updates,
      updatedAt: new Date(),
    };
    reviews[index] = updatedReview;
    await writeCollection('ratingandreviews', reviews);
    return options.new ? updatedReview : reviews[index];
  }

  static async findByIdAndDelete(id) {
    const reviews = await readCollection('ratingandreviews');
    const index = reviews.findIndex(r => r._id === id);
    if (index === -1) return null;
    const deleted = reviews[index];
    reviews.splice(index, 1);
    await writeCollection('ratingandreviews', reviews);
    return deleted;
  }
}

module.exports = RatingAndReviewModel;
