import express from 'express'

import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from './user.controller'
import { Role } from './user.types'
import { User } from './user.model'
import { advancedResults } from '../../middlewares/advancedResults.middleware'
import { protect, authorize } from '../../middlewares/auth.middleware'

export const userRouter = express.Router()

userRouter.use(protect)
userRouter.use(authorize(Role.ADMIN))

userRouter.route('/').get(advancedResults(User), getUsers).post(createUser)

userRouter.route('/:id').get(getUser).put(updateUser).delete(deleteUser)
