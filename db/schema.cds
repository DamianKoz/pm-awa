
namespace componentX;



entity Readings {
    key ID :UUID;
    DeviceID :UUID;
    SensorID :UUID;
    Timestamp :DateTime;
    Value : Decimal;
    Unit :String;
    Status :String;
    Notes :String;
    CreatedAt :DateTime;
}