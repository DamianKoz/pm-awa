
/**
 * 
 * @ON(event = { "RegisterVehicle" })
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function (req) {

	const { Vehicles, Locations, VehicleModels } = cds.entities

	const { latitude, longitude } = req.data
	
  
	/** helper: builds ONE synthetic vehicle object */
	const buildVehicle = async (name) => {
	
	  /* pick start + (optionally) destination hub ------------------------- */
	  const locations = await SELECT.from(Locations)
	  if (locations.length === 0 || locations.length === 1) {
		throw new Error('Not enough locations found.')
	  }
	  const origin = latitude && longitude ? { latitude, longitude } : pick(locations)
  
	  /* add small offset (+/- 0.02° ≈ 2 km) so markers are not on top */
	  const offsetLat = rnd(-0.02, 0.02)
	  const offsetLon = rnd(-0.02, 0.02)
  
	  /* build row matching the CDS definition ---------------------------- */
	  const now  = Date.now()
	  const lastService  = new Date(now - rndInt(30, 180) * 24 * 3600 * 1000) // 1-6 months ago
	  const nextService  = new Date(+lastService + 180 * 24 * 3600 * 1000)    // +6 months

	  const models = await SELECT.from(VehicleModels)
	  if (models.length === 0) {
		throw new Error('No vehicle models found.')
	  }
  
	  const data = {
		ID                   : cds.utils.uuid(),
		name                 : name,
		model                : pick(models),
		year                 : rndInt(2015, 2023),
		mileage              : rndInt(50_000, 200_000),
		lastServiceDate      : lastService,
		nextServiceDate      : nextService,
  
		/* current position */
		latitude             : +(origin.latitude + offsetLat).toFixed(6),
		longitude            : +(origin.longitude + offsetLon).toFixed(6),
  
		isMoving             : Math.random() < 0.6,       // 60 % on the road
  
		/* simple synthetic “route” data you can replace later */
		originLatitude       : origin.latitude,
		originLongitude      : origin.longitude,
		destinationLatitude  : null,
		destinationLongitude : null,
	  }
	  return data;
	}
  
	/* create N vehicles in parallel, then insert as batch --------------- */
	const newVehicle = await buildVehicle(req.data?.name ?? 'Unnamed Vehicle')
  
	await INSERT.into(Vehicles).entries(newVehicle)
  
	return newVehicle
  }


/** Random helpers --------------------------------------------------------- */
const pick   = arr => arr[Math.floor(Math.random() * arr.length)]
const rnd    = (min, max) => min + Math.random() * (max - min)
const rndInt = (min, max) => Math.floor(rnd(min, max))