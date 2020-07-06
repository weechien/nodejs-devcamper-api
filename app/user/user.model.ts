import { prop, getModelForClass, pre, mongoose } from '@typegoose/typegoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

import { Role } from './user.types'

@pre<UserClass>('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})
export class UserClass {
  _id!: mongoose.Schema.Types.ObjectId

  @prop({ required: [true, 'Please add a name.'] })
  public name!: string

  @prop({
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email.',
    ],
    required: [true, 'Please add an email.'],
    unique: true,
  })
  public email!: string

  @prop({ default: Role.USER, enum: Role })
  public role!: Role

  @prop({
    required: [true, 'Please add a password.'],
    minlength: 6,
    select: false,
  })
  public password!: string

  @prop()
  public resetPasswordToken?: string

  @prop()
  public resetPasswordExpire?: Date

  @prop({ default: Date.now() })
  public createdAt?: Date

  // Sign JWT and return
  public getSignedJwtToken() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRE,
    })
  }

  // Match user entered password to hashed password in database
  public async matchPassword(enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password)
  }

  // Generate and hash password token
  public getResetPasswordToken() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex')

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    // Set expire
    this.resetPasswordExpire = new Date(
      Date.now() + Number(process.env.RESET_PASSWORD_EXPIRY)
    )
    return resetToken
  }
}

export const User = getModelForClass(UserClass)
