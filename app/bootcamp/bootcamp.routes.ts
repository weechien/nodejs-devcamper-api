import express from 'express'

import {
  getBootcamps,
  getBootcamp,
  addBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampInRadius,
  bootcampPhotoUpload,
} from './bootcamp.controller'
import { Role } from '../user/user.types'
import { Bootcamp } from './bootcamp.model'
import { courseRouter } from '../course/course.routes'
import { reviewRouter } from '../review/review.routes'
import { protect, authorize } from '../../middlewares/auth.middleware'
import { advancedResults } from '../../middlewares/advancedResults.middleware'

export const bootcampRouter = express.Router()

// Re-route into other resource routers
bootcampRouter.use('/:bootcampId/courses', courseRouter)
bootcampRouter.use('/:bootcampId/reviews', reviewRouter)

bootcampRouter.route('/radius/:zipcode/:distance').get(getBootcampInRadius)

bootcampRouter
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(protect, authorize(Role.PUBLISHER, Role.ADMIN), addBootcamp)

bootcampRouter
  .route('/:id/photo')
  .put(protect, authorize(Role.PUBLISHER, Role.ADMIN), bootcampPhotoUpload)

bootcampRouter
  .route('/:id')
  .get(getBootcamp)
  .put(protect, authorize(Role.PUBLISHER, Role.ADMIN), updateBootcamp)
  .delete(protect, authorize(Role.PUBLISHER, Role.ADMIN), deleteBootcamp)
