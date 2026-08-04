import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TransportMapProps } from './types';
import { renderToStaticMarkup } from 'react-dom/server';
import { Bus, MapPin, School, User } from 'lucide-react';

// Controller component to handle map actions like recentering
// This must be a child of MapContainer to access the map instance via hook
const MapController = ({ center, zoom }: { center?: { latitude: number, longitude: number }, zoom?: number }) => {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo([center.latitude, center.longitude], zoom || 15, {
                animate: true,
                duration: 1.5
            });
        }
    }, [center, zoom, map]);

    return null;
};

// Helper to generate custom icons
const createIcon = (type: 'BUS' | 'STOP' | 'STUDENT' | 'SCHOOL', heading?: number) => {
    let iconComponent;
    let colorClass = 'text-gray-700';
    let bgClass = 'bg-white';

    switch (type) {
        case 'BUS':
            iconComponent = <Bus size={20} />;
            colorClass = 'text-blue-600';
            bgClass = 'bg-white';
            break;
        case 'STOP':
            iconComponent = <MapPin size={20} />;
            colorClass = 'text-red-500';
            bgClass = 'bg-white';
            break;
        case 'SCHOOL':
            iconComponent = <School size={20} />;
            colorClass = 'text-indigo-600';
            bgClass = 'bg-indigo-50';
            break;
        case 'STUDENT':
            iconComponent = <User size={16} />;
            colorClass = 'text-green-600';
            bgClass = 'bg-green-50';
            break;
    }

    const html = renderToStaticMarkup(
        <div className={`p-1.5 rounded-full shadow-lg border-2 border-white ${colorClass} ${bgClass} flex items-center justify-center`} style={{
            transform: type === 'BUS' && heading ? `rotate(${heading}deg)` : 'none',
            width: '32px',
            height: '32px'
        }}>
            {iconComponent}
        </div>
    );

    return L.divIcon({
        html: html,
        className: '', // Empty to avoid default styles interfering
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20]
    });
};

export const LeafletMap = ({ center, zoom = 15, markers = [], paths = [], className }: TransportMapProps) => {

    // Default center (Hyderabad) if none provided
    const defaultCenter: [number, number] = center
        ? [center.latitude, center.longitude]
        : [17.3850, 78.4867];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={zoom}
            className={`w-full h-full rounded-xl overflow-hidden z-0 ${className}`}
            style={{
                height: '100%',
                minHeight: '300px',
                width: '100%'
            }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController center={center} zoom={zoom} />

            {paths?.map((path, idx) => (
                <Polyline
                    key={`path-${idx}`}
                    positions={path.points.map(p => [p.latitude, p.longitude])}
                    pathOptions={{ color: path.color || 'blue', weight: 4, opacity: 0.7 }}
                />
            ))}

            {markers?.map((marker) => (
                <Marker
                    key={marker.id}
                    position={[marker.position.latitude, marker.position.longitude]}
                    icon={createIcon(marker.type, marker.position.heading)}
                >
                    {(marker.title || marker.description) && (
                        <Popup>
                            <div className="font-sans min-w-[150px]">
                                <div className="font-bold text-sm text-gray-900">{marker.title}</div>
                                {marker.description && (
                                    <div className="text-xs text-gray-500 mt-1">{marker.description}</div>
                                )}
                            </div>
                        </Popup>
                    )}
                </Marker>
            ))}
        </MapContainer>
    );
};
