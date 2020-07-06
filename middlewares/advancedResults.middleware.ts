import { Request, Response, NextFunction } from 'express'
import { ReturnModelType, DocumentType } from '@typegoose/typegoose'

import { BootcampClass } from '../app/bootcamp/bootcamp.model'
import { CourseClass } from '../app/course/course.model'
import { UserClass } from '../app/user/user.model'
import { ReviewClass } from '../app/review/review.model'

interface Page {
  page: number
  limit: number
}

interface Pagination {
  prev: Page
  next: Page
}

type Classes = BootcampClass | CourseClass | UserClass | ReviewClass
type ClassType =
  | typeof BootcampClass
  | typeof CourseClass
  | typeof UserClass
  | typeof ReviewClass

export interface AdvancedResponse extends Response {
  advancedResults?: {
    success: boolean
    count: number
    pagination: Pagination
    data: DocumentType<Classes>[]
  }
}

export const advancedResults = (
  model: ReturnModelType<ClassType, {}>,
  populate?: string | {}
) => async (req: Request, res: AdvancedResponse, next: NextFunction) => {
  let query = { ...req.query }

  // Exclude fields
  const removeFields = ['select', 'sort', 'page', 'limit']
  removeFields.forEach(field => delete query[field])

  // Parse operators ($lt, $lte, $gt, $gte, $in)
  let queryStr = JSON.stringify(query)
  queryStr = queryStr.replace(/\b(lt|lte|gt|gte|in)\b/g, match => `$${match}`)

  query = JSON.parse(queryStr)
  let docQuery = model.find(query)

  // Select
  if (req.query.select) {
    const fields = (req.query.select as string).split(',').join(' ')
    docQuery = docQuery.select(fields)
  }

  // Sort
  if (req.query.sort) {
    const sortBy = (req.query.sort as string).split(',').join(' ')
    docQuery = docQuery.sort(sortBy)
  } else {
    docQuery = docQuery.sort('-createdAt')
  }

  // Pagination
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 25
  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const total = await model.countDocuments()

  docQuery = docQuery.skip(startIndex).limit(limit)

  const pagination = {} as Pagination

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }

  if (populate) {
    docQuery = docQuery.populate(populate)
  }

  // Run query
  const results = await docQuery

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  }

  next()
}
