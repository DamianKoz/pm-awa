
/**
 * 
 * @ON(event = { "createSimulationJob" })
 * @param {Integer} simulationStepInterval - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (simulationStepInterval) {
	const LOGGER = cds.log('cds')
	// 2. Initiate background job for automatic measurements
	cds.simulaitonJob = cds.spawn({ user: cds.User.privileged, every: simulationStepInterval /* ms */ }, async () => {
		const service = await cds.connect.to('MaintainanceService')
		await service.emit('simulationStep', {})
	})
	LOGGER.info(`Background job for simulation step initiated every ${simulationStepInterval}ms`)
}
