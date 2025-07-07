/**
 * Mock rule-based prediction
 *
 * @ON CreatePrediction on entity Vehicles
 */
module.exports = async function (req) {
	const {
		Vehicles,
		Telemetry,
		TelemetrySensors,
		TelemetrySensorAffectedComponents,
		VehicleComponents,
		Predictions,
	} = cds.entities

	const ID = req.params.at(-1).ID
	const sampleSize = 5
	const tx = cds.transaction(req)

	/* 1. vehicle must exist ------------------------------------------------ */
	const vehicle = await SELECT.one.from(Vehicles).where({ ID })
	if (!vehicle) req.error(404, `Vehicle ${ID} not found`)

	/* 2. sensor catalogue (+ component map) -------------------------------- */
	const sensors = await SELECT.from(TelemetrySensors)
	const compMap = await SELECT.from(TelemetrySensorAffectedComponents)
		.columns(`sensor_ID`, `component_ID`)
	const compOf = Object.fromEntries(compMap.map(m => [m.sensor_ID, m.component_ID]))

	/* 3. helper lambdas ---------------------------------------------------- */
	const isWarn = (v, s) =>
		(s.warnLow != null && v <= s.warnLow) ||
		(s.warnHigh != null && v >= s.warnHigh)

	const isCrit = (v, s) =>
		(s.critLow != null && v <= s.critLow) ||
		(s.critHigh != null && v >= s.critHigh)

	const now = new Date()

	/* 4. compute predictions ---------------------------------------------- */
	const rows = []

	for (const s of sensors) {

		const readings = await SELECT
			.from(Telemetry)
			.where({ vehicle_ID: ID, sensor_ID: s.ID })
			.orderBy('createdAt desc')
			.limit(sampleSize)

		if (!readings.length) continue

		const avg = readings.reduce((a, r) => a + r.value, 0) / readings.length

		/* classify ---------------------------------------------------------- */
		let priority, recDays, conf, reason
		if (isCrit(avg, s)) {
			priority = 'High'
			recDays = 1                                   // asap
			conf = 0.95
			reason = `${s.name} critical (${avg}${s.unit})`
		} else if (isWarn(avg, s)) {
			priority = 'Medium'
			recDays = 7                                   // within a week
			conf = 0.80
			reason = `${s.name} warning (${avg}${s.unit})`
		} else {
			// still create a row → priority Low
			priority = 'Low'
			recDays = 30
			conf = 0.60
			reason = `${s.name} healthy (${avg}${s.unit})`
		}

		/* component association -------------------------------------------- */
		const compID = compOf[s.ID]

		rows.push({
			vehicle_ID: ID,
			component_ID: compID,
			recommendedMaintenanceAt: new Date(now.getTime() + recDays * 86400000),
			latestMaintenanceAt: now,                // last check was “now”
			recommendedMaintainanceConfidence: conf,
			latestMaintainanceConfidence: 1.0,              // because we just measured
			priority,
			reason,
			description: `Average of last ${sampleSize} samples: ${avg}${s.unit}`,
		})
	}

	const relevantPredictions = rows.filter(p => p.priority !== 'Low')	
	/* insert only non-empty ----------------------------------------------- */
	if (relevantPredictions.length) await tx.run(INSERT.into(Predictions).entries(relevantPredictions))

	return rows
}