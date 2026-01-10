const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const CourseProgress = require("../models/CourseProgress")

const { convertSecondsToDuration } = require("../utils/secToDuration");
const Course = require("../models/Course");
// Method for updating a profile
exports.updateProfile = async (req, res) => {
	const id = req.user.id;
	const userDetails = await User.findById(id);
	const profile = await Profile.findById(userDetails.additionalDetails);
	try {
		const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

		// Update the profile fields
		profile.dateOfBirth = dateOfBirth;
		profile.about = about;
		profile.gender = gender;
		profile.contactNumber = contactNumber;

		// Save the updated profile
		await Profile.findByIdAndUpdate(userDetails.additionalDetails, profile, { new: true });

		return res.json({
			success: true,
			message: "Profile updated successfully",
			profile,
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			error: error.message,
		});
	}
};

exports.deleteAccount = async (req, res) => {
	try {
		const id = req.user.id;
		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}
		// Delete Assosiated Profile with the User
		await Profile.findByIdAndDelete(user.additionalDetails);
		// Now Delete User
		await User.findByIdAndDelete(id);
		res.status(200).json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		console.log(error);
		res
			.status(500)
			.json({ success: false, message: "User Cannot be deleted successfully" });
	}
};

exports.getAllUserDetails = async (req, res) => {
	try {
		const id = req.user.id;
		let userDetails = await User.findById(id);
		if (userDetails && userDetails.additionalDetails) {
			userDetails.additionalDetails = await Profile.findById(userDetails.additionalDetails);
		}
		// console.log(userDetails);
		res.status(200).json({
			success: true,
			message: "User Data fetched successfully",
			data: userDetails,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
    //   console.log(image)
      const user = await User.findById(userId);
      user.image = image.secure_url;
      const updatedProfile = await User.findByIdAndUpdate(userId, user, { new: true })
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
}; 
exports.getEnrolledCourses = async (req, res) => {
	try {
	  const userId = req.user.id;
	  const Course = require("../models/Course");
	  const Section = require("../models/Section");
	  const SubSection = require("../models/SubSection");
	  
	  let userDetails = await User.findById(userId);
	  
	  // Populate courses
	  if (userDetails && userDetails.courses && Array.isArray(userDetails.courses)) {
		userDetails.courses = await Promise.all(
		  userDetails.courses.map(async (courseId) => {
			const course = await Course.findById(courseId);
			if (course && course.courseContent) {
			  course.courseContent = await Promise.all(
				course.courseContent.map(async (sectionId) => {
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
			return course;
		  })
		);
	  }
	  var SubSectionLength = 0
	  for (var i = 0; i < userDetails.courses.length; i++) {
		let totalDurationInSeconds = 0
		SubSectionLength = 0
		for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
		  totalDurationInSeconds += userDetails.courses[i].courseContent[
			j
		  ].SubSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
		  userDetails.courses[i].totalDuration = convertSecondsToDuration(
			totalDurationInSeconds
		  )
		  SubSectionLength +=
			userDetails.courses[i].courseContent[j].SubSection.length
		}
		let courseProgressCount = await CourseProgress.findOne({
		  courseID: userDetails.courses[i]._id,
		  userId: userId,
		})
		courseProgressCount = courseProgressCount?.completedVideos.length
		if (SubSectionLength === 0) {
		  userDetails.courses[i].progressPercentage = 100
		} else {
		  // To make it up to 2 decimal point
		  const multiplier = Math.pow(10, 2)
		  userDetails.courses[i].progressPercentage =
			Math.round(
			  (courseProgressCount / SubSectionLength) * 100 * multiplier
			) / multiplier
		}
	  }
  
	  if (!userDetails) {
		return res.status(400).json({
		  success: false,
		  message: `Could not find user with id: ${userDetails}`,
		})
	  }
	  return res.status(200).json({
		success: true,
		data: userDetails.courses,
	  })
	} catch (error) {
	  return res.status(500).json({
		success: false,
		message: error.message,
	  })
	}
  }


//   instructor dashboard controller
exports.instructorDashboard = async (req, res) => {
	// console.log(res)
	try {
	//   const courseDetails = await Course.find({ instructor: req.user.id })
	const courseDetails=await Course.find({instructor:req.user.id})
		// console.log(courseDetails)
	
	  const courseData = courseDetails.map((course) => {
		const totalStudentsEnrolled = course.studentsEnrolled.length
		const totalAmountGenerated = totalStudentsEnrolled * course.price
  
		// Create a new object with the additional fields
		const courseDataWithStats = {
		  _id: course._id,
		  courseName: course.courseName,
		  courseDescription: course.courseDescription,
		  // Include other course properties as needed
		  totalStudentsEnrolled,
		  totalAmountGenerated,
		}
  
		return courseDataWithStats
	  }
	  )
  
	  res.status(200).json({ courses: courseData })
	} catch (error) {
	  console.error(error)
	  res.status(500).json({ message: "Internal Server Error" })
	}
  }
  