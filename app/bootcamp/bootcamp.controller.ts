import path from 'path'
import { RequestHandler } from 'express'
import { UploadedFile } from 'express-fileupload'

import { Role } from '../user/user.types'
import { Bootcamp } from './bootcamp.model'
import { geocoder } from './bootcamp.utils'
import { UserRequest } from '../../middlewares/auth.middleware'
import { asyncHandler } from '../../middlewares/async.middleware'
import { ErrorResponse } from '../../middlewares/error.middleware'
import { AdvancedResponse } from '../../middlewares/advancedResults.middleware'

/**
 * Get all bootcamps
 * @route GET /api/v1/bootcamps
 * @access Public
 */
export const getBootcamps: RequestHandler = asyncHandler(
  async (req, res: AdvancedResponse, next) => {
    res.status(200).json(res.advancedResults)
  }
)

/**
 * Get single bootcamp
 * @route GET /api/v1/bootcamps/:id
 * @access Public
 */
export const getBootcamp: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
      return next(
        new ErrorResponse(`No bootcamp found with id of ${req.params.id}.`, 404)
      )
    }

    res.status(200).json({ success: true, data: bootcamp })
  }
)

/**
 * Create bootcamp
 * @route POST /api/v1/bootcamps
 * @access Private
 */
export const addBootcamp: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const { user } = req
    req.body.user = user!._id

    // Check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: user!._id })

    // If the user is not an admin, they can only add one bootcamp
    if (publishedBootcamp && user!.role !== Role.ADMIN) {
      return next(
        new ErrorResponse(
          `The user with ID ${user!._id} has already published a bootcamp.`,
          400
        )
      )
    }

    const bootcamp = await Bootcamp.create(req.body)

    res.status(201).json({
      success: true,
      data: bootcamp,
    })
  }
)

/**
 * Update bootcamp
 * @route PUT /api/v1/bootcamps/:id
 * @access Private
 */
export const updateBootcamp: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const { id: _id } = req.params

    let bootcamp = await Bootcamp.findById(_id)

    if (!bootcamp) {
      return next(
        new ErrorResponse(`No bootcamp found with id of ${_id}.`, 404)
      )
    }

    // Make sure user is bootcamp owner or admin
    if (
      bootcamp.user!.toString() !== req.user!._id.toString() &&
      req.user!.role !== Role.ADMIN
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user!._id} is not authorized to update this bootcamp.`,
          401
        )
      )
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(_id, req.body, {
      new: true,
      runValidators: true,
    })
    res.status(200).json({ success: true, data: bootcamp })
  }
)

/**
 * Delete bootcamp
 * @route DELETE /api/v1/bootcamps/:id
 * @access Private
 */
export const deleteBootcamp: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const { id: _id } = req.params

    const bootcamp = await Bootcamp.findById(_id)

    if (!bootcamp) {
      return next(
        new ErrorResponse(`No bootcamp found with id of ${_id}.`, 404)
      )
    }

    // Make sure user is bootcamp owner or admin
    if (
      bootcamp.user!.toString() !== req.user!._id.toString() &&
      req.user!.role !== Role.ADMIN
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user!._id} is not authorized to delete this bootcamp.`,
          401
        )
      )
    }
    await bootcamp.remove()

    res.status(200).json({ success: true, data: {} })
  }
)

/**
 * Get bootcamp within a distance
 * @route GET /api/v1/bootcamps/radius/:zipcode/:distance
 * @access Private
 */
export const getBootcampInRadius: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const { zipcode, distance } = req.params

    // Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode)
    const lng = loc[0].longitude
    const lat = loc[0].latitude

    // Convert distance to radians
    // Earth radius: 3,963.2 mil / 6,378.1 km
    const radians = ((distance as unknown) as number) / 3963.2

    const bootcamps = await Bootcamp.find({
      location: { $geoWithin: { $centerSphere: [[lng, lat], radians] } },
    })

    res.status(200).json({
      success: true,
      count: bootcamps.length,
      data: bootcamps,
    })
  }
)

/**
 * Upload photo for bootcamp
 * @route PUT /api/v1/bootcamps/:id/photo
 * @access Private
 */
export const bootcampPhotoUpload: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id, req.body)

    if (!bootcamp) {
      return next(
        new ErrorResponse(`No bootcamp found with id of ${req.params.id}.`, 404)
      )
    }

    // Make sure user is bootcamp owner or admin
    if (
      bootcamp.user!.toString() !== req.user!._id.toString() &&
      req.user!.role !== Role.ADMIN
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user!._id} is not authorized to update this bootcamp.`,
          401
        )
      )
    }

    if (!req.files) {
      return next(new ErrorResponse('Please upload a file.', 400))
    }
    const file = req.files.file as UploadedFile

    // Make sure file is a photo
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Please upload an image file.', 400))
    }

    // Check filesize
    if (file.size > Number(process.env.MAX_FILE_UPLOAD)) {
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}.`,
          400
        )
      )
    }
    // Create custom filename
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
      if (err) {
        console.error(err)
        return next(new ErrorResponse('Problem with file upload.', 500))
      }
      await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })

      res.status(200).json({
        success: true,
        data: file.name,
      })
    })
  }
)
