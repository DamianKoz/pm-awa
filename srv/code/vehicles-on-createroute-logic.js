
/**
 * 
 * @ON(event = { "CreateRoute" }, entity = { "Vehicles" })
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (req) {

	const { Vehicles, Locations, Routes } = cds.entities

	const ID = req.params.at(-1).ID
	const vehicle = await SELECT.one(Vehicles, ID)
	const { destinationLocation_ID } = req.data

	if (!destinationLocation_ID) {
		// Pick a random location
		const locations = await SELECT.from(Locations)
		if (locations.length === 0) {
			throw new Error('No locations found.')
		}
		destinationLocation = pick(locations)
	} else {
		// check if the location exists
		const location = await SELECT.one.from(Locations).where({ ID: destinationLocation_ID })
		if (!location) {
			throw new Error('Location not found.')
		}
	}

	// call ExternalRouteService
	// External route service impl.: https://router.project-osrm.org/route/v1/driving/-1.9,52.49436581796879;-6.26,53.35?overview=full&geometries=geojson
	const ExternalRouteService = await cds.connect.to('ExternalRouteService')
	const response = await ExternalRouteService.send('GET', `/route/v1/driving/${vehicle.latitude},${vehicle.longitude};${destinationLocation.latitude},${destinationLocation.longitude}?overview=full&geometries=geojson`)

	if (response.code !== 'Ok') {
		throw new Error('Failed to create route.')
	}

	// parse the response
	const rawRoute = response.routes[0]
	const routeID = cds.utils.uuid()
	const route = {
		ID: routeID,
		vehicle_ID: ID,
		distance: rawRoute.distance,
		duration: rawRoute.duration,
		geometry: {
			route_ID: routeID,
			type: rawRoute.geometry.type,
			coordinates: rawRoute.geometry.coordinates.map(coord => ({
				latitude: coord[1],
				longitude: coord[0],
			})),
		},
	}

	// create a new route
	await INSERT.into(Routes).entries(route)
	await UPDATE(Vehicles, ID).with({ activeRoute_ID: route.ID })

	return route
  }


/** Random helpers --------------------------------------------------------- */
const pick   = arr => arr[Math.floor(Math.random() * arr.length)]
const rnd    = (min, max) => min + Math.random() * (max - min)
const rndInt = (min, max) => Math.floor(rnd(min, max))