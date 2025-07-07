using { componentX } from '../db/schema.cds';

@path : '/ws/WebSocketService'
@protocol : 'ws'
@ws.format: 'pcp'
@requires: 'any'
service WebSocketService
{
    @ws.pcp.action: 'VehicleChanged'
    event VehicleChanged {
        ID : componentX.Vehicles:ID;
        serverAction : String;
        sideEffectSource : String;
        sideEffectEventName : String;
    };
}
