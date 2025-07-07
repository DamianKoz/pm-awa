const on_stopSimulationJob_Logic = require('./job/on-stopSimulationJob-logic')
const on_createSimulationJob_Logic = require('./job/on-createSimulationJob-logic')
/**
 * 
 * @ON(event = { "SetSimulationStepInterval" })
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (req) {
	const LOGGER = cds.log('cds')
	if(!req.data?.interval) {
		throw new Error('Interval is required')
	}
	await on_stopSimulationJob_Logic()
	await on_createSimulationJob_Logic(req.data.interval)
	LOGGER.info(`Simulation step interval set to ${req.data.interval}ms`)
	return
}


/** Random helpers --------------------------------------------------------- */
const pick = arr => arr[Math.floor(Math.random() * arr.length)]
const rnd = (min, max) => min + Math.random() * (max - min)
const rndInt = (min, max) => Math.floor(rnd(min, max))