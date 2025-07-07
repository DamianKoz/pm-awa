import React, {useState, useEffect, useCallback, useRef} from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import {
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
  Moon,
  Sun,
  ChevronRight,
  X,
  Zap,
  Truck,
  Bell,
  FlaskConical,
  ChevronLeft,
  Car,
  Bus,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

// NOTE: This file is plain JavaScript. Any previous TypeScript-style type
// declarations have been removed for compatibility. Feel free to migrate to
// TypeScript (`.tsx`) in the future.

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // Simulation speed multiplier (1x default)
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [fleetPredictions, setFleetPredictions] = useState([]);
  const [maintenanceHistory] = useState([
    {
      date: "2024-05-20",
      component: "Kühlsystem",
      type: "Planmäßig",
      status: "Abgeschlossen",
      vehicle: "Fahrzeug 8",
      technician: "Michael Weber",
      cost: 450,
      description: "Kühlflüssigkeit gewechselt, Thermostat überprüft",
      planned: true,
      duration: "2.5h"
    },
    {
      date: "2024-05-18",
      component: "Ölwechsel",
      type: "Ungeplant",
      status: "Abgeschlossen",
      vehicle: "Fahrzeug 15",
      technician: "Sarah Müller",
      cost: 280,
      description: "Ölstand kritisch, sofortiger Wechsel erforderlich",
      planned: false,
      duration: "1.5h"
    },
    {
      date: "2024-05-15",
      component: "Reifendruck",
      type: "Planmäßig",
      status: "Abgeschlossen",
      vehicle: "Fahrzeug 3",
      technician: "Thomas Schmidt",
      cost: 120,
      description: "Alle Reifen auf Soll-Druck gebracht, Ventile überprüft",
      planned: true,
      duration: "1h"
    },
    {
      date: "2024-05-12",
      component: "Batteriewechsel",
      type: "Ungeplant",
      status: "Abgeschlossen",
      vehicle: "Fahrzeug 22",
      technician: "Andreas Fischer",
      cost: 380,
      description: "Batterie defekt, neue AGM-Batterie eingebaut",
      planned: false,
      duration: "2h"
    },
    {
      date: "2024-05-10",
      component: "Bremsen",
      type: "Planmäßig",
      status: "Abgeschlossen",
      vehicle: "Fahrzeug 7",
      technician: "Lisa Wagner",
      cost: 520,
      description: "Bremsbeläge gewechselt, Bremsscheiben überprüft",
      planned: true,
      duration: "3h"
    },
    {
      date: "2024-05-08",
      component: "Luftfilter",
      type: "Planmäßig",
      status: "Abgeschlossen",
      vehicle: "Fahrzeug 12",
      technician: "Michael Weber",
      cost: 85,
      description: "Motorluftfilter und Kabinenfilter gewechselt",
      planned: true,
      duration: "0.8h"
    },
    {
      date: "2024-05-05",
      component: "Getriebeöl",
      type: "Ungeplant",
      status: "Abgeschlossen",
      vehicle: "Fahrzeug 19",
      technician: "Sarah Müller",
      cost: 320,
      description: "Getriebeöl undicht, Dichtung erneuert",
      planned: false,
      duration: "2.2h"
    },
    {
      date: "2024-05-02",
      component: "Scheinwerfer",
      type: "Planmäßig",
      status: "Abgeschlossen",
      vehicle: "Fahrzeug 4",
      technician: "Thomas Schmidt",
      cost: 95,
      description: "Scheinwerfer ausgerichtet, Glühbirnen gewechselt",
      planned: true,
      duration: "1.2h"
    }
  ]);

  // Timeline of issues/warnings
  const [timeline, setTimeline] = useState([]); // {time, title, description, type}

  // Toast-like notifications
  const [notifications, setNotifications] = useState([]); // {id, message, type, unread}
  const [showInbox, setShowInbox] = useState(false);

  // Track previous sensor warnings to detect new ones
  const prevVehiclesRef = useRef(vehicles);

  // track which vehicle routes are currently being fetched to avoid duplicate requests
  const routeFetchInProgress = useRef(new Set());

  // Sensor simulation logic
  const updateVehicleMetric = useCallback((vehicleId, metricKey) => {
    setVehicles((prev) => {
      const vehicle = prev.find(v => v.id === vehicleId);
      if (!vehicle) return prev;

      let newValue = vehicle.metrics[metricKey];
      const timestamp = Date.now();

      switch (metricKey) {
        case "engineTemp":
          newValue =
            Math.random() > 0.95
              ? Math.min(100, vehicle.metrics[metricKey] + (Math.random() - 0.5) * 2)
              : Math.max(70, vehicle.metrics[metricKey] + (Math.random() - 0.5) * 0.5);
          break;
        case "oilLevel":
          newValue = Math.max(0, vehicle.metrics[metricKey] - Math.random() * 0.25);
          break;
        case "tyrePressure":
          const oilRatio = vehicle.metrics.oilLevel / 100;
          newValue = 90 + oilRatio * 25 + (Math.random() - 0.5) * 5;
          break;
        case "batteryHealth":
          newValue = Math.max(0, vehicle.metrics[metricKey] - Math.random() * 0.1);
          break;
        default:
          break;
      }

      const newHistory = [
        ...vehicle.history[metricKey],
        {time: timestamp, value: newValue},
      ].slice(-20); // Keep only last 20 points

      const warning =
        (metricKey === "engineTemp" && newValue > 90) ||
        (metricKey === "oilLevel" && newValue < 20) ||
        (metricKey === "tyrePressure" && newValue < 90) ||
        (metricKey === "batteryHealth" && newValue < 20);

      return prev.map(v =>
        v.id === vehicleId
          ? {
              ...v,
              metrics: {
                ...v.metrics,
                [metricKey]: newValue,
              },
              history: {
                ...v.history,
                [metricKey]: newHistory,
              },
              warnings: {
                ...v.warnings,
                [metricKey]: warning,
              },
            }
          : v
      );
    });
  }, []);

  // Calculate predictions based on sensor values
  const calculateFleetPredictions = useCallback(() => {
    const predictions = [];

    vehicles.forEach(vehicle => {
      const {id, name, metrics} = vehicle;

      // Oil change prediction
      if (metrics.oilLevel < 50) {
        const daysUntilCritical = Math.max(1, Math.floor(metrics.oilLevel / 2));
        const recommendedMaintenanceDays = Math.max(1, daysUntilCritical - 7); // 1 week before critical
        predictions.push({
          component: "Ölwechsel",
          daysUntil: daysUntilCritical,
          recommendedMaintenanceDays,
          confidence: 95,
          priority: metrics.oilLevel < 20 ? "Hoch" : "Mittel",
          reason: `Ölstand bei ${metrics.oilLevel.toFixed(1)}%`,
          vehicleId: id,
        });
      }

      // Temperature-based maintenance
      if (metrics.engineTemp > 85) {
        const daysUntil = Math.max(1, Math.floor((100 - metrics.engineTemp) * 2));
        const recommendedMaintenanceDays = Math.max(1, daysUntil - 5); // 5 days before critical
        predictions.push({
          component: "Kühlsystem",
          daysUntil,
          recommendedMaintenanceDays,
          confidence: 87,
          priority: metrics.engineTemp > 95 ? "Hoch" : "Mittel",
          reason: `Temperatur bei ${metrics.engineTemp.toFixed(1)}°C`,
          vehicleId: id,
        });
      }

      // Pressure-based maintenance
      if (metrics.tyrePressure < 100) {
        const daysUntil = Math.max(1, Math.floor(metrics.tyrePressure / 5));
        const recommendedMaintenanceDays = Math.max(1, daysUntil - 3); // 3 days before critical
        predictions.push({
          component: "Reifendruck",
          daysUntil,
          recommendedMaintenanceDays,
          confidence: 78,
          priority: metrics.tyrePressure < 80 ? "Hoch" : "Niedrig",
          reason: `Reifendruck bei ${metrics.tyrePressure.toFixed(1)} bar`,
          vehicleId: id,
        });
      }

      // Battery health prediction
      if (metrics.batteryHealth < 20) {
        const daysUntil = Math.max(1, Math.floor(20 / metrics.batteryHealth));
        const recommendedMaintenanceDays = Math.max(1, daysUntil - 10); // 10 days before critical
        predictions.push({
          component: "Batteriewechsel",
          daysUntil,
          recommendedMaintenanceDays,
          confidence: 85,
          priority: "Hoch",
          reason: `Batteriekapazität bei ${metrics.batteryHealth.toFixed(1)}%`,
          vehicleId: id,
        });
      }
    });

    // Sort by days until maintenance needed
    predictions.sort((a, b) => a.daysUntil - b.daysUntil);
    setFleetPredictions(predictions);

    // Push notifications for high priority predictions (limit 5)
    predictions.filter(p=>p.priority==='Hoch').slice(0,5).forEach((pred) => {
      const id = Date.now() + Math.random();
      const msg = `${pred.component}: ${pred.reason.split('bei')[0].trim()} (${pred.daysUntil} Tage)`;
      setNotifications((prev) => {
        if(prev.some(n=>n.message===msg && n.vehicleId===pred.vehicleId)) return prev;
        return [
          ...prev,
          {
            id,
            message: msg,
            type: "prediction",
            vehicleId: pred.vehicleId,
            unread: true,
          },
        ];
      });

      setTimeline((prev) => [
        {
          time: new Date(),
          title: "Hohe Ausfallwahrscheinlichkeit",
          description: `${pred.component} | ${pred.reason}`,
          type: "prediction",
          vehicleId: pred.vehicleId,
        },
        ...prev,
      ]);
    });
  }, [vehicles]);

  // Update sensors every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      vehicles.forEach((vehicle) => {
        Object.keys(vehicle.metrics).forEach((metricKey) => {
          updateVehicleMetric(vehicle.id, metricKey);
        });
      });
    }, 6000 / simulationSpeed);

    return () => clearInterval(interval);
  }, [vehicles, updateVehicleMetric, simulationSpeed]);

  // Recalculate predictions when sensors change
  useEffect(() => {
    calculateFleetPredictions();
  }, [vehicles, calculateFleetPredictions]);

  // Detect new sensor warnings
  useEffect(() => {
    const prev = prevVehiclesRef.current;
    vehicles.forEach((vehicle) => {
      Object.entries(vehicle.metrics).forEach(([metricKey, value]) => {
        const prevVehicle = prev.find(v => v.id === vehicle.id);
        const prevWarn = prevVehicle ? prevVehicle.warnings[metricKey] : false;
        const currentWarn = vehicle.warnings[metricKey];
        if (!prevWarn && currentWarn) {
          // New warning occurred
          const id = Date.now() + Math.random();
          const message = `${vehicle.name}: Warnung! Wert bei ${value.toFixed(1)}`;

          setNotifications((prevNotifs) => {
            // avoid duplicates
            if (prevNotifs.some((n)=>n.message===message && n.vehicleId===vehicle.id)) return prevNotifs;
            return [
              ...prevNotifs,
              {
                id,
                message,
                type: "warning",
                vehicleId: vehicle.id,
                unread: true,
              },
            ];
          });

          setTimeline((prevTimeline) => [
            {
              time: new Date(),
              title: "Sensor Warnung",
              description: message,
              type: "warning",
              vehicleId: vehicle.id,
            },
            ...prevTimeline,
          ]);
        }
      });
    });
    prevVehiclesRef.current = vehicles;
  }, [vehicles]);

  // Add this after the existing state declarations
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Seed timeline with historic maintenance events on mount
  useEffect(() => {
    const historyEvents = maintenanceHistory.map((entry) => ({
      time: new Date(entry.date),
      title: "Wartung abgeschlossen",
      description: `${entry.component} | ${entry.type}`,
      type: "history",
      vehicleId: entry.component.split(' ')[1], // Assuming vehicle name is after the first space
    }));
    setTimeline((prev) => [...historyEvents.reverse(), ...prev]);
  }, []); // run once after initial mount

  const resetVehicles = () => {
    const fleet = generateVehicles(vehicleCount);
    setVehicles(fleet);
    prevVehiclesRef.current = fleet;
    setTimeline([]);
    setNotifications([]);
    setExpandedVehicles([]);
    setCurrentPage(0);
  };

  const vehicleConfigs = {
    engineTemp: {name: "Temperatur", unit: "°C", color: "#ef4444", icon: "🌡️", max: 100},
    oilLevel: {name: "Ölstand", unit: "%", color: "#f59e0b", icon: "🛢️", max: 100},
    tyrePressure: {name: "Reifendruck", unit: "bar", color: "#06b6d4", icon: "⚡", max: 200},
    batteryHealth: {name: "Batteriekapazität", unit: "%", color: "#8b5cf6", icon: "🔋", max: 100},
  };

  const formatChartData = (vehicleId, metricKey) => {
    return vehicles.find(v => v.id === vehicleId)?.history[metricKey]?.map((point, index) => ({
      time: index,
      value: point.value,
    })) || [];
  };

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map(n => n.id === id ? {...n, unread:false} : n));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Auto-dismiss notifications after 8 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map((n) =>
      setTimeout(() => dismissNotification(n.id), 8000)
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [notifications]);

  // Prepare timeline graph data
  const warningData = timeline
    .filter((e) => e.type === "warning")
    .map((e) => ({time: e.time.getTime(), y: 1, desc: e.description}));
  const predictionData = timeline
    .filter((e) => e.type === "prediction")
    .map((e) => ({time: e.time.getTime(), y: 2, desc: e.description}));
  const historyData = timeline
    .filter((e) => e.type === "history")
    .map((e) => ({time: e.time.getTime(), y: 0, desc: e.description}));

  // Prepare system overview data per metric
  const systemOverviewData = Object.entries(vehicleConfigs).map(([metricKey, cfg]) => {
    const avg = vehicles.length ? vehicles.reduce((sum, v) => sum + v.metrics[metricKey], 0) / vehicles.length : 0;
    const warnPercent = vehicles.length ? (vehicles.filter(v => v.warnings[metricKey]).length / vehicles.length) * 100 : 0;
    return {
      name: cfg.name,
      avg: Number(avg.toFixed(1)),
      warn: Number(warnPercent.toFixed(1)),
      color: cfg.color,
    };
  });

  // define major inland city hubs for plausible vehicle positions
  const cityHubs = [
    // Germany (selection)
    {name:'Berlin',lat:52.52,lng:13.41},{name:'Hamburg',lat:53.55,lng:10.00},{name:'München',lat:48.14,lng:11.58},{name:'Köln',lat:50.94,lng:6.96},{name:'Frankfurt',lat:50.11,lng:8.68},{name:'Stuttgart',lat:48.78,lng:9.18},{name:'Düsseldorf',lat:51.23,lng:6.77},{name:'Leipzig',lat:51.34,lng:12.37},{name:'Dresden',lat:51.05,lng:13.74},{name:'Hannover',lat:52.38,lng:9.73},{name:'Nürnberg',lat:49.45,lng:11.08},{name:'Bremen',lat:53.08,lng:8.80},
    // Austria
    {name:'Wien',lat:48.21,lng:16.37},{name:'Salzburg',lat:47.80,lng:13.04},{name:'Graz',lat:47.07,lng:15.44},
    // Switzerland
    {name:'Zürich',lat:47.38,lng:8.54},{name:'Bern',lat:46.95,lng:7.44},{name:'Genf',lat:46.20,lng:6.15},
    // France
    {name:'Paris',lat:48.86,lng:2.35},{name:'Lyon',lat:45.76,lng:4.84},{name:'Marseille',lat:43.30,lng:5.37},{name:'Toulouse',lat:43.60,lng:1.44},{name:'Lille',lat:50.63,lng:3.07},
    // Belgium / Netherlands / Luxembourg
    {name:'Brüssel',lat:50.85,lng:4.35},{name:'Antwerpen',lat:51.22,lng:4.40},{name:'Amsterdam',lat:52.37,lng:4.90},{name:'Rotterdam',lat:51.92,lng:4.48},{name:'Luxemburg',lat:49.61,lng:6.13},
    // UK / Ireland
    {name:'London',lat:51.50,lng:-0.12},{name:'Manchester',lat:53.48,lng:-2.24},{name:'Birmingham',lat:52.48,lng:-1.90},{name:'Glasgow',lat:55.86,lng:-4.25},{name:'Dublin',lat:53.35,lng:-6.26},
    // Spain / Portugal
    {name:'Madrid',lat:40.42,lng:-3.70},{name:'Barcelona',lat:41.39,lng:2.17},{name:'Valencia',lat:39.47,lng:-0.38},{name:'Sevilla',lat:37.39,lng:-5.99},{name:'Lissabon',lat:38.72,lng:-9.14},
    // Italy
    {name:'Rom',lat:41.90,lng:12.50},{name:'Mailand',lat:45.46,lng:9.19},{name:'Neapel',lat:40.85,lng:14.27},{name:'Turin',lat:45.07,lng:7.69},{name:'Bologna',lat:44.50,lng:11.34},
    // Scandinavia
    {name:'Kopenhagen',lat:55.68,lng:12.57},{name:'Stockholm',lat:59.33,lng:18.07},{name:'Oslo',lat:59.91,lng:10.75},{name:'Göteborg',lat:57.71,lng:11.97},{name:'Helsinki',lat:60.17,lng:24.94},
    // Eastern Europe
    {name:'Warszawa',lat:52.23,lng:21.01},{name:'Kraków',lat:50.06,lng:19.94},{name:'Praha',lat:50.08,lng:14.43},{name:'Bratislava',lat:48.15,lng:17.11},{name:'Budapest',lat:47.50,lng:19.05},{name:'Zagreb',lat:45.81,lng:15.97},{name:'Ljubljana',lat:46.06,lng:14.51},{name:'Sofia',lat:42.70,lng:23.32},{name:'Bukarest',lat:44.43,lng:26.10},
    // Northern Italy / Adriatic ports
    {name:'Trieste',lat:45.65,lng:13.77},{name:'Venedig',lat:45.44,lng:12.33},
    // Baltic states
    {name:'Riga',lat:56.95,lng:24.11},{name:'Tallinn',lat:59.44,lng:24.75},{name:'Vilnius',lat:54.69,lng:25.28},
    // Additional hubs
    {name:'Porto',lat:41.15,lng:-8.62},{name:'Bilbao',lat:43.26,lng:-2.93},{name:'Málaga',lat:36.72,lng:-4.42},{name:'Seinäjoki',lat:62.79,lng:23.01}
  ];

  // helper to generate a slightly curved route between two hubs (~100 pts)
  const generateRoute = (start, end, steps=120) => {
    const points = [];
    const dLat = end.lat - start.lat;
    const dLng = end.lng - start.lng;
    // perpendicular small offset to add curvature (0.02° ≈ 2 km)
    const perpLat = -dLng;
    const perpLng = dLat;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps; // 0..1
      let lat = start.lat + dLat * t;
      let lng = start.lng + dLng * t;
      // add sine-based curve perpendicular to path
      const curve = Math.sin(t * Math.PI) * 0.02; // peak offset 0.02°
      lat += perpLat * curve;
      lng += perpLng * curve;
      points.push({ lat, lng });
    }
    return points;
  };

  // Generate mock vehicles
  const generateVehicles = useCallback((count) => {
    const modelPool = [
      {name:'Mercedes Actros', icon: Truck},
      {name:'MAN TGX', icon: Truck},
      {name:'VW Crafter', icon: Car},
      {name:'Mercedes Sprinter', icon: Car},
      {name:'Setra S 531 DT', icon: Bus},
      {name:"MAN Lion's Coach", icon: Bus},
      {name:'BMW 5er Touring', icon: Car},
      {name:'Scania R500', icon: Truck},
      {name:'Scania R450', icon: Truck},
      {name:'Scania S730', icon: Truck},
      {name:'Scania P280', icon: Truck},
      {name:'Scania G500', icon: Truck},
      {name:'Scania L340', icon: Truck}
    ];
    const newFleet = Array.from({length: count}, (_, idx) => {
      const id = `V-${idx + 1}`;
      const {name:model, icon:IconComp} = modelPool[Math.floor(Math.random()*modelPool.length)];
      const year = 2015 + Math.floor(Math.random()*8); // 2015-2022
      // choose a random city hub and apply a small offset along a single axis to mimic being on a road close to that city
      const hub = cityHubs[Math.floor(Math.random() * cityHubs.length)];
      let lat = hub.lat;
      let lng = hub.lng;
      const offset = (Math.random() - 0.5) * 0.04; // ~ ±2-3 km
      if (Math.random() < 0.5) {
        lat += offset; // north-south oriented road
      } else {
        lng += offset; // east-west oriented road
      }
      const isMoving = Math.random() < 0.6; // 60% of vehicles on the road
      let route = null;
      let routeIndex = 0;
      let dest = null;
      let routeIsReal = false;
      if (isMoving) {
        // choose destination hub different from start
        do {
          dest = cityHubs[Math.floor(Math.random() * cityHubs.length)];
        } while (dest === hub);
        // initial synthetic fallback route (will be replaced once real route fetched)
        route = generateRoute(hub, dest);
        routeIndex = 0;
        routeIsReal = false;
      }
      // build a custom Leaflet SVG icon using the same Lucide icon used in the list
      const iconHtml = renderToStaticMarkup(React.createElement(IconComp, { size: 24, color: '#2563eb' }));
      const markerIcon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const metrics = {
        engineTemp: 65 + Math.random() * 30, // 65-95 °C
        oilLevel: 40 + Math.random() * 60,  // 40-100 %
        tyrePressure: 85 + Math.random() * 25, // 85-110 bar
        batteryHealth: 50 + Math.random() * 50, // 50-100 %
      };
      const mileage = Math.floor(50000 + Math.random()*150000); // 50k-200k km
      const lastServiceDateObj = new Date(Date.now() - Math.random()*31536000000); // within last year
      const lastServiceDate = lastServiceDateObj.toLocaleDateString();
      const nextServiceDate = new Date(lastServiceDateObj.getTime() + 15552000000).toLocaleDateString(); // +6mo
      const history = {
        engineTemp: [{time: Date.now(), value: metrics.engineTemp}],
        oilLevel: [{time: Date.now(), value: metrics.oilLevel}],
        tyrePressure: [{time: Date.now(), value: metrics.tyrePressure}],
        batteryHealth: [{time: Date.now(), value: metrics.batteryHealth}],
      };
      const warnings = {
        engineTemp: metrics.engineTemp > 90,
        oilLevel: metrics.oilLevel < 20,
        tyrePressure: metrics.tyrePressure < 90,
        batteryHealth: metrics.batteryHealth < 20,
      };
      return {
        id,
        name: `Fahrzeug ${idx + 1}`,
        model,
        year,
        mileage,
        lastServiceDate,
        nextServiceDate,
        metrics,
        history,
        warnings,
        icon: IconComp,
        location: {lat, lng},
        markerIcon,
        route,
        routeIndex,
        isMoving,
        dest,
        routeIsReal,
      };
    });
    return newFleet;
  }, []);

  // Slider controlled vehicle count
  const [vehicleCount, setVehicleCount] = useState(6); // initial vehicle count
  const [expandedVehicles, setExpandedVehicles] = useState([]); // ids of expanded tiles
  const [currentPage, setCurrentPage] = useState(0);
  const vehiclesPerPage = 12;

  // Regenerate fleet when vehicleCount changes (resetting timeline & notifications)
  useEffect(() => {
    const fleet = generateVehicles(vehicleCount);
    setVehicles(fleet);
    prevVehiclesRef.current = fleet;
    setTimeline([]);
    setNotifications([]);
    setExpandedVehicles([]);
    setCurrentPage(0);
  }, [vehicleCount, generateVehicles]);

  const toggleExpand = (id) => {
    setExpandedVehicles((prev) => prev.includes(id) ? prev.filter(v=>v!==id) : [...prev, id]);
  };

  // Add scroll listener effect after darkMode effect
  useEffect(()=>{
    const onScroll = () => {
      setHeaderCollapsed(window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  },[]);

  // NEW: fixed center of map (Europe)
  const mapCenter = [51, 10];

  // movement interval – advance vehicles that are on a route
  useEffect(() => {
    const iv = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (!v.route || v.route.length === 0) return v;
        const nextIndex = (v.routeIndex + 1) % v.route.length;
        return {
          ...v,
          routeIndex: nextIndex,
          location: v.route[nextIndex],
        };
      }));
    }, 4000 / simulationSpeed); // scaled by simulation speed
    return () => clearInterval(iv);
  }, [simulationSpeed]);

  // fetch real street routes from OSRM for moving vehicles that still have synthetic routes
  useEffect(() => {
    vehicles.forEach((v) => {
      if (!v.isMoving) return;
      if (v.routeIsReal) return; // already real
      if (!v.dest) return;
      if (routeFetchInProgress.current.has(v.id)) return;

      routeFetchInProgress.current.add(v.id);

      const url = `https://router.project-osrm.org/route/v1/driving/${v.location.lng},${v.location.lat};${v.dest.lng},${v.dest.lat}?overview=full&geometries=geojson`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.routes && data.routes[0] && data.routes[0].geometry) {
            const coords = data.routes[0].geometry.coordinates.map(([lon, lat]) => ({ lat, lng: lon }));
            if (coords.length > 2) {
              setVehicles((prev) =>
                prev.map((pv) =>
                  pv.id === v.id ? { ...pv, route: coords, routeIndex: 0, location: coords[0], routeIsReal: true } : pv
                )
              );
            }
          }
        })
        .catch((err) => {
          console.error('OSRM fetch failed', err);
        })
        .finally(() => {
          routeFetchInProgress.current.delete(v.id);
        });
    });
  }, [vehicles]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} p-6`}>
      <div className="mx-auto">
        {/* Header */}
        <header className={`sticky top-0 z-40 mb-12 transition-all duration-300 ${headerCollapsed?'backdrop-blur bg-indigo-700/90':'bg-transparent'}`} style={{overflow:'visible'}}>
          <div className={`relative overflow-visible rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 transition-all duration-300 text-white shadow-xl ${headerCollapsed?'p-4':'p-8'}`}>
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className={`font-bold tracking-tight transition-all duration-300 ${headerCollapsed?'text-xl':'text-4xl mb-3'}`}>
                    Predictive Maintenance Dashboard
                  </h1>
                  {!headerCollapsed && (
                    <p className="text-blue-100 text-lg">
                      Echtzeitüberwachung und Ausfallvorhersage für Industrieanlagen
                    </p>) }
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {darkMode ? <Sun className="text-yellow-300" /> : <Moon className="text-blue-100" />}
                  </button>
                  {/* Bell */}
                  <div className="relative">
                    <button onClick={()=>setShowInbox(s=>!s)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                      <Bell size={18} />
                    </button>
                    {unreadCount>0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1">{unreadCount}</span>}
                    {showInbox && (
                      <div
                        className={`absolute right-0 mt-2 w-72 overflow-auto resize rounded-lg shadow-xl p-4 z-50 ${darkMode? 'bg-gray-800 text-white':'bg-white text-gray-900'}`}
                        style={{ minWidth: '12rem', minHeight: '4rem' }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-sm dark:text-white text-gray-800">Benachrichtigungen</h3>
                          <button onClick={()=>setNotifications([])} className="text-xs hover:underline dark:text-gray-300 dark:hover:text-white text-blue-600 hover:text-blue-700">Alle löschen</button>
                        </div>
                        {notifications.length===0 ? <p className="text-xs text-gray-500">Keine Benachrichtigungen</p> : (
                          <ul className="space-y-2">
                            {notifications.slice().reverse().map(notif=> (
                              <li key={notif.id} className={`p-2 rounded-md flex items-start justify-between ${notif.unread? (darkMode?'bg-gray-700':'bg-indigo-100'):''}`}>
                                <div className="flex items-start gap-2">
                                  {notif.type==='warning'? <AlertTriangle size={14} className="text-red-500"/> : <Zap size={14} className="text-indigo-500"/>}
                                  <span className="text-xs leading-snug">{notif.message}</span>
                                </div>
                                <button onClick={()=>dismissNotification(notif.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs">×</button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Control Panel */}
        <div className={`rounded-xl shadow-lg p-6 mb-8 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white'
        }`}>
          <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">Steuerung</h2>
              <p className="text-xs opacity-60">Warnschwellen (ML-Vorhersage)</p>
            </div>
            <div className="flex gap-6 flex-wrap items-center">
              <div className="flex items-center gap-2">
                <label htmlFor="vehicleCount" className="text-sm whitespace-nowrap">Fahrzeuge:</label>
                <input
                  id="vehicleCount"
                  type="range"
                  min="1"
                  max="200"
                  list="vehicleTicks"
                  value={vehicleCount}
                  onChange={(e) => setVehicleCount(Number(e.target.value))}
                  className="accent-blue-600 cursor-pointer w-40"
                />
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={vehicleCount}
                  onChange={(e)=>{
                    const val = Number(e.target.value);
                    if(!isNaN(val)) setVehicleCount(Math.min(200, Math.max(1, val)));
                  }}
                  className="w-16 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                />
                <datalist id="vehicleTicks">
                  <option value="1"/>
                  <option value="50"/>
                  <option value="100"/>
                  <option value="150"/>
                  <option value="200"/>
                </datalist>
              </div>
              {/* Simulation speed control */}
              <div className="flex items-center gap-2">
                <label htmlFor="simSpeed" className="text-sm whitespace-nowrap">Tempo:</label>
                <input
                  id="simSpeed"
                  type="range"
                  min="0.25"
                  max="100"
                  step="0.25"
                  list="speedTicks"
                  value={simulationSpeed}
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="accent-blue-600 cursor-pointer w-40"
                />
                <input
                  type="number"
                  min="0.25"
                  max="10"
                  step="0.25"
                  value={simulationSpeed}
                  onChange={(e)=>{
                    const val = parseFloat(e.target.value);
                    if(!isNaN(val)) setSimulationSpeed(Math.min(10, Math.max(0.25, val)));
                  }}
                  className="w-16 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm">x</span>
                <datalist id="speedTicks">
                  <option value="0.25"/>
                  <option value="0.5"/>
                  <option value="1"/>
                  <option value="2"/>
                  <option value="4"/>
                  <option value="6"/>
                  <option value="8"/>
                  <option value="10"/>
                </datalist>
              </div>
              <button
                onClick={resetVehicles}
                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 shadow-md"
              >
                <RefreshCw size={16} className="inline mr-2" />
                Reset
              </button>
            </div>
          </div>

          {/* Threshold chips with mock distribution tooltip */}
          <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200 select-none">
              <FlaskConical size={12}/> ML&nbsp;Thresholds
            </span>
            {[
              {label:'Temp > 90°C', bg:'#fee2e2', fg:'#b91c1c', mean:75, sd:7, unit:'°C'},
              {label:'Öl < 20%', bg:'#fef9c3', fg:'#92400e', mean:65, sd:15, unit:'%'},
              {label:'Druck < 90 bar', bg:'#dbeafe', fg:'#1e40af', mean:110, sd:10, unit:'bar'},
              {label:'Batterie < 20%', bg:'#ede9fe', fg:'#5b21b6', mean:60, sd:20, unit:'%'}
            ].map((t,i)=>(
              <span key={i} style={{backgroundColor:t.bg,color:t.fg}} className="relative group px-2 py-1 rounded-full select-none text-[11px] cursor-default">
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Sensors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 mb-8">
          {vehicles.slice(currentPage*vehiclesPerPage, (currentPage+1)*vehiclesPerPage).map((vehicle) => {
            const isExpanded = expandedVehicles.includes(vehicle.id);
            const vehiclePreds = fleetPredictions.filter(p=>p.vehicleId===vehicle.id);
            return (
              <div
                key={vehicle.id}
                onClick={()=>toggleExpand(vehicle.id)}
                className={`rounded-xl shadow-lg ${isExpanded? 'p-6' : 'p-4'} transition-all duration-300 transform hover:scale-[1.02] cursor-pointer ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    {React.createElement(vehicle.icon, {size:24,className:"mr-2 text-blue-600 dark:text-blue-400"})}
                    <div>
                      <h3 className="text-sm font-semibold">{vehicle.name}</h3>
                      <p className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{vehicle.model} · {vehicle.year}</p>
                    </div>
                  </div>
                  <span className="text-xs opacity-70">{isExpanded ? '▼' : '▲'}</span>
                </div>

                {isExpanded ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {Object.entries(vehicle.metrics).map(([metricKey, value]) => {
                        const cfg = vehicleConfigs[metricKey];
                        const percentage = Math.min((value / cfg.max) * 100, 100);
                        return (
                          <div key={metricKey} className="flex flex-col items-center">
                            <span className="text-xl mb-1">{cfg.icon}</span>
                            <div className="relative w-20 h-20 mb-1">
                              <div className="absolute inset-0 rounded-full" style={{background:`conic-gradient(${cfg.color} ${percentage}%, ${darkMode? '#2d3748':'#e5e7eb'} ${percentage}%)`}} />
                              <div className={`absolute inset-1 rounded-full flex flex-col items-center justify-center ${darkMode? 'bg-gray-900':'bg-white'}`}>
                                <span className="text-sm font-bold" style={{color:cfg.color}}>{value.toFixed(1)}</span>
                                <span className="text-[10px]" style={{color: darkMode? '#9ca3af':'#6b7280'}}>{cfg.unit}</span>
                              </div>
                            </div>
                            <span className={`text-xs font-medium ${vehicle.warnings[metricKey] ? 'text-red-500':'text-green-500'}`}>{vehicle.warnings[metricKey]? 'Warnung':'OK'}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-xs space-y-1">
                       <p><strong>Kilometerstand:</strong> {vehicle.mileage.toLocaleString()} km</p>
                       <p><strong>Letzte Wartung:</strong> {vehicle.lastServiceDate}</p>
                       <p><strong>Nächste Wartung:</strong> {vehicle.nextServiceDate}</p>
                     </div>

                    {vehiclePreds.length>0 && (
                       <div className="mt-3 space-y-1">
                         <h4 className="text-xs font-semibold">Offene Prognosen</h4>
                         {vehiclePreds.map((p,i)=>(
                           <div key={i} className="text-xs space-y-1">
                             <div className="flex justify-between items-center">
                               <span>{p.component}</span>
                               <div className="flex gap-1">
                                 <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-1 py-0.5 rounded text-[8px]">
                                   {p.recommendedMaintenanceDays}d
                                 </span>
                                 <span className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-1 py-0.5 rounded text-[8px]">
                                   {p.daysUntil}d
                                 </span>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                    )}

                    {vehicle.history.engineTemp.length > 0 && (
                      <div className="mt-2 h-20 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={formatChartData(vehicle.id,'engineTemp')}>
                            <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} animationDuration={1500}/>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between mt-2">
                    {Object.entries(vehicle.metrics).map(([metricKey,value])=>{
                      const cfg = vehicleConfigs[metricKey];
                      const percentage=Math.min((value/cfg.max)*100,100);
                      return (
                        <div key={metricKey} className="flex flex-col items-center">
                          <div className="relative w-12 h-12 mb-0.5">
                            <div className="absolute inset-0 rounded-full" style={{background:`conic-gradient(${cfg.color} ${percentage}%, ${darkMode? '#2d3748':'#e5e7eb'} ${percentage}%)`}} />
                            <div className={`absolute inset-1 rounded-full flex items-center justify-center ${darkMode? 'bg-gray-900':'bg-white'}`}
                            >
                              <span className="text-[8px] font-bold" style={{color:cfg.color}}>{value.toFixed(0)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {vehicles.length>vehiclesPerPage && (
          <div className="flex justify-center items-center gap-4 mt-6 mb-8">
            <button disabled={currentPage===0} onClick={()=>setCurrentPage(p=>Math.max(0,p-1))} className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow disabled:opacity-30">
              <ChevronLeft size={16}/>
            </button>
            <span className="text-sm">Seite {currentPage+1} / {Math.ceil(vehicles.length/vehiclesPerPage)}</span>
            <button disabled={currentPage>=Math.ceil(vehicles.length/vehiclesPerPage)-1} onClick={()=>setCurrentPage(p=>Math.min(Math.ceil(vehicles.length/vehiclesPerPage)-1,p+1))} className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow disabled:opacity-30">
              <ChevronRight size={16}/>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Predictions */}
          <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center dark:text-white">
              <Activity className="mr-2" />
              Ausfallvorhersagen
            </h2>
            <div className="text-xs opacity-70 mb-4">Vorhersagen je Fahrzeug (ML-basiert)</div>
            {fleetPredictions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle
                  size={64}
                  className="mx-auto mb-4 text-green-500 animate-bounce"
                />
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Alle Systeme funktionieren optimal
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-4 scrollbar-[2px] scrollbar-thumb-white/20 scrollbar-track-transparent">
                {fleetPredictions.map((prediction, index) => (
                  <div
                    key={index}
                    className={`border-l-4 pl-3 py-3 rounded-r-lg transition-all duration-300 transform hover:scale-[1.02] ${
                      prediction.priority === "Hoch"
                        ? "border-red-500 bg-red-50/90 dark:border-red-400 dark:bg-red-500/10"
                        : prediction.priority === "Mittel"
                        ? "border-yellow-500 bg-yellow-50/90 dark:border-yellow-400 dark:bg-yellow-500/10"
                        : "border-blue-500 bg-blue-50/90 dark:border-blue-400 dark:bg-blue-500/10"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="font-semibold dark:text-gray-100 flex items-center gap-2 text-base">
                          {React.createElement(vehicles.find(v=>v.id===prediction.vehicleId)?.icon || Truck,{size:14, className: "dark:text-gray-300"})}
                          {vehicles.find(v=>v.id===prediction.vehicleId)?.name}: {prediction.component}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                          {prediction.reason}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <div className="flex gap-2 items-center">
                          {/* Recommended Maintenance Date */}
                          <div className="bg-green-100 dark:bg-green-500/10 rounded px-2 py-1">
                            <div className="text-[10px] text-green-700 dark:text-green-400 font-medium">
                              Empfohlen
                            </div>
                            <div className="text-xs font-bold text-green-800 dark:text-green-300">
                              {prediction.recommendedMaintenanceDays}d
                            </div>
                          </div>
                          
                          {/* Predicted Failure Date */}
                          <div className="bg-red-100 dark:bg-red-500/10 rounded px-2 py-1">
                            <div className="text-[10px] text-red-700 dark:text-red-400 font-medium">
                              Ausfall
                            </div>
                            <div className="text-xs font-bold text-red-800 dark:text-red-300">
                              {prediction.daysUntil}d
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              prediction.priority === "Hoch"
                                ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                                : prediction.priority === "Mittel"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                            }`}
                          >
                            {prediction.priority}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            {prediction.confidence}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance History */}
          <div className={`rounded-xl shadow-lg p-6 transition-colors duration-300 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <h2 className="text-xl font-semibold mb-6">Wartungshistorie</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-gray-600/50 dark:scrollbar-thumb-gray-500/30 scrollbar-track-transparent hover:scrollbar-thumb-gray-600/70 dark:hover:scrollbar-thumb-gray-400/50">
              {maintenanceHistory.map((entry, index) => (
                <div 
                  key={index} 
                  className={`border-l-4 pl-4 pr-3 pb-4 transition-all duration-300 transform hover:scale-[1.02] ${
                    entry.planned 
                      ? 'border-green-500 bg-green-50/90 dark:border-green-400 dark:bg-green-500/10' 
                      : 'border-red-500 bg-red-50/90 dark:border-red-400 dark:bg-red-500/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm dark:text-gray-100">{entry.component}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          entry.planned 
                            ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                        }`}>
                          {entry.planned ? 'Geplant' : 'Ungeplant'}
                        </span>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        {entry.vehicle} • {entry.technician}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {entry.description}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <div className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                        {entry.cost}€
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.duration}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {entry.date}
                    </div>
                    <div className="text-xs text-green-500 dark:text-green-400 font-medium">
                      {entry.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Overview Chart */}
        <div className={`rounded-xl shadow-lg p-6 mt-8 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white'
        }`}>
          <h2 className="text-xl font-semibold mb-6">Systemübersicht</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={systemOverviewData}
                barCategoryGap={20}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={darkMode ? '#374151' : '#e5e7eb'} 
                />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563' }}
                />
                <YAxis 
                  tick={{ fill: darkMode ? '#9ca3af' : '#4b5563' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{fontSize: '0.75rem'}} />
                {/* Average metric values */}
                <Bar dataKey="avg" name="Durchschnitt" radius={[4,4,0,0]} animationDuration={1500}>
                  {systemOverviewData.map((entry,index)=>(
                    <Cell key={`avg-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                {/* Percentage of vehicles with warnings */}
                <Bar dataKey="warn" name="% Warnungen" radius={[4,4,0,0]} fill="#dc2626" animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Graph Section */}
        <div className={`rounded-xl shadow-lg p-6 mt-8 transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white'
        }`}>
          <h2 className="text-xl font-semibold mb-6">Ereignis-Timeline</h2>
          {timeline.length === 0 ? (
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Keine Ereignisse
            </p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{top: 20, right: 30, bottom: 20, left: 0}}>
                  <CartesianGrid stroke={darkMode ? '#374151' : '#e5e7eb'} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={[warningData.concat(predictionData).length > 0 ? 'dataMin' : 0, 'dataMax']}
                    tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                    tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 12 }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    domain={[-0.5, 2.5]}
                    ticks={[0, 1, 2]}
                    tickFormatter={(v) => (v === 0 ? 'Wartung' : v === 1 ? 'Warnung' : 'Prognose')}
                    tick={{ fill: darkMode ? '#9ca3af' : '#4b5563', fontSize: 12 }}
                  />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: darkMode ? '#1f2937' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value, name, props) => [props.payload.desc, name]}
                  />
                  <Scatter name="Warnungen" data={warningData} fill="#ef4444" shape="triangle" />
                  <Scatter name="Prognosen" data={predictionData} fill="#6366f1" shape="circle" />
                  <Scatter name="Historie" data={historyData} fill="#9ca3af" shape="square" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* NEW: Vehicle Map */}
        <div className={`rounded-xl shadow-lg p-6 mt-8 transition-colors duration-300 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-4">Fahrzeugpositionen</h2>
          <div className="w-full" style={{height:'40rem'}}>
            <MapContainer center={mapCenter} zoom={6} scrollWheelZoom={false} className="h-full w-full rounded-lg">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* render routes and moving markers */}
              {vehicles.map(v => v.route ? (
                <Polyline key={v.id + "_line"} positions={v.route.map(p => [p.lat, p.lng])} pathOptions={{ color: '#3b82f6', weight: 2.5, dashArray: '6 4', opacity: 0.8 }} />
              ) : null)}
              {vehicles.map(v => (
                <Marker key={v.id} position={[v.location.lat, v.location.lng]} icon={v.markerIcon}>
                  <Popup>
                    <div className="text-sm font-semibold">{v.name}</div>
                    <div className="text-xs">{v.model} · {v.year}</div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
