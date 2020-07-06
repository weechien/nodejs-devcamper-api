import {
  prop,
  getModelForClass,
  Ref,
  index,
  mongoose,
  pre,
  post,
} from '@typegoose/typegoose'

import { UserClass } from '../user/user.model'
import { BootcampClass, Bootcamp } from '../bootcamp/bootcamp.model'

// Get average rating before remove
@pre<ReviewClass>('remove', function (next) {
  ReviewClass.getAverageRating(this.bootcamp)
  next()
})
// Get average rating after save
@post<ReviewClass>('save', function (course) {
  ReviewClass.getAverageRating(course.bootcamp)
})
// Prevent user from submitting more than 1 review per bootcamp
@index({ bootcamp: 1, user: 1 }, { unique: true })
export class ReviewClass {
  @prop({
    required: [true, 'Please add a title for the review.'],
    trim: true,
    maxlength: 100,
  })
  public title!: string

  @prop({ required: [true, 'Please add some text.'] })
  public text!: string

  @prop({
    required: [true, 'Please add a rating between 1 and 10.'],
    min: 1,
    max: 10,
  })
  public rating!: number

  @prop({ default: Date.now() })
  public createdAt?: Date

  @prop({ required: true, ref: () => 'BootcampClass' })
  public bootcamp: Ref<BootcampClass>

  @prop({ required: true, ref: () => 'UserClass' })
  public user: Ref<UserClass>

  // Static method to get average rating and save
  public static getAverageRating = async (
    bootcampId: Ref<BootcampClass, mongoose.Types.ObjectId | undefined>
  ) => {
    const obj = await Review.aggregate([
      {
        $match: { bootcamp: bootcampId },
      },
      {
        $group: { _id: '$bootcamp', averageRating: { $avg: '$rating' } },
      },
    ])

    try {
      await Bootcamp.findByIdAndUpdate(bootcampId, {
        averageRating: obj[0].averageRating,
      })
    } catch (err) {
      console.error(err)
    }
  }
}

export const Review = getModelForClass(ReviewClass)
