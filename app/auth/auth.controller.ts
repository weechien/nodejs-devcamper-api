import { RequestHandler } from 'express'
import crypto from 'crypto'

import { User } from '../user/user.model'
import { sendTokenResponse, sendEmail } from './auth.utils'
import { UserRequest } from '../../middlewares/auth.middleware'
import { asyncHandler } from '../../middlewares/async.middleware'
import { ErrorResponse } from '../../middlewares/error.middleware'

/**
 * Register user
 * @route POST /api/v1/auth/register
 * @access Public
 */
export const register: RequestHandler = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  })
  sendTokenResponse(user, 200, res)
})

/**
 * Login user
 * @route POST /api/v1/auth/login
 * @access Public
 */
export const login: RequestHandler = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  // Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password.', 400))
  }
  // Check for user
  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    return next(new ErrorResponse('Invalid credentials.', 401))
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password)

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials.', 401))
  }
  sendTokenResponse(user, 200, res)
})

/**
 * Log user out / clear cookie
 * @route GET /api/v1/auth/logout
 * @access Private
 */
export const logout: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + Number(process.env.LOGOUT_COOKIE_EXPIRE)),
      httpOnly: true,
    })

    res.status(200).json({
      success: true,
      data: {},
    })
  }
)

/**
 * Get current logged in user
 * @route GET /api/v1/auth/me
 * @access Private
 */
export const getMe: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const { id } = req.user!
    const user = await User.findById(id)

    res.status(200).json({
      success: true,
      data: user,
    })
  }
)

/**
 * Update user details
 * @route PUT /api/v1/auth/updatedetails
 * @access Private
 */
export const updateDetails: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const { _id } = req.user!
    const { name, email } = req.body

    const fieldsToUpdate = { name, email }
    const user = await User.findByIdAndUpdate(_id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: user,
    })
  }
)

/**
 * Update password
 * @route PUT /api/v1/auth/updatepassword
 * @access Private
 */
export const updatePassword: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const { _id } = req.user!
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(_id).select('+password')

    // Check current password
    if (!(await user!.matchPassword(currentPassword))) {
      return next(new ErrorResponse('Password is incorrect.', 401))
    }

    user!.password = newPassword
    await user!.save()

    sendTokenResponse(user!, 200, res)
  }
)

/**
 * Forgot password
 * @route POST /api/v1/auth/forgotpassword
 * @access Public
 */
export const forgotPassword: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
      return next(new ErrorResponse('There is no user with that email.', 404))
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })

    // Create reset url
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/auth/resetpassword/${resetToken}`

    const message = `You are receiving this email because you (or someone else) requested the reset of a password. Please make a PUT request to: \n\n${resetUrl}`

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message,
      })

      res.status(200).json({ success: true, data: 'Email sent' })
    } catch (err) {
      console.error(err)

      user.resetPasswordToken = undefined
      user.resetPasswordToken = undefined

      await user.save({ validateBeforeSave: false })

      return next(new ErrorResponse('Email could not be sent.', 500))
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  }
)

/**
 * Reset password
 * @route PUT /api/v1/auth/resetpassword/:resettoken
 * @access Public
 */
export const resetPassword: RequestHandler = asyncHandler(
  async (req: UserRequest, res, next) => {
    // Get hashed password
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex')

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: new Date(Date.now()) },
    })

    if (!user) {
      return next(new ErrorResponse('Invalid token', 400))
    }

    // Set new password
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    sendTokenResponse(user, 200, res)
  }
)
