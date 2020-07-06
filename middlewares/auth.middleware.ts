import jwt from 'jsonwebtoken'
import { DocumentType } from '@typegoose/typegoose'
import { Request, Response, NextFunction } from 'express'

import { Role } from '../app/user/user.types'
import { asyncHandler } from './async.middleware'
import { ErrorResponse } from './error.middleware'
import { User, UserClass } from '../app/user/user.model'

export interface UserRequest extends Request {
  user?: DocumentType<UserClass> | null
}

interface JwtDecoded {
  id: string
  iat: number
  exp: number
}

// Protect routes
export const protect = asyncHandler(async (req: UserRequest, res, next) => {
  let _token: string | undefined

  const { authorization: auth } = req.headers
  const { token } = req.cookies

  if (auth && auth.startsWith('Bearer')) {
    // Set token from Bearer tokenin header
    _token = auth.split(' ')[1]
  } else if (token) {
    // Set token from cookie
    _token = token
  }

  // Make sure token exists
  if (!_token) {
    return next(new ErrorResponse('Not authorized to access this route.', 401))
  }

  try {
    // Verify token
    const decoded = jwt.verify(_token, process.env.JWT_SECRET!) as JwtDecoded

    req.user = await User.findById(decoded.id)

    next()
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route.', 401))
  }
})

// Grant access to specific roles
export const authorize = (...roles: Role[]) => (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  const { role } = req.user!

  if (!roles.includes(role)) {
    return next(
      new ErrorResponse(
        `User role ${role} is not authorized to access this route.`,
        403
      )
    )
  }
  next()
}
