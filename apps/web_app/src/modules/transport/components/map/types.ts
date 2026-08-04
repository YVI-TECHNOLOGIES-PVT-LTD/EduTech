
export interface MapLocation {
    latitude: number;
    longitude: number;
    heading?: number;
}

export interface MapMarker {
    id: string;
    position: MapLocation;
    title?: string;
    type: 'BUS' | 'STOP' | 'STUDENT' | 'SCHOOL';
    description?: string;
}

export interface MapPath {
    points: MapLocation[];
    color?: string;
}

export interface TransportMapProps {
    center?: MapLocation;
    zoom?: number;
    markers?: MapMarker[];
    paths?: MapPath[];
    className?: string;
    readonly?: boolean; // If true, maybe disable interactions
    showUserLocation?: boolean; // For driver self-view
}
