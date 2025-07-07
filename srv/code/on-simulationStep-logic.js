
/**
 * 
 * @ON(event = { "simulationStep" })
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (req) {
	const LOGGER = cds.log('simulation-step')
	const { Vehicles } = cds.entities
	const { expr, ref, val, columns, expand, where, orderBy } = cds.ql; 
	const vehicles = await SELECT.from(Vehicles).columns('*', 
		expand('activeRoute', columns('*', 
			expand('geometry', columns('*'))
		)))
	const MaintainanceService = await cds.connect.to('MaintainanceService')
	const eventName = 'VehicleChanged'
    const webSocketLOG = cds.log('webSocket')
    const WebSocketService = await cds.connect.to('WebSocketService');
    
	for (const vehicle of vehicles) {
		// move vehicle to the next coordinate on the route if it has an active route
		if(vehicle.activeRoute) {
			const nextCoordinate = vehicle.activeRoute.geometry.coordinates[vehicle.activeRouteIndex + 1]
			await UPDATE(Vehicles, vehicle.ID).with({ activeRouteIndex: vehicle.activeRouteIndex + 1, latitude: nextCoordinate.latitude, longitude: nextCoordinate.longitude })
		}
		await MaintainanceService.MeasureAllTelemetry('Vehicles', vehicle.ID)
		webSocketLOG.info(`Emitting ${eventName} event for Vehicle: ${vehicle.ID}`)
		WebSocketService.emit(eventName, { 
			ID: vehicle.ID,
			serverAction: 'RaiseSideEffect',
			sideEffectEventName : eventName,
			sideEffectSource : `/Vehicles(${vehicle.ID})`
		});
	
	}

	LOGGER.info(`Simulation step completed for ${vehicles.length} vehicles`)
}


/** Random helpers --------------------------------------------------------- */
const pick = arr => arr[Math.floor(Math.random() * arr.length)]
const rnd = (min, max) => min + Math.random() * (max - min)
const rndInt = (min, max) => Math.floor(rnd(min, max))