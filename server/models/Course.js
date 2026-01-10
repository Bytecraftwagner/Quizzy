const { readCollection, writeCollection, generateId } = require('../db/index');

class CourseModel {
  static async findOne(query) {
    const courses = await readCollection('courses');
    const course = courses.find(c => {
      for (let key in query) {
        if (c[key] !== query[key]) return false;
      }
      return true;
    });
    return course || null;
  }

  static async findById(id) {
    const courses = await readCollection('courses');
    return courses.find(c => c._id === id) || null;
  }

  static async find(query = {}) {
    const courses = await readCollection('courses');
    return courses.filter(c => {
      for (let key in query) {
        if (c[key] !== query[key]) return false;
      }
      return true;
    });
  }

  static async create(data) {
    const courses = await readCollection('courses');
    const newCourse = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    courses.push(newCourse);
    await writeCollection('courses', courses);
    return newCourse;
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    const courses = await readCollection('courses');
    const index = courses.findIndex(c => c._id === id);
    if (index === -1) return null;
    
    const updatedCourse = {
      ...courses[index],
      ...updates,
      updatedAt: new Date(),
    };
    courses[index] = updatedCourse;
    await writeCollection('courses', courses);
    return options.new ? updatedCourse : courses[index];
  }

  static async findByIdAndDelete(id) {
    const courses = await readCollection('courses');
    const index = courses.findIndex(c => c._id === id);
    if (index === -1) return null;
    const deleted = courses[index];
    courses.splice(index, 1);
    await writeCollection('courses', courses);
    return deleted;
  }

  static async save(course) {
    const courses = await readCollection('courses');
    const index = courses.findIndex(c => c._id === course._id);
    if (index === -1) {
      courses.push(course);
    } else {
      courses[index] = { ...course, updatedAt: new Date() };
    }
    await writeCollection('courses', courses);
    return course;
  }
}

module.exports = CourseModel;
