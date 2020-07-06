import { RequestHandler } from 'express'

import { User } from './user.model'
import { asyncHandler } from '../../middlewares/async.middleware'
import { AdvancedResponse } from '../../middlewares/advancedResults.middleware'

/**
 * Get all users
 * @route GET /api/v1/users
 * @access Private/Admin
 */
export const getUsers: RequestHandler = asyncHandler(
  async (req, res: AdvancedResponse, next) => {
    res.status(200).json(res.advancedResults)
  }
)

/**
 * Get single user
 * @route GET /api/v1/users/:id
 * @access Private/Admin
 */
export const getUser: RequestHandler = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)

  res.status(200).json({ success: true, data: user })
})

/**
 * Create user
 * @route POST /api/v1/users
 * @access Private/Admin
 */
export const createUser: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const user = await User.create(req.body)

    res.status(201).json({ success: true, data: user })
  }
)

/**
 * Update user
 * @route PUT /api/v1/users/:id
 * @access Private/Admin
 */
export const updateUser: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({ success: true, data: user })
  }
)

/**
 * Delete user
 * @route DELETE /api/v1/users/:id
 * @access Private/Admin
 */
export const deleteUser: RequestHandler = asyncHandler(
  async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id)

    res.status(200).json({ success: true, data: {} })
  }
)
