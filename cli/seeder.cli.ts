import 'colors'
import fs from 'fs'
import dotenv from 'dotenv'

import { connectDb } from '../config/db.config'

// Configurations
dotenv.config({ path: '../config/config.env' })

// Connect to database
connectDb()

import { Bootcamp } from '../app/bootcamp/bootcamp.model'
import { Course } from '../app/course/course.model'
import { User } from '../app/user/user.model'
import { Review } from '../app/review/review.model'

// Read JSON files
const bootcamps = JSON.parse(
  fs.readFileSync(`${__dirname}/../_data/bootcamps.json`, 'utf-8')
)
const courses = JSON.parse(
  fs.readFileSync(`${__dirname}/../_data/courses.json`, 'utf-8')
)
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/../_data/users.json`, 'utf-8')
)
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/../_data/reviews.json`, 'utf-8')
)

// Import into database
const importData = async () => {
  try {
    await Bootcamp.create(bootcamps)
    await Course.create(courses)
    await User.create(users)
    await Review.create(reviews)

    console.log('Data Imported...'.green.inverse)
    process.exit()
  } catch (err) {
    console.error(err)
  }
}

// Delete data
const deleteData = async () => {
  try {
    await Bootcamp.deleteMany({})
    await Course.deleteMany({})
    await User.deleteMany({})
    await Review.deleteMany({})

    console.log('Data Deleted...'.red.inverse)
    process.exit()
  } catch (err) {
    console.error(err)
  }
}

if (process.argv[2] === '-i') {
  importData()
} else if (process.argv[2] === '-d') {
  deleteData()
}
