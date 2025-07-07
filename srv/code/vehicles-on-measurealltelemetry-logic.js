
/**
 * 
 * @ON(event = { "MeasureAllTelemetry" }, entity = { "Vehicles" })
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (req) {

	const { Vehicles, Telemetry, TelemetrySensors } = cds.entities
	const ID = req.params.at(-1).ID

	const vehicle = await SELECT.one(Vehicles, ID)
	if (!vehicle) {
		throw new Error(`Vehicle with ID ${ID} not found.`)
	}

	// we need to mock measurement of x telemetry sensors. What sensors do we mock?
	const sensors = await SELECT.from(TelemetrySensors)
	if (sensors.length === 0) {
		throw new Error('No telemetry sensors found.')
	}

	const telemetry = []

	// for each sensor, we need to mock a measurement
	for (const sensor of sensors) {
		const measurement = {
			vehicle_ID: ID,
			sensor_ID: sensor.ID,
			value: rnd(sensor.min, sensor.max),
		}
		telemetry.push(measurement)
	}

	await INSERT.into(Telemetry).entries(telemetry)
	return telemetry
}


/** Random helpers --------------------------------------------------------- */
const pick   = arr => arr[Math.floor(Math.random() * arr.length)]
const rnd    = (min, max) => min + Math.random() * (max - min)
const rndInt = (min, max) => Math.floor(rnd(min, max))