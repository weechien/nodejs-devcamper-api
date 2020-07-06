import express from 'express'

import {
  getCourses,
  getCourse,
  addCourse,
  updateCourse,
  deleteCourse,
} from './course.controller'
import { Course } from './course.model'
import { Role } from '../user/user.types'
import { protect, authorize } from '../../middlewares/auth.middleware'
import { advancedResults } from '../../middlewares/advancedResults.middleware'

export const courseRouter = express.Router({ mergeParams: true })

courseRouter
  .route('/')
  .get(
    advancedResults(Course, { path: 'bootcamp', select: 'name description' }),
    getCourses
  )
  .post(protect, authorize(Role.PUBLISHER, Role.ADMIN), addCourse)

courseRouter
  .route('/:id')
  .get(getCourse)
  .put(protect, authorize(Role.PUBLISHER, Role.ADMIN), updateCourse)
  .delete(protect, authorize(Role.PUBLISHER, Role.ADMIN), deleteCourse)
