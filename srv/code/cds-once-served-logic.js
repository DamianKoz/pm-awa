const on_createSimulationJob_Logic = require('./job/on-createSimulationJob-logic')
/**
 * 
 * @ONCE(event = { "served" }, entity = "cds")
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/
module.exports = async function(MaintainanceService) {
    const { Vehicles } = cds.entities
    

    // const ExternalCityHubService = await cds.connect.to('ExternalCityHubService');
    // const cityHubs = await ExternalCityHubService.send()

    // 1. Initialize x vehicles
    const vehicles = await SELECT.from(Vehicles)
    if (vehicles.length === 0) {
        const mockedVehiclesCount = 2
        for (let i = 0; i < mockedVehiclesCount; i++) {
            const vehicle = await MaintainanceService.RegisterVehicle({})
            const route = await MaintainanceService.CreateRoute('Vehicles', vehicle.ID)
            // console.log(`Created route ${route.ID} for vehicle ${vehicle.ID}`)
        }
    }

    await on_createSimulationJob_Logic(1000)
};