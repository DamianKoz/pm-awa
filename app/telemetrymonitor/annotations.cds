using MaintainanceService as service from '../../srv/MaintainanceService';
annotate service.Telemetry with @(
    Aggregation.ApplySupported: {
        $Type                 : 'Aggregation.ApplySupportedType',
        Transformations : [
            'aggregate',
            'groupby',
            'orderby',
            'filter',
        ],
        GroupableProperties : [
            ID,
            value,
            createdAt,
        ],
        AggregatableProperties : [
            {
                $Type : 'Aggregation.AggregatablePropertyType',
                Property : value
            },
            {
                $Type : 'Aggregation.AggregatablePropertyType',
                Property : ID
            },
        ],
    },
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'value',
                Value : value,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : vehicle_ID,
            Label : 'Vehicle',
        },
        {
            $Type : 'UI.DataField',
            Value : vehicle.model_ID,
            Label : 'Vehicle Model',
        },
        {
            $Type : 'UI.DataField',
            Value : sensor_ID,
            Label : 'Sensor',
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>Value}',
            Value : value,
        },
        {
            $Type : 'UI.DataField',
            Value : createdAt,
        },
    ],
    Analytics.AggregatedProperty #value_average : {
        $Type : 'Analytics.AggregatedPropertyType',
        Name : 'value_average',
        AggregatableProperty : value,
        AggregationMethod : 'average',
        ![@Common.Label] : 'Value (Average)',
    },
    UI.Chart #alpChart : {
        $Type : 'UI.ChartDefinitionType',
        ChartType : #Line,
        Dimensions : [
            createdAt,
        ],
        DynamicMeasures : [
            '@Analytics.AggregatedProperty#value_average',
        ],
        Title : 'Telemetry Insights',
    },
    UI.HeaderInfo : {
        TypeName : 'Telemetry',
        TypeNamePlural : 'Telemetry',
    },
);

annotate service.Telemetry with {
    vehicle @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Vehicles',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : vehicle_ID,
                    ValueListProperty : 'ID',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'name',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'year',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'mileage',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'lastServiceDate',
                },
            ],
        },
        Common.Text : {
            $value : vehicle.name,
            ![@UI.TextArrangement] : #TextOnly
        },
    )
};

annotate service.Telemetry with {
    sensor @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'TelemetrySensors',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : sensor_ID,
                    ValueListProperty : 'ID',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'name',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'unit',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'min',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'max',
                },
            ],
        },
        Common.Text : {
            $value : sensor.name,
            ![@UI.TextArrangement] : #TextOnly
        },
    )
};

annotate service.Vehicles with {
    model @Common.Text : {
        $value : model.name,
        ![@UI.TextArrangement] : #TextOnly
    }
};

annotate service.Vehicles with @(
    Common.SideEffects #VehicleChanged : {
        SourceEvents : [
            'VehicleChanged'
        ],
        TargetProperties : [
            '/MaintainanceService.EntityContainer/Telemetry'
        ]
    },
);
