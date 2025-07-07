const cds = require('@sap/cds')
const cds_Once_Service_Logic = require('./code/cds-once-served-logic')
const cors = require('cors')

cds.once('served', async ({ MaintainanceService }) => {
    await cds_Once_Service_Logic(MaintainanceService);
})

// Enable permissive CORS so the React dashboard (localhost:3000) can POST JSON
cds.on('bootstrap', app => {
  app.use(cors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
  }))
})

// Delegate bootstrapping to built-in server.js
module.exports = cds.server