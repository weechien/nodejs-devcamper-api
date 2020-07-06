import path from 'path'
import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import fileupload from 'express-fileupload'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import hpp from 'hpp'
import cors from 'cors'
import 'colors'

import { xssClean } from './middlewares/xssClean.middleware'
import { errorHandler } from './middlewares/error.middleware'
import { connectDb } from './config/db.config'

// Configurations
dotenv.config({ path: './config/config.env' })

// Connect to database
connectDb()

// Route files
import { bootcampRouter } from './app/bootcamp/bootcamp.routes'
import { courseRouter } from './app/course/course.routes'
import { authRouter } from './app/auth/auth.routes'
import { userRouter } from './app/user/user.routes'
import { reviewRouter } from './app/review/review.routes'

// Initialize Express
const app = express()

// Body parser
app.use(express.json())

// Cookie parser
app.use(cookieParser())

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// File uploading
app.use(fileupload())

// Sanitize data
app.use(mongoSanitize())

// Set security headers
app.use(helmet())

// Prevent XSS attacks
app.use(xssClean)

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_TIME),
  max: Number(process.env.RATE_LIMIT_COUNT),
})
app.use(limiter)

// Prevent hpp param pollution
app.use(hpp())

// Enable CORS
app.use(cors())

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

// Mount routers
app.use('/api/v1/bootcamps', bootcampRouter)
app.use('/api/v1/courses', courseRouter)
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

app.use(errorHandler)

// Set port and start listening
const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () =>
  console.log(
    `Server running on ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
)

// Server error handlers
process.on('unhandledRejection', (err: Error, promise) => {
  console.log(`Error: ${err.message}`.red)
  server.close(() => process.exit(1))
})
