const cds = require('@sap/cds')
const cds_Once_Service_Logic = require('./code/cds-once-served-logic')

cds.once('served', async ({ MaintainanceService }) => {
    await cds_Once_Service_Logic(MaintainanceService);
})


// Delegate bootstrapping to built-in server.js
module.exports = cds.server