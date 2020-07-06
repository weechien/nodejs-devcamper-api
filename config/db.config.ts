import mongoose from 'mongoose'

export const connectDb = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI as string, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold)
}
