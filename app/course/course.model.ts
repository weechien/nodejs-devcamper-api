import {
  prop,
  getModelForClass,
  Ref,
  pre,
  post,
  mongoose,
} from '@typegoose/typegoose'

import { UserClass } from '../user/user.model'
import { BootcampClass, Bootcamp } from '../bootcamp/bootcamp.model'

enum MinimumSkill {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

// Get average cost before remove
@pre<CourseClass>('remove', function (next) {
  CourseClass.getAverageCost(this.bootcamp)
  next()
})
// Get average cost after save
@post<CourseClass>('save', function (course) {
  CourseClass.getAverageCost(course.bootcamp)
})
export class CourseClass {
  @prop({ required: [true, 'Please add a course title.'], trim: true })
  public title!: string

  @prop({ required: [true, 'Please add a description.'] })
  public description!: string

  @prop({ required: [true, 'Please add number of weeks.'] })
  public weeks!: string

  @prop({ required: [true, 'Please add a tuition cost.'] })
  public tuition!: number

  @prop({ required: [true, 'Please add a minimum skill.'], enum: MinimumSkill })
  public minimumSkill!: MinimumSkill

  @prop({ default: false })
  public scholarshipAvailable?: boolean

  @prop({ default: Date.now() })
  public createdAt?: Date

  @prop({ required: true, ref: () => 'BootcampClass' })
  public bootcamp: Ref<BootcampClass>

  @prop({ required: true, ref: () => 'UserClass' })
  public user: Ref<UserClass>

  // Static method to get average of course tuitions
  public static getAverageCost = async (
    bootcampId: Ref<BootcampClass, mongoose.Types.ObjectId | undefined>
  ) => {
    const obj = await Course.aggregate([
      {
        $match: { bootcamp: bootcampId },
      },
      {
        $group: { _id: '$bootcamp', averageCost: { $avg: '$tuition' } },
      },
    ])

    try {
      await Bootcamp.findByIdAndUpdate(bootcampId, {
        averageCost: Math.ceil(obj[0].averageCost),
      })
    } catch (err) {
      console.error(err)
    }
  }
}

export const Course = getModelForClass(CourseClass)
