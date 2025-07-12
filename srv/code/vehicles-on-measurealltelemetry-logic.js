/**
 * 
 * @ON(event = { "MeasureAllTelemetry" }, entity = { "Vehicles" })
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (req) {

	const { Vehicles, Telemetry, Sensors } = cds.entities
	const ID = req.params.at(-1).ID

	const vehicle = await SELECT.one(Vehicles, ID)
	if (!vehicle) {
		throw new Error(`Vehicle with ID ${ID} not found.`)
	}

	// we need to mock measurement of x telemetry sensors. What sensors do we mock?
	const sensors = await SELECT.from(Sensors)
	if (sensors.length === 0) {
		throw new Error('No telemetry sensors found.')
	}

	const telemetry = []

	// for each sensor, we need to mock a measurement
	for (const sensor of sensors) {
		const measurement = {
			vehicle_ID: ID,
			sensor_ID: sensor.ID,
			value: clamp(rndNormal(
				sensor.reference ?? (sensor.min + sensor.max) / 2,
				(() => {
					const mean = sensor.reference ?? (sensor.min + sensor.max) / 2
					const deviation = Math.min(mean - sensor.min, sensor.max - mean) / 3
					return deviation > 0 && Number.isFinite(deviation)
						? deviation
						: (sensor.max - sensor.min) / 6
				})()
			), sensor.min, sensor.max),
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

/**
 * Generate a normally distributed random number using the Box–Muller transform.
 * @param {number} mean - The mean (μ) of the distribution
 * @param {number} stdDev - The standard deviation (σ)
 * @returns {number}
 */
const rndNormal = (mean, stdDev) => {
	let u = 0, v = 0
	// Convert [0,1) to (0,1) to avoid log(0)
	while (u === 0) u = Math.random()
	while (v === 0) v = Math.random()
	const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
	return z * stdDev + mean
}

const clamp  = (value, min, max) => Math.min(Math.max(value, min), max)