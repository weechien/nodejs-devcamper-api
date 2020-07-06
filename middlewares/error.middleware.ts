import { ErrorRequestHandler } from 'express'
import mongoose from 'mongoose'

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let error = { ...err }

  error.message = err.message
  console.log(err.stack?.red)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const msg = `Resource not found.`
    error = new ErrorResponse(msg, 404)
  }

  // Mongoose duplicate key (err.name === MongoError)
  if (err.code === 11000) {
    const msg = 'Duplicate field value entered.'
    error = new ErrorResponse(msg, 400)
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = err.errors as mongoose.Error.ValidationError
    const msg = Object.values(errors).map(e => e.message as string)
    error = new ErrorResponse(msg.join(), 400)
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  })
}

export class ErrorResponse extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}
