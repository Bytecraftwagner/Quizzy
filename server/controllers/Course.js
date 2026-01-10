const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const {uploadImageToCloudinary} = require("../utils/imageUploader");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const CourseProgress =require('../models/CourseProgress')
const { convertSecondsToDuration } = require("../utils/secToDuration")
// Function to create a new course
exports.createCourse = async (req, res) => {
    try { // Get user ID from request object
        const userId = req.user.id;

        // Get all required fields from request body
        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            tag,
            category,
            status,
            instructions
        } = req.body;

        // Get thumbnail image from request files
        const thumbnail = req.files.thumbnailImage;

        // Check if any of the required fields are missing
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || ! thumbnail || !category) {
            return res.status(400).json({success: false, message: "All Fields are Mandatory"});
        }
        if (!status || status === undefined) {
            status = "Draft";
        }
        // Check if the user is an instructor
        const instructorDetails = await User.findById(userId);
        if (instructorDetails && instructorDetails.accountType !== "Instructor") {
            return res.status(404).json({success: false, message: "Instructor Details Not Found"});
        }

        if (! instructorDetails) {
            return res.status(404).json({success: false, message: "Instructor Details Not Found"});
        }

        // Check if the tag given is valid
        const categoryDetails = await Category.findById(category);
        if (! categoryDetails) {
            return res.status(404).json({success: false, message: "Category Details Not Found"});
        }
        // Upload the Thumbnail to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
        // console.log(thumbnailImage);
        // Create a new course with the given details
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag: tag,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            status: status,
            instructions: instructions
        });

        // Add the new course to the User Schema of the Instructor
        const updatedInstructor = await User.findById(instructorDetails._id);
        if (!updatedInstructor.courses) updatedInstructor.courses = [];
        updatedInstructor.courses.push(newCourse._id);
        await User.findByIdAndUpdate(instructorDetails._id, updatedInstructor, {new: true});
        
        const categoryDetails2 = await Category.findById(category);
        if (categoryDetails2) {
            if (!categoryDetails2.courses) categoryDetails2.courses = [];
            categoryDetails2.courses.push(newCourse._id);
            await Category.findByIdAndUpdate(category, categoryDetails2, {new: true});
        }
        
        // Return the new course and a success message
        // console.log("this is updated cat",categoryDetails2)
        res.status(200).json({success: true, data: newCourse, message: "Course Created Successfully"});
    } catch (error) { // Handle any errors that occur during the creation of the course
        console.error(error);
        res.status(500).json({success: false, message: "Failed to create course", error: error.message});
    }
};

// Edit Course Details
exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
      // console.log(course)
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        // console.log("thumbnail update")
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await uploadImageToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
  
      await Course.findByIdAndUpdate(courseId, course, {new: true});
  
      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }
  // Get Course List
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find({
            status: "Published"
        });
        
        // Populate instructor data
        for (let course of allCourses) {
            if (course.instructor) {
                course.instructor = await User.findById(course.instructor);
            }
        }

        return res.status(200).json({success: true, data: allCourses})
    } catch (error) {
        console.log(error)
        return res.status(404).json({success: false, message: `Can't Fetch Data`, error: error.message})
    }
}

exports.getCourseDetails = async (req, res) => {
    try {
        const {courseId} = req.body
        const courseDetails = await Course.findOne({_id: courseId})

        if (! courseDetails) {
            return res.status(400).json({success: false, message: `Could not find course with id: ${courseId}`})
        }

        // Populate instructor
        if (courseDetails.instructor) {
            courseDetails.instructor = await User.findById(courseDetails.instructor);
        }

        // Populate category
        if (courseDetails.category) {
            courseDetails.category = await Category.findById(courseDetails.category);
        }

        // Populate course content (sections and subsections)
        if (courseDetails.courseContent && Array.isArray(courseDetails.courseContent)) {
            courseDetails.courseContent = await Promise.all(
                courseDetails.courseContent.map(async (sectionId) => {
                    const section = await Section.findById(sectionId);
                    if (section && section.SubSection) {
                        section.SubSection = await Promise.all(
                            section.SubSection.map(subId => SubSection.findById(subId))
                        );
                    }
                    return section;
                })
            );
        }

        let totalDurationInSeconds = 0
        if (courseDetails.courseContent) {
            courseDetails.courseContent.forEach((content) => {
                if (content && content.SubSection) {
                    content.SubSection.forEach((SubSection) => {
                        const timeDurationInSeconds = parseInt(SubSection.timeDuration)
                        totalDurationInSeconds += timeDurationInSeconds
                    })
                }
            })
        }

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration
            }
        })
    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
    }
}
exports.getFullCourseDetails = async (req, res) => {
    try {
        const {courseId} = req.body
        const userId = req.user.id
        const courseDetails = await Course.findOne({_id: courseId})

        let courseProgressCount = await CourseProgress.findOne({courseID: courseId, userId: userId})

        if (! courseDetails) {
            return res.status(400).json({success: false, message: `Could not find course with id: ${courseId}`})
        }

        // Populate instructor
        if (courseDetails.instructor) {
            courseDetails.instructor = await User.findById(courseDetails.instructor);
        }

        // Populate category
        if (courseDetails.category) {
            courseDetails.category = await Category.findById(courseDetails.category);
        }

        // Populate course content (sections and subsections)
        if (courseDetails.courseContent && Array.isArray(courseDetails.courseContent)) {
            courseDetails.courseContent = await Promise.all(
                courseDetails.courseContent.map(async (sectionId) => {
                    const section = await Section.findById(sectionId);
                    if (section && section.SubSection) {
                        section.SubSection = await Promise.all(
                            section.SubSection.map(subId => SubSection.findById(subId))
                        );
                    }
                    return section;
                })
            );
        }

        let totalDurationInSeconds = 0
        if (courseDetails.courseContent) {
            courseDetails.courseContent.forEach((content) => {
                if (content && content.SubSection) {
                    content.SubSection.forEach((SubSection) => {
                        const timeDurationInSeconds = parseInt(SubSection.timeDuration)
                        totalDurationInSeconds += timeDurationInSeconds
                    })
                }
            })
        }

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos ? courseProgressCount?.completedVideos : []
            }
        })
    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
    }
}

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
    try { // Get the instructor ID from the authenticated user or request body
        const instructorId = req.user.id

        // Find all courses belonging to the instructor
        const instructorCourses = await Course.find({instructor: instructorId}).sort({createdAt: -1})
      
        // Return the instructor's courses
        res.status(200).json({success: true, data: instructorCourses})
    } catch (error) {
        console.error(error)
        res.status(500).json({success: false, message: "Failed to retrieve instructor courses", error: error.message})
    }
}

// Delete the Course
exports.deleteCourse = async (req, res) => {
    try {
      const { courseId } = req.body
  
      // Find the course
      const course = await Course.findById(courseId)
      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }
  
      // Unenroll students from the course
      if (course.studentsEnrolled && Array.isArray(course.studentsEnrolled)) {
        for (const studentId of course.studentsEnrolled) {
          const student = await User.findById(studentId);
          if (student && student.courses) {
            student.courses = student.courses.filter(id => id !== courseId);
            await User.findByIdAndUpdate(studentId, student, {new: true});
          }
        }
      }
  
      // Delete sections and sub-sections
      if (course.courseContent && Array.isArray(course.courseContent)) {
        for (const sectionId of course.courseContent) {
          // Delete sub-sections of the section
          const section = await Section.findById(sectionId)
          if (section && section.SubSection) {
            for (const SubSectionId of section.SubSection) {
              await SubSection.findByIdAndDelete(SubSectionId)
            }
          }
    
          // Delete the section
          await Section.findByIdAndDelete(sectionId)
        }
      }
  
      // Delete the course
      await Course.findByIdAndDelete(courseId)
  
      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
    }
  }