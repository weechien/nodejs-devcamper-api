import {
  prop,
  index,
  getModelForClass,
  pre,
  modelOptions,
  Severity,
  Ref,
} from '@typegoose/typegoose'
import slugify from 'slugify'

import { geocoder } from './bootcamp.utils'
import { CourseClass } from '../course/course.model'
import { UserClass } from '../user/user.model'
import { Careers } from './bootcamp.types'

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  },
})
// Geocode and create location field
@pre<BootcampClass>('save', async function (next) {
  const loc = await geocoder.geocode(this.address)
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode,
  }
  next()
})
// Create slug from bootcamp name
@pre<BootcampClass>('save', function (next) {
  this.slug = slugify(this.name, { lower: true })
  next()
})
@pre<BootcampClass>('remove', async function (next) {
  await this.model('CourseClass').deleteMany({ bootcamp: this._id })
  next()
})
@index({ location: { coordinates: '2dsphere' } })
export class BootcampClass {
  @prop({
    required: [true, 'Please add a name.'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters.'],
  })
  public name!: string

  @prop()
  public slug?: string

  @prop({
    required: [true, 'Please add a description.'],
    maxlength: [500, 'Description can not be more than 500 characters.'],
  })
  public description!: string

  @prop({
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS',
    ],
  })
  public website?: string

  @prop({
    maxlength: [20, 'Phone number can not be longer than 20 characters.'],
  })
  public phone?: string

  @prop({
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email.',
    ],
  })
  public email?: string

  @prop({ required: [true, 'Please add an address.'] })
  public address!: string

  @prop()
  public location?: {
    type: 'Point'
    coordinates: [number | undefined, number | undefined]
    formattedAddress: string | undefined
    street: string | undefined
    city: string | undefined
    state: string | undefined
    zipcode: string | undefined
    country: string | undefined
  }

  @prop({ type: String, required: true, enum: Careers })
  public careers!: Careers[]

  @prop({
    min: [1, 'Rating must be at least 1.'],
    max: [10, 'Rating can not be more than 10.'],
  })
  public averageRating?: number

  @prop()
  public averageCost?: number

  @prop({ default: 'no-photo.jpg' })
  public photo?: string

  @prop({ default: false })
  public housing?: boolean

  @prop({ default: false })
  public jobAssistance?: boolean

  @prop({ default: false })
  public jobGuarantee?: boolean

  @prop({ default: false })
  public acceptGi?: boolean

  @prop({ default: Date.now })
  public createdAt?: Date

  @prop({
    ref: () => 'CourseClass',
    foreignField: 'bootcamp',
    localField: '_id',
  })
  public courses?: Ref<CourseClass>[]

  @prop({ required: true, ref: () => 'UserClass' })
  public user: Ref<UserClass>
}

export const Bootcamp = getModelForClass(BootcampClass)
