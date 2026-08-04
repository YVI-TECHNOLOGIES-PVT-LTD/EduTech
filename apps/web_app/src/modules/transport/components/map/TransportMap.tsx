import { LeafletMap } from './LeafletMap';
import { TransportMapProps } from './types';

/**
 * TransportMap Abstraction
 * 
 * PHASE 1: Uses Leaflet (OpenStreetMap) - No API Key required.
 * PHASE 2: Can be swapped to Google Maps Provider seamlessly.
 */
export const TransportMap = (props: TransportMapProps) => {
    // Future logic:
    // if (useGoogleMaps) return <GoogleMap {...props} />;

    return <LeafletMap {...props} />;
};
