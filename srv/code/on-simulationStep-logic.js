/**
 * 
 * @ON(event = { "simulationStep" })
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (req) {
	const simulationDateTime = req.data.simulationDateTime || new Date();
	const LOGGER = cds.log('simulation-step')
	try {
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
			if (vehicle.activeRoute) {
				if (vehicle.activeRouteIndex >= vehicle.activeRoute.geometry.coordinatesCount - 1) {
					// vehicle has reached the destination
					await UPDATE(Vehicles, vehicle.ID).with({ activeRouteIndex: null, activeRoute: null, isMoving: false })
					continue
				}
				const currentCoordinate = vehicle.activeRoute.geometry.coordinates[vehicle.activeRouteIndex]
				const nextCoordinate = vehicle.activeRoute.geometry.coordinates[vehicle.activeRouteIndex + 1]
				const distance = calculateDistance(currentCoordinate.latitude, currentCoordinate.longitude, nextCoordinate.latitude, nextCoordinate.longitude)
				await UPDATE(Vehicles, vehicle.ID).with({ activeRouteIndex: vehicle.activeRouteIndex + 1, latitude: nextCoordinate.latitude, longitude: nextCoordinate.longitude, isMoving: true })
			}
			await MaintainanceService.MeasureAllTelemetry('Vehicles', vehicle.ID, { simulationDateTime : simulationDateTime })
			await MaintainanceService.Predict('Vehicles', vehicle.ID )
			// webSocketLOG.info(`Emitting ${eventName} event for Vehicle: ${vehicle.ID}`)
			WebSocketService.emit(eventName, {
				ID: vehicle.ID,
				serverAction: 'RaiseSideEffect',
				sideEffectEventName: eventName,
				sideEffectSource: `/Vehicles(${vehicle.ID})`
			});

		}

		LOGGER.info(`Simulation step completed for ${vehicles.length} vehicles`)
	} catch (error) {
		LOGGER.error(`Simulation step failed: ${error}`)
	}
}

const calculateDistance = (lat1, lon1, lat2, lon2) => {
	const R = 6371; // Radius of the earth in km
	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}


/** Random helpers --------------------------------------------------------- */
const pick = arr => arr[Math.floor(Math.random() * arr.length)]
const rnd = (min, max) => min + Math.random() * (max - min)
const rndInt = (min, max) => Math.floor(rnd(min, max))