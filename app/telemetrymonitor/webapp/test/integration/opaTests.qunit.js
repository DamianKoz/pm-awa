sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'telemetrymonitor/test/integration/FirstJourney',
		'telemetrymonitor/test/integration/pages/TelemetryList',
		'telemetrymonitor/test/integration/pages/TelemetryObjectPage'
    ],
    function(JourneyRunner, opaJourney, TelemetryList, TelemetryObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('telemetrymonitor') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheTelemetryList: TelemetryList,
					onTheTelemetryObjectPage: TelemetryObjectPage
                }
            },
            opaJourney.run
        );
    }
);