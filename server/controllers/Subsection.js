// Import necessary modules
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// Create a new sub-section for a given section
exports.createSubSection = async (req, res) => {
    try {
      // Extract necessary information from the request body
      const { sectionId, title, description } = req.body
      const video = req.files.video
  
      // Check if all necessary fields are provided
      if (!sectionId || !title || !description || !video) {
        return res
          .status(404)
          .json({ success: false, message: "All Fields are Required" })
      }
      // console.log(video)
  
      // Upload the video file to Cloudinary
      const uploadDetails = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      )
      // console.log(uploadDetails)
      // Create a new sub-section with the necessary information
      const SubSectionDetails = await SubSection.create({
        title: title,
        timeDuration: `${uploadDetails.duration}`,
        description: description,
        videoUrl: uploadDetails.secure_url,
      })
  
      // Update the corresponding section with the newly created sub-section
      const section = await Section.findById(sectionId);
      if (!section.SubSection) section.SubSection = [];
      section.SubSection.push(SubSectionDetails._id);
      const updatedSection = await Section.findByIdAndUpdate(sectionId, section, { new: true });
  
      // Return the updated section in the response
      return res.status(200).json({ success: true, data: updatedSection })
    } catch (error) {
      // Handle any errors that may occur during the process
      console.error("Error creating new sub-section:", error)
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }
  
  exports.updateSubSection = async (req, res) => {
    try {
      const { sectionId,SubSectionId, title, description } = req.body
      const SubSectionData = await SubSection.findById(SubSectionId)
  
      if (!SubSectionData) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
  
      if (title !== undefined) {
        SubSectionData.title = title
      }
  
      if (description !== undefined) {
        SubSectionData.description = description
      }
      if (req.files && req.files.video !== undefined) {
        const video = req.files.video
        const uploadDetails = await uploadImageToCloudinary(
          video,
          process.env.FOLDER_NAME
        )
        SubSectionData.videoUrl = uploadDetails.secure_url
        SubSectionData.timeDuration = `${uploadDetails.duration}`
      }
  
      await SubSection.findByIdAndUpdate(SubSectionId, SubSectionData, { new: true })

      const updatedSection = await Section.findById(sectionId).populate("SubSection");
  
      return res.json({
        success: true,
        data:updatedSection,
        message: "Section updated successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
  }
  
  exports.deleteSubSection = async (req, res) => {
    try {
      const { SubSectionId, sectionId } = req.body
      const section = await Section.findById(sectionId);
      if (section && section.SubSection) {
        section.SubSection = section.SubSection.filter(id => id !== SubSectionId);
        await Section.findByIdAndUpdate(sectionId, section, { new: true });
      }
      const SubSectionData = await SubSection.findByIdAndDelete(SubSectionId)
  
      if (!SubSectionData) {
        return res
          .status(404)
          .json({ success: false, message: "SubSection not found" })
      }
      const updatedSection=await Section.findById(sectionId).populate("SubSection");  
      return res.json({
        success: true,
        data:updatedSection,
        message: "SubSection deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the SubSection",
      })
    }
  }