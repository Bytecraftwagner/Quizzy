const Category = require("../models/Category")

function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" })
    }
    const CategorysDetails = await Category.create({
      name: name,
      description: description,
    })
    // console.log(CategorysDetails)
    return res.status(200).json({
      success: true,
      message: "Categorys Created Successfully",
    })
  } catch (error) {
    return res.status(500).json({
      success: true,
      message: error.message,
    })
  }
}

exports.showAllCategories = async (req, res) => {
  try {
    const allCategorys = await Category.find()
    res.status(200).json({
      success: true,
      data: allCategorys,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body
    const Course = require("../models/Course");

    // Get courses for the specified category
    const selectedCategory = await Category.findById(categoryId)

    if (!selectedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" })
    }

    // Get published courses for this category
    const categoryCourses = await Course.find({ 
      category: categoryId, 
      status: "Published" 
    });
    selectedCategory.courses = categoryCourses;

    // Get courses for other categories
    const allCategories = await Category.find();
    const categoriesExceptSelected = allCategories.filter(c => c._id !== categoryId);
    
    let differentCategory = null;
    if (categoriesExceptSelected.length > 0) {
      const randomCat = categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)];
      differentCategory = await Category.findById(randomCat._id);
      const diffCourses = await Course.find({ 
        category: randomCat._id, 
        status: "Published" 
      });
      differentCategory.courses = diffCourses;
    }

    // Get top-selling courses across all categories
    const allCourses = await Course.find({ status: "Published" });
    const mostSellingCourses = allCourses
      .sort((a, b) => (b.studentsEnrolled?.length || 0) - (a.studentsEnrolled?.length || 0))
      .slice(0, 10);

    // Populate instructor for most selling courses
    for (let course of mostSellingCourses) {
      if (course.instructor) {
        const User = require("../models/User");
        course.instructor = await User.findById(course.instructor);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}
