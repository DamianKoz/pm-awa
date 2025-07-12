
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
  activeRouteIndex : Integer;

  /* Associations */
  metrics      : Composition of many Telemetry   on metrics.vehicle = $self;
  prediction  : Composition of one Predictions on prediction.vehicle = $self;
  maintenances : Composition of many Maintenances on maintenances.vehicle = $self;
  failures : Composition of many Failures on failures.vehicle = $self;
  routes       : Composition of many Routes on routes.vehicle = $self;
  activeRoute  : Association to one Routes;
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
  sensor        : Association to Sensors;
  value         : Decimal(9,3);
}

entity Sensors : cuid {
  name : String;
  unit : String;
  min : Decimal(9,3);
  max : Decimal(9,3);
  reference : Decimal(9,3);
  description : String;
  warnLow : Decimal(9,3);
  warnHigh : Decimal(9,3);
  criticalLow : Decimal(9,3);
  criticalHigh : Decimal(9,3);
  measurements : Composition of many Telemetry on measurements.sensor = $self;
}

entity ComponentDefinitions : cuid {
  name : String;
}

entity VehicleComponents : cuid {
  vehicle : Association to one Vehicles not null;
  definition : Association to ComponentDefinitions not null;
}

entity Predictions : cuid, managed {
  vehicle       : Association to one Vehicles not null;
  affectedComponents     : many {
    component : Association to one VehicleComponents not null;
  };
  recommendedMaintenanceAt : DateTime;
  latestMaintenanceAt      : DateTime;
  recommendedMaintainanceConfidence    : Decimal(9,3);
  latestMaintainanceConfidence      : Decimal(9,3);
  reason        : String;
  description   : String;
  class : Association to PredictionClasses not null;
}

entity PredictionClasses 
{
  key ID : String;
  name : String;
  priority      : String enum { High; Medium; Low; };
}

entity Maintenances : cuid, managed {
  vehicle       : Association to one Vehicles not null;
  affectedComponents     : many {
    component : Association to one VehicleComponents not null;
  };
  planned       : Boolean;
  status        : String enum { Open; InProgress; Completed; };
  cost          : Decimal(15,2);
  duration      : Decimal(5,2);
  description   : String;
  performedOn   : Date;
  causedBy : String enum { Prediction; Failure; Scheduled; };
  prediction : Association to one Predictions; // if caused by prediction, otherwise null
  failure : Association to one Failures; // if caused by failure, otherwise null
}

entity Failures : cuid, managed {
  vehicle       : Association to one Vehicles not null;
  affectedComponents     : many {
    component : Association to one VehicleComponents not null;
  };
  description   : String;
  occurredOn   : Date;
}

entity Locations : cuid {
  address : String;
  latitude     : Decimal(9,6);
  longitude     : Decimal(9,6);
  population     : Integer;
}