import { RequestHandler } from 'express'

import { Review } from './review.model'
import { Bootcamp } from '../bootcamp/bootcamp.model'
import { UserRequest } from '../../middlewares/auth.middleware'
import { asyncHandler } from '../../middlewares/async.middleware'
import { ErrorResponse } from '../../middlewares/error.middleware'
import { AdvancedResponse } from '../../middlewares/advancedResults.middleware'
import { Role } from '../user/user.types'

/**
 * Get reviews
 * @route GET /api/v1/reviews
 * @route GET /api/v1/bootcamps/:bootcampId/reviews
 * @access Public
 */
export const getReviews: RequestHandler = asyncHandler(
  async (req, res: AdvancedResponse, next) => {
    if (req.params.bootcampId) {
      const reviews = await Review.find({ bootcamp: req.params.bootcampId })

      return res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
      })
    } else {
      return res.status(200).json(res.advancedResults)
    }
  }
)

/**
 * Get single review
 * @route GET /api/v1/reviews/:id
 * @access Public
 */
export const getReview: RequestHandler = asyncHandler(
  async (req, res: AdvancedResponse, next) => {
    const review = await Review.findById(req.params.id).populate({
      path: 'bootcamp',
      select: 'name description',
    })

    if (!review) {
      return next(
        new ErrorResponse(`No review found with id of ${req.params.id}.`, 404)
      )
    }

    res.status(200).json({ success: true, data: review })
  }
)

/**
 * Create review
 * @route POST /api/v1/bootcamps/:bootcampId/reviews
 * @access Private
 */
export const addReview: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const { user } = req
    req.body.user = user!._id

    req.body.bootcamp = req.params.bootcampId

    const bootcamp = await Bootcamp.findById(req.params.bootcampId)

    if (!bootcamp) {
      return next(
        new ErrorResponse(
          `No bootcamp with the id of ${req.params.bootcampId}.`,
          404
        )
      )
    }
    const review = await Review.create(req.body)

    res.status(201).json({
      success: true,
      data: review,
    })
  }
)

/**
 * Update review
 * @route PUT /api/v1/reviews/:id
 * @access Private
 */
export const updateReview: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    let review = await Review.findById(req.params.id)

    if (!review) {
      return next(
        new ErrorResponse(`No review found with id of ${req.params.id}.`, 404)
      )
    }

    // Make sure user is review owner or admin
    if (
      review.user!.toString() !== req.user!._id.toString() &&
      req.user!.role !== Role.ADMIN
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user!._id} is not authorized to update review ${
            review._id
          }.`,
          401
        )
      )
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    res.status(200).json({ success: true, data: review })
  }
)

/**
 * Delete review
 * @route DELETE /api/v1/reviews/:id
 * @access Private
 */
export const deleteReview: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const review = await Review.findById(req.params.id)

    if (!review) {
      return next(
        new ErrorResponse(`No review found with id of ${req.params.id}.`, 404)
      )
    }

    // Make sure user is review owner or admin
    if (
      review.user!.toString() !== req.user!._id.toString() &&
      req.user!.role !== Role.ADMIN
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user!._id} is not authorized to delete review ${
            review._id
          }.`,
          401
        )
      )
    }
    await review.remove()

    res.status(200).json({ success: true, data: {} })
  }
)
