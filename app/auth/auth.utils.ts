import { Response } from 'express'
import { DocumentType } from '@typegoose/typegoose'
import nodemailer from 'nodemailer'

import { Message } from './auth.types'
import { UserClass } from '../user/user.model'

// Get token from model, create cookie and send response
export const sendTokenResponse = (
  user: DocumentType<UserClass>,
  statusCode: number,
  res: Response
) => {
  // Create token
  const token = user.getSignedJwtToken()

  const options = {
    expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPIRE)),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token })
}

export const sendEmail = async (options: Message) => {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST as string,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL as string, // generated ethereal user
      pass: process.env.SMTP_PASSWORD as string, // generated ethereal password
    },
  })

  // send mail with defined transport object
  let message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  }

  const info = await transporter.sendMail(message)

  console.log(`Message sent: ${info.messageId}`)
}
