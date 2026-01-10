const RatingAndReview = require("../models/RatingAndRaview");
const Course = require("../models/Course");

//createRating
exports.createRating = async (req, res) => {
    try{

        //get user id
        const userId = req.user.id;
        //fetchdata from req body
        const {rating, review, courseId} = req.body;
        //check if user is enrolled or not
        const courseDetails = await Course.findById(courseId);
        const isEnrolled = courseDetails && courseDetails.studentsEnrolled && 
                          courseDetails.studentsEnrolled.includes(userId);

        if(!isEnrolled) {
            return res.status(404).json({
                success:false,
                message:'Student is not enrolled in the course',
            });
        }
        //check if user already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
                                                user:userId,
                                                course:courseId,
                                            });
        if(alreadyReviewed) {
                    return res.status(403).json({
                        success:false,
                        message:'Course is already reviewed by the user',
                    });
                }
        //create rating and review
        const ratingReview = await RatingAndReview.create({
                                        rating, review, 
                                        course:courseId,
                                        user:userId,
                                    });
       
        //update course with this rating/review
        const course = await Course.findById(courseId);
        if (!course.ratingAndReviews) course.ratingAndReviews = [];
        course.ratingAndReviews.push(ratingReview._id);
        const updatedCourseDetails = await Course.findByIdAndUpdate(courseId, course, {new: true});
        // console.log(updatedCourseDetails);
        //return response
        return res.status(200).json({
            success:true,
            message:"Rating and Review created Successfully",
            ratingReview,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}



//getAverageRating
exports.getAverageRating = async (req, res) => {
    try {
            //get course ID
            const courseId = req.body.courseId;
            //calculate avg rating
            const reviews = await RatingAndReview.find({ course: courseId });
            
            if(reviews.length > 0) {
                const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
                return res.status(200).json({
                    success:true,
                    averageRating: averageRating,
                })
            }
            
            //if no rating/Review exist
            return res.status(200).json({
                success:true,
                message:'Average Rating is 0, no ratings given till now',
                averageRating:0,
            })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}


//getAllRatingAndReviews

exports.getAllRating = async (req, res) => {
    try{
            const User = require("../models/User");
            const Course = require("../models/Course");
            
            let allReviews = await RatingAndReview.find({});
            allReviews = allReviews.sort((a, b) => b.rating - a.rating);
            
            // Populate user and course data
            allReviews = await Promise.all(allReviews.map(async (review) => {
                if (review.user) {
                    const user = await User.findById(review.user);
                    review.user = user ? {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        image: user.image
                    } : null;
                }
                if (review.course) {
                    const course = await Course.findById(review.course);
                    review.course = course ? { courseName: course.courseName } : null;
                }
                return review;
            }));
            
            return res.status(200).json({
                success:true,
                message:"All reviews fetched successfully",
                data:allReviews,
            });
    }   
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    } 
}