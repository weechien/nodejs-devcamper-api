import { RequestHandler } from 'express'

import { Course } from './course.model'
import { Role } from '../user/user.types'
import { Bootcamp } from '../bootcamp/bootcamp.model'
import { UserRequest } from '../../middlewares/auth.middleware'
import { asyncHandler } from '../../middlewares/async.middleware'
import { ErrorResponse } from '../../middlewares/error.middleware'
import { AdvancedResponse } from '../../middlewares/advancedResults.middleware'

interface Page {
  page: number
  limit: number
}

interface Pagination {
  prev: Page
  next: Page
}

/**
 * Get courses
 * @route GET /api/v1/courses
 * @route GET /api/v1/bootcamps/:bootcampId/courses
 * @access Public
 */
export const getCourses: RequestHandler = asyncHandler(
  async (req, res: AdvancedResponse, next) => {
    if (req.params.bootcampId) {
      const courses = await Course.find({ bootcamp: req.params.bootcampId })

      return res.status(200).json({
        success: true,
        count: courses.length,
        data: courses,
      })
    } else {
      return res.status(200).json(res.advancedResults)
    }
  }
)

/**
 * Get single course
 * @route GET /api/v1/courses/:id
 * @access Public
 */
export const getCourse: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const course = await Course.findById(req.params.id).populate({
      path: 'bootcamp',
      select: 'name description',
    })

    if (!course) {
      return next(
        new ErrorResponse(`No course found with id of ${req.params.id}.`, 404)
      )
    }

    res.status(200).json({ success: true, data: course })
  }
)

/**
 * Create course
 * @route POST /api/v1/bootcamps/:bootcampId/courses
 * @access Private
 */
export const addCourse: RequestHandler = asyncHandler(
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

    // Make sure user is bootcamp owner or admin
    if (
      bootcamp.user!.toString() !== req.user!._id.toString() &&
      req.user!.role !== Role.ADMIN
    ) {
      return next(
        new ErrorResponse(
          `User ${
            req.user!._id
          } is not authorized to add a course to bootcamp ${bootcamp._id}.`,
          401
        )
      )
    }

    const course = await Course.create(req.body)

    res.status(201).json({
      success: true,
      data: course,
    })
  }
)

/**
 * Update course
 * @route PUT /api/v1/courses/:id
 * @access Private
 */
export const updateCourse: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    let course = await Course.findById(req.params.id)

    if (!course) {
      return next(
        new ErrorResponse(`No course found with id of ${req.params.id}.`, 404)
      )
    }

    // Make sure user is course owner or admin
    if (
      course.user!.toString() !== req.user!._id.toString() &&
      req.user!.role !== Role.ADMIN
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user!._id} is not authorized to update course ${
            course._id
          }.`,
          401
        )
      )
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    res.status(200).json({ success: true, data: course })
  }
)

/**
 * Delete course
 * @route DELETE /api/v1/courses/:id
 * @access Private
 */
export const deleteCourse: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return next(
        new ErrorResponse(`No course found with id of ${req.params.id}.`, 404)
      )
    }

    // Make sure user is course owner or admin
    if (
      course.user!.toString() !== req.user!._id.toString() &&
      req.user!.role !== Role.ADMIN
    ) {
      return next(
        new ErrorResponse(
          `User ${req.user!._id} is not authorized to delete course ${
            course._id
          }.`,
          401
        )
      )
    }
    await course.remove()

    res.status(200).json({ success: true, data: {} })
  }
)
