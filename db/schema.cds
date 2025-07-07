
namespace componentX;
 
using
{
    cuid,
    managed
}
from '@sap/cds/common';

entity Vehicles : cuid, managed {
  name                  : String;
  model                 : Association to one VehicleModels;
  year                  : Integer;
  mileage               : Integer;
  lastServiceDate       : Date;
  nextServiceDate       : Date;
  latitude              : Decimal(9,6);
  longitude             : Decimal(9,6);
  isMoving              : Boolean default false;
  destinationLatitude   : Decimal(9,6);
  destinationLongitude  : Decimal(9,6);
  originLatitude        : Decimal(9,6);
  originLongitude       : Decimal(9,6);

  /* Associations */
  metrics      : Composition of many Telemetry   on metrics.vehicle = $self;
  predictions  : Composition of many Predictions on predictions.vehicle = $self;
  maintHistory : Composition of many Maintenances on maintHistory.vehicle = $self;
  routes       : Composition of many Routes on routes.vehicle = $self;
  activeRoute  : Association to one Routes;
  activeRouteIndex : Integer;
}

entity VehicleModels : cuid {
  name : String(60);
}

entity Routes : cuid {
  vehicle       : Association to one Vehicles;
  distance            : Decimal(12,3);
  duration            : Decimal(12,3);
  geometry : Composition of one RouteGeometry;
  weight : Decimal(12,3);
  weight_name : String(10);
}

entity RouteGeometry {
  key route : Association to one Routes;
  type : String(10);
  coordinatesCount : Integer;
  coordinates : many {
    index : Integer;
    latitude : Decimal(9,6);
    longitude : Decimal(9,6);
  };
}

entity Telemetry : cuid, managed {
  vehicle       : Association to Vehicles;
  sensor        : Association to TelemetrySensors;
  value         : Decimal(9,3);
}

entity TelemetrySensors : cuid {
  name : String;
  unit : String;
  min : Decimal(9,3);
  max : Decimal(9,3);
  reference : Decimal(9,3);
  description : String;
  affectedComponents : Composition of many TelemetrySensorAffectedComponents on affectedComponents.sensor = $self;
}

entity TelemetrySensorAffectedComponents : cuid {
  sensor : Association to TelemetrySensors;
  component : Association to VehicleComponents;
}

entity VehicleComponents : cuid {
  affectedSensors : Composition of many TelemetrySensorAffectedComponents on affectedSensors.component = $self;
  name : String;
  description : String;
}

entity Warnings : cuid, managed {
  vehicle       : Association to Vehicles;
  sensor        : Association to TelemetrySensors;
  value         : Decimal(9,3);
  triggeredAt   : Timestamp;
  cleared       : Boolean default false;
}

entity Predictions : cuid, managed {
  vehicle       : Association to Vehicles;
  component     : Association to VehicleComponents;
  recommendedAt : DateTime;
  latestAt      : DateTime;
  confidence    : Decimal(9,3);
  priority      : String enum { High; Medium; Low; };
  reason        : String;
}

entity Maintenances : cuid, managed {
  vehicle       : Association to Vehicles;
  component     : Association to VehicleComponents;
  planned       : Boolean;
  status        : String enum { Open; InProgress; Completed; };
  cost          : Decimal(15,2);
  duration      : Decimal(5,2);
  description   : String;
  performedOn   : Date;
}

entity Locations : cuid {
  address : String;
  latitude     : Decimal(9,6);
  longitude     : Decimal(9,6);
  population     : Integer;
}