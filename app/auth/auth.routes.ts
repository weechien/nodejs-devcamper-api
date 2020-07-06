import express from 'express'

import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
} from './auth.controller'
import { protect } from '../../middlewares/auth.middleware'

export const authRouter = express.Router()

authRouter.route('/register').post(register)
authRouter.route('/login').post(login)
authRouter.route('/logout').get(logout)
authRouter.route('/me').get(protect, getMe)
authRouter.route('/updatedetails').put(protect, updateDetails)
authRouter.route('/updatepassword').put(protect, updatePassword)
authRouter.route('/forgotpassword').post(forgotPassword)
authRouter.route('/resetpassword/:resettoken').put(resetPassword)
