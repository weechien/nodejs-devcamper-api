import express from 'express'

import {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
} from './review.controller'
import { Review } from './review.model'
import { Role } from '../user/user.types'
import { protect, authorize } from '../../middlewares/auth.middleware'
import { advancedResults } from '../../middlewares/advancedResults.middleware'

export const reviewRouter = express.Router({ mergeParams: true })

reviewRouter
  .route('/')
  .get(
    advancedResults(Review, { path: 'bootcamp', select: 'name description' }),
    getReviews
  )
  .post(protect, authorize(Role.USER, Role.ADMIN), addReview)

reviewRouter
  .route('/:id')
  .get(getReview)
  .put(protect, authorize(Role.USER, Role.ADMIN), updateReview)
  .delete(protect, authorize(Role.USER, Role.ADMIN), deleteReview)
