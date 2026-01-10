import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Helper component to recenter map when markers change
const RecenterMap = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
};

const LiveMap = () => {
    const { t } = useLanguage();
    const [markers, setMarkers] = useState<any[]>([]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                // Fetch ALL today's active locations
                const res = await api.get('/attendance/today');
                setMarkers(res.data);
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
        <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--glass-border)] relative z-0">
            {markers.length === 0 && (
                <div className="absolute inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                    <div className="bg-[var(--glass-shine)] p-6 rounded-2xl border border-[var(--glass-border)]">
                        <p className="text-[var(--text-main)] font-semibold mb-2">📍 {t('dashboard.noActiveLocations') || 'Belum ada posisi absen aktif hari ini'}</p>
                        <p className="text-[var(--text-muted)] text-xs">Posisi akan muncul otomatis saat karyawan melakukan absen dengan GPS aktif.</p>
                    </div>
                </div>
            )}

            <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <RecenterMap center={center} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((marker: any, idx: number) => (
                    <Marker key={idx} position={[marker.latitude, marker.longitude]}>
                        <Popup className="custom-popup">
                            <div className="text-center p-1">
                                <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden border-2 border-primary ring-2 ring-primary/20">
                                    <img
                                        src={marker.facePhoto || 'https://via.placeholder.com/150'}
                                        alt={marker.employeeName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <p className="font-bold text-gray-800 text-sm leading-tight">{marker.employeeName}</p>
                                <p className="text-[10px] text-gray-500 font-medium mb-1 uppercase tracking-wider">{marker.position}</p>
                                <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1">
                                    <p className="text-[10px] text-indigo-600 font-bold">
                                        🕒 {new Date(marker.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mx-auto ${marker.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {marker.status?.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Overlay Title */}
            <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-md border border-white/20">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {t('common.liveEmployeeLocations')}
                </h3>
            </div>
        </div>
    );
};

export default LiveMap;
