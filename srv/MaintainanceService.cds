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
            simulationDateTime : DateTime,
        ) returns many Telemetry;

        action Predict
        (
        ) returns Predictions;
    };
    entity Telemetry as projection on my.Telemetry;
    entity Predictions as projection on my.Predictions;
    entity Maintenances as projection on my.Maintenances;
    entity Locations as projection on my.Locations;
    entity Routes as projection on my.Routes;
    entity Sensors as projection on my.Sensors;
    entity VehicleComponents as projection on my.VehicleComponents;
    entity Failures as projection on my.Failures;
    entity VehicleModels as projection on my.VehicleModels;


    action RegisterVehicle 
    (
        name : String,
        latitude : Decimal(9,6),
        longitude : Decimal(9,6),
    ) returns Vehicles;

    action SetSimulationStepInterval // Action = POST
    (
        interval : Integer
            @mandatory,
    );

    function GetSimulationStepInterval // Function = GET
    (
    ) returns Integer;
}