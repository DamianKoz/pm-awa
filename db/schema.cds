
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
  coordinates : many {
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
  name : String(30);
  unit : String(10);
  min : Decimal(9,3);
  max : Decimal(9,3);
  description : String(255);
}

entity Warnings : cuid, managed {
  vehicle       : Association to Vehicles;
  sensor        : String(30);
  value         : Decimal(9,3);
  triggeredAt   : Timestamp;
  cleared       : Boolean default false;
}

entity Predictions : cuid, managed {
  vehicle       : Association to Vehicles;
  component     : String(40);
  recommendedAt : DateTime;
  latestAt      : DateTime;
  confidence    : Decimal(9,3);
  priority      : String enum { High; Medium; Low; };
  reason        : String(255);
}

entity Maintenances : cuid, managed {
  vehicle       : Association to Vehicles;
  component     : String(40);
  planned       : Boolean;
  status        : String enum { Open; InProgress; Completed; };
  cost          : Decimal(15,2);
  duration      : Decimal(5,2);
  description   : String(300);
  performedOn   : Date;
}

entity Locations : cuid {
  address : String;
  latitude     : Decimal(9,6);
  longitude     : Decimal(9,6);
  population     : Integer;
}