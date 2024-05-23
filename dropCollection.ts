require('dotenv').config() // This loads the environment variables from .env
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI // Use the MONGODB_URI from your .env

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const allCollections = await mongoose.connection.db
      .listCollections()
      .toArray()
    for (let i = 0; i < allCollections.length; i++) {
      await mongoose.connection.dropCollection(allCollections[i].name)
    }
    console.log('Collection dropped successfully.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error dropping collection:', err)
    process.exit(1)
  })
