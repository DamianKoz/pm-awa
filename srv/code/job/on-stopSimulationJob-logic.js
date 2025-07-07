
/**
 * 
 * @ON(event = { "stopSimulationJob" })
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (req) {
	const LOGGER = cds.log('cds')
	clearInterval(cds.simulaitonJob.timer)
	LOGGER.info('Background job for simulation step stopped')
}

