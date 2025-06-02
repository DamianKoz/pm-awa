import React, {useState, useEffect, useCallback} from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
} from "lucide-react";

const App = () => {
  const [sensors, setSensors] = useState({
    temperature: {value: 75, isRunning: false, history: [], warning: false},
    oilLevel: {value: 85, isRunning: false, history: [], warning: false},
    vibration: {value: 2.1, isRunning: false, history: [], warning: false},
    pressure: {value: 120, isRunning: false, history: [], warning: false},
  });

  const [predictions, setPredictions] = useState([]);
  const [maintenanceHistory] = useState([
    {
      date: "2024-05-20",
      component: "Pumpe A",
      type: "Planmäßig",
      status: "Abgeschlossen",
    },
    {
      date: "2024-05-15",
      component: "Motor B",
      type: "Reparatur",
      status: "Abgeschlossen",
    },
    {
      date: "2024-05-10",
      component: "Filter C",
      type: "Austausch",
      status: "Abgeschlossen",
    },
  ]);

  // Sensor simulation logic
  const updateSensor = useCallback((sensorName) => {
    setSensors((prev) => {
      const sensor = prev[sensorName];
      if (!sensor.isRunning) return prev;

      let newValue = sensor.value;
      const timestamp = Date.now();

      switch (sensorName) {
        case "temperature":
          // Temperature occasionally spikes up
          newValue =
            Math.random() > 0.8
              ? Math.min(100, sensor.value + Math.random() * 5)
              : Math.max(70, sensor.value + (Math.random() - 0.5) * 2);
          break;
        case "oilLevel":
          // Oil level gradually decreases
          newValue = Math.max(0, sensor.value - Math.random() * 0.5);
          break;
        case "vibration":
          // Vibration increases with oil level decrease and temperature increase
          const tempFactor = (prev.temperature.value - 70) / 30;
          const oilFactor = (90 - prev.oilLevel.value) / 90;
          newValue = 2.0 + tempFactor * 3 + oilFactor * 2 + Math.random() * 0.5;
          break;
        case "pressure":
          // Pressure varies with oil level
          const oilRatio = prev.oilLevel.value / 100;
          newValue = 80 + oilRatio * 60 + (Math.random() - 0.5) * 10;
          break;
        default:
          break;
      }

      const newHistory = [
        ...sensor.history,
        {time: timestamp, value: newValue},
      ].slice(-20); // Keep only last 20 points

      const warning =
        (sensorName === "temperature" && newValue > 90) ||
        (sensorName === "oilLevel" && newValue < 20) ||
        (sensorName === "vibration" && newValue > 5) ||
        (sensorName === "pressure" && newValue < 90);

      return {
        ...prev,
        [sensorName]: {
          ...sensor,
          value: newValue,
          history: newHistory,
          warning,
        },
      };
    });
  }, []);

  // Calculate predictions based on sensor values
  const calculatePredictions = useCallback(() => {
    const temp = sensors.temperature.value;
    const oil = sensors.oilLevel.value;
    const vibration = sensors.vibration.value;
    const pressure = sensors.pressure.value;

    const predictions = [];

    // Oil change prediction
    if (oil < 50) {
      const daysUntilCritical = Math.max(1, Math.floor(oil / 2));
      predictions.push({
        component: "Ölwechsel",
        daysUntil: daysUntilCritical,
        confidence: 95,
        priority: oil < 20 ? "Hoch" : "Mittel",
        reason: `Ölstand bei ${oil.toFixed(1)}%`,
      });
    }

    // Temperature-based maintenance
    if (temp > 85) {
      const daysUntil = Math.max(1, Math.floor((100 - temp) * 2));
      predictions.push({
        component: "Kühlsystem",
        daysUntil,
        confidence: 87,
        priority: temp > 95 ? "Hoch" : "Mittel",
        reason: `Temperatur bei ${temp.toFixed(1)}°C`,
      });
    }

    // Vibration-based maintenance
    if (vibration > 4) {
      const daysUntil = Math.max(1, Math.floor((8 - vibration) * 3));
      predictions.push({
        component: "Lager/Ausrichtung",
        daysUntil,
        confidence: 82,
        priority: vibration > 6 ? "Hoch" : "Mittel",
        reason: `Vibration bei ${vibration.toFixed(1)} mm/s`,
      });
    }

    // Pressure-based maintenance
    if (pressure < 100) {
      const daysUntil = Math.max(1, Math.floor(pressure / 5));
      predictions.push({
        component: "Drucksystem",
        daysUntil,
        confidence: 78,
        priority: pressure < 80 ? "Hoch" : "Niedrig",
        reason: `Druck bei ${pressure.toFixed(1)} bar`,
      });
    }

    // Sort by days until maintenance needed
    predictions.sort((a, b) => a.daysUntil - b.daysUntil);
    setPredictions(predictions.slice(0, 5)); // Show top 5 predictions
  }, [sensors]);

  // Update sensors every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(sensors).forEach((sensorName) => {
        updateSensor(sensorName);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [sensors, updateSensor]);

  // Recalculate predictions when sensors change
  useEffect(() => {
    calculatePredictions();
  }, [sensors, calculatePredictions]);

  const toggleSensor = (sensorName) => {
    setSensors((prev) => ({
      ...prev,
      [sensorName]: {
        ...prev[sensorName],
        isRunning: !prev[sensorName].isRunning,
      },
    }));
  };

  const refillOil = () => {
    setSensors((prev) => ({
      ...prev,
      oilLevel: {...prev.oilLevel, value: 100},
    }));
  };

  const resetSensors = () => {
    setSensors({
      temperature: {value: 75, isRunning: false, history: [], warning: false},
      oilLevel: {value: 85, isRunning: false, history: [], warning: false},
      vibration: {value: 2.1, isRunning: false, history: [], warning: false},
      pressure: {value: 120, isRunning: false, history: [], warning: false},
    });
  };

  const sensorConfigs = {
    temperature: {name: "Temperatur", unit: "°C", color: "#ef4444", icon: "🌡️"},
    oilLevel: {name: "Ölstand", unit: "%", color: "#f59e0b", icon: "🛢️"},
    vibration: {name: "Vibration", unit: "mm/s", color: "#8b5cf6", icon: "📳"},
    pressure: {name: "Druck", unit: "bar", color: "#06b6d4", icon: "⚡"},
  };

  const formatChartData = (sensorName) => {
    return sensors[sensorName].history.map((point, index) => ({
      time: index,
      value: point.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Predictive Maintenance Dashboard
          </h1>
          <p className="text-gray-600">
            Echtzeitüberwachung und Ausfallvorhersage für Industrieanlagen
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Steuerung</h2>
            <div className="flex gap-2">
              <button
                onClick={refillOil}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Öl nachfüllen
              </button>
              <button
                onClick={resetSensors}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <RefreshCw size={16} className="inline mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Sensors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(sensors).map(([sensorName, sensor]) => {
            const config = sensorConfigs[sensorName];
            return (
              <div
                key={sensorName}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{config.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {config.name}
                    </h3>
                  </div>
                  {sensor.warning && (
                    <AlertTriangle className="text-red-500" size={20} />
                  )}
                </div>

                <div className="mb-4">
                  <div
                    className="text-3xl font-bold mb-1"
                    style={{color: config.color}}
                  >
                    {sensor.value.toFixed(1)}
                    <span className="text-lg text-gray-500 ml-1">
                      {config.unit}
                    </span>
                  </div>
                  <div
                    className={`text-sm ${
                      sensor.warning ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {sensor.warning ? "Warnung" : "Normal"}
                  </div>
                </div>

                <button
                  onClick={() => toggleSensor(sensorName)}
                  className={`w-full py-2 px-4 rounded-md transition-colors ${
                    sensor.isRunning
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {sensor.isRunning ? (
                    <>
                      <Pause size={16} className="inline mr-2" />
                      Stoppen
                    </>
                  ) : (
                    <>
                      <Play size={16} className="inline mr-2" />
                      Starten
                    </>
                  )}
                </button>

                {sensor.history.length > 0 && (
                  <div className="mt-4 h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData(sensorName)}>
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={config.color}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Predictions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              <Activity className="inline mr-2" />
              Ausfallvorhersagen
            </h2>
            {predictions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle
                  size={48}
                  className="mx-auto mb-4 text-green-500"
                />
                <p>Alle Systeme funktionieren optimal</p>
              </div>
            ) : (
              <div className="space-y-4">
                {predictions.map((prediction, index) => (
                  <div
                    key={index}
                    className={`border-l-4 pl-4 py-3 ${
                      prediction.priority === "Hoch"
                        ? "border-red-500 bg-red-50"
                        : prediction.priority === "Mittel"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-blue-500 bg-blue-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {prediction.component}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {prediction.reason}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Konfidenz: {prediction.confidence}%
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-800">
                          {prediction.daysUntil} Tag
                          {prediction.daysUntil !== 1 ? "e" : ""}
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded ${
                            prediction.priority === "Hoch"
                              ? "bg-red-100 text-red-700"
                              : prediction.priority === "Mittel"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {prediction.priority}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Wartungshistorie
            </h2>
            <div className="space-y-3">
              {maintenanceHistory.map((entry, index) => (
                <div key={index} className="border-b border-gray-200 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {entry.component}
                      </h3>
                      <p className="text-sm text-gray-600">{entry.type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{entry.date}</div>
                      <div className="text-xs text-green-600">
                        {entry.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Overview Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Systemübersicht
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Temperatur",
                    value: sensors.temperature.value,
                    fill: "#ef4444",
                  },
                  {
                    name: "Ölstand",
                    value: sensors.oilLevel.value,
                    fill: "#f59e0b",
                  },
                  {
                    name: "Vibration",
                    value: sensors.vibration.value * 10,
                    fill: "#8b5cf6",
                  },
                  {
                    name: "Druck",
                    value: sensors.pressure.value,
                    fill: "#06b6d4",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
