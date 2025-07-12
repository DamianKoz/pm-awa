const on_stopSimulationJob_Logic = require('./job/on-stopSimulationJob-logic')
const on_createSimulationJob_Logic = require('./job/on-createSimulationJob-logic')
/**
 * 
 * @ON(event = { "GetSimulationStepInterval" })
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (req) {
	const interval = cds.simulaitonJob?.timer?._repeat
	return interval
}