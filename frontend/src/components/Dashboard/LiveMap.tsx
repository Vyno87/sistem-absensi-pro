import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { MapPin, User, Clock, RefreshCw, Info, Signal } from 'lucide-react';

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
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const res = await api.get('/attendance/today');
            setMarkers(res.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error fetching map locations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocations();
        const interval = setInterval(fetchLocations, 10000);
        return () => clearInterval(interval);
    }, []);

    // Default center (Jakarta) or center on first marker
    const center: [number, number] = markers.length > 0
        ? [markers[0].latitude, markers[0].longitude]
        : [-6.2088, 106.8456];

    return (
        <div className="h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl border border-[var(--glass-border)] relative z-0 bg-slate-900">
            {/* Overlay Title & Diagnostics */}
            <div className="absolute top-4 left-4 right-4 z-[400] flex justify-between items-start pointer-events-none">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-white/20 pointer-events-auto transition-all hover:shadow-indigo-500/10">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        {t('common.liveEmployeeLocations')}
                    </h3>
                    <div className="flex items-center gap-3">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                            <User size={10} className="text-indigo-400" /> {markers.length} {t('dashboard.activeStatus')}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                            <Clock size={10} className="text-blue-400" /> {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchLocations}
                    disabled={loading}
                    className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/20 pointer-events-auto hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw size={18} className={`text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {markers.length === 0 && (
                <div className="absolute inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-sm border border-white/10 animate-fade-in mx-auto">
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MapPin size={40} className="text-indigo-500 animate-bounce" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('dashboard.noActiveLocations')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            Belum ada karyawan yang melakukan presensi dengan data lokasi GPS hari ini.
                        </p>
                        <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-start gap-3 text-left">
                            <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-indigo-400 leading-relaxed">
                                <b>Tips:</b> Pastikan fitur penguncian GPS (GPS Enforcement) aktif agar setiap presensi memiliki titik koordinat yang akurat.
                            </p>
                        </div>
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
                            <div className="p-1 min-w-[200px]">
                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/20 bg-slate-100 shadow-sm">
                                        <img
                                            src={marker.facePhoto || 'https://via.placeholder.com/150'}
                                            alt={marker.employeeName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="text-sm font-bold text-gray-900 m-0 truncate">{marker.employeeName}</h4>
                                        <p className="text-[10px] text-gray-500 m-0 uppercase tracking-wider font-semibold truncate">{marker.position}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-400 flex items-center gap-1"><Clock size={12} /> Waktu</span>
                                        <span className="font-bold text-gray-700">
                                            {new Date(marker.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {marker.accuracy && (
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-gray-400 flex items-center gap-1"><Signal size={12} /> Akurasi</span>
                                            <span className={`font-bold ${marker.accuracy < 50 ? 'text-green-500' : 'text-yellow-500'}`}>
                                                ±{Math.round(marker.accuracy)}m
                                            </span>
                                        </div>
                                    )}
                                    <div className={`mt-2 py-1.5 px-2 rounded-lg text-center text-[10px] font-bold uppercase tracking-widest ${marker.status === 'late' ? 'bg-red-50 text-red-600 shadow-sm' : 'bg-green-50 text-green-600 shadow-sm'
                                        }`}>
                                        {marker.status === 'late' ? 'TERLAMBAT' : 'HADIR TEPAT WAKTU'}
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default LiveMap;
