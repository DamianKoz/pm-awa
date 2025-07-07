using { componentX as my} from '../db/schema.cds';

@path: '/service/MaintainanceService'
@requires : 'any' // no auth
@Common.WebSocketBaseURL : 'ws/WebSocketService'
@Common.WebSocketChannel #sideEffects : 'VehicleChanged'
service MaintainanceService {

    entity Vehicles as projection on my.Vehicles {
        *,
        model.name as model_name,
    } actions {
        action CreateRoute
        (
            destinationLocation_ID : Locations:ID,
        ) returns Routes;

        action MeasureAllTelemetry
        (
        ) returns many Telemetry;
    };
    entity Telemetry as projection on my.Telemetry;
    entity Warnings as projection on my.Warnings;
    entity Predictions as projection on my.Predictions;
    entity Maintenances as projection on my.Maintenances;
    entity Locations as projection on my.Locations;
    entity Routes as projection on my.Routes;
    entity TelemetrySensors as projection on my.TelemetrySensors;
    entity VehicleComponents as projection on my.VehicleComponents;
    entity TelemetrySensorAffectedComponents as projection on my.TelemetrySensorAffectedComponents;
    entity VehicleModels as projection on my.VehicleModels;


    action RegisterVehicle 
    (
        name : String,
        latitude : Decimal(9,6),
        longitude : Decimal(9,6),
    ) returns Vehicles;

    action SetSimulationStepInterval
    (
        interval : Integer
            @mandatory,
    );
}