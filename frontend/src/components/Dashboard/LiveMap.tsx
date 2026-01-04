import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LiveMap = () => {
    const { t } = useLanguage();
    const [markers, setMarkers] = useState<any[]>([]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                // Reuse existing endpoint but filter for today's locations on frontend for now
                // Ideally backend should provide a dedicated endpoint
                const res = await api.get('/attendance');
                // Filter only records with valid lat/long
                const validLocations = res.data.filter((r: any) => r.latitude && r.longitude && r.latitude !== 0);
                setMarkers(validLocations);
            } catch (err) {
                console.error("Error fetching map locations:", err);
            }
        };

        fetchLocations();
        const interval = setInterval(fetchLocations, 10000); // Poll every 10s for map
        return () => clearInterval(interval);
    }, []);

    // Default center (Jakarta) or center on first marker
    const center: [number, number] = markers.length > 0
        ? [markers[0].latitude, markers[0].longitude]
        : [-6.2088, 106.8456];

    return (
        <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 relative z-0">
            <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((marker, idx) => (
                    <Marker key={idx} position={[marker.latitude, marker.longitude]}>
                        <Popup>
                            <div className="text-center p-2">
                                <img
                                    src={marker.facePhoto || 'https://via.placeholder.com/150'}
                                    alt={marker.employeeName}
                                    className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-indigo-500"
                                />
                                <p className="font-bold text-sm">{marker.employeeName}</p>
                                <p className="text-xs text-gray-500">{marker.type} • {new Date(marker.checkIn).toLocaleTimeString()}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Overlay Title */}
            <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-md border border-white/20">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Employee Locations
                </h3>
            </div>
        </div>
    );
};

export default LiveMap;
