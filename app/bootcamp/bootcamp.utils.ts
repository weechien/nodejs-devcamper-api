import NodeGeocoder, { Options } from 'node-geocoder'

const options: Options = {
  provider: process.env.GEOCODER_PROVIDER as 'mapquest',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null,
}

export const geocoder = NodeGeocoder(options)
