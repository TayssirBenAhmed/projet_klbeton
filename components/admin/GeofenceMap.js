'use client';

import { useEffect, useRef } from 'react';

export default function GeofenceMap({ center, radius, onMapClick, geofences = [], userLocation = null }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const circlesRef = useRef([]);
    const userMarkerRef = useRef(null);

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        // Dynamically import Leaflet
        import('leaflet').then((L) => {
            // Fix for default marker icon
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });

            // Create custom icons
            const userIcon = new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            if (!mapInstanceRef.current && mapRef.current) {
                // Initialize map
                const map = L.map(mapRef.current).setView(center, 15);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19,
                }).addTo(map);

                // Handle map clicks
                if (onMapClick) {
                    map.on('click', (e) => {
                        onMapClick(e.latlng.lat, e.latlng.lng);
                    });
                }

                mapInstanceRef.current = map;
            }

            // Update center if it changed significantly
            if (mapInstanceRef.current) {
                // Only setView if not already centered near (prevents jumpy UI)
                const currentCenter = mapInstanceRef.current.getCenter();
                const distToCenter = L.latLng(center).distanceTo(currentCenter);
                if (distToCenter > 100) {
                    mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom());
                }

                // Clear existing markers and circles (except user marker)
                markersRef.current.forEach(marker => marker.remove());
                circlesRef.current.forEach(circle => circle.remove());
                markersRef.current = [];
                circlesRef.current = [];

                if (userMarkerRef.current) {
                    userMarkerRef.current.remove();
                    userMarkerRef.current = null;
                }

                // Add user location marker
                if (userLocation) {
                    const userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon }).addTo(mapInstanceRef.current);
                    userMarker.bindPopup('<b>Votre position actuelle</b>');
                    userMarkerRef.current = userMarker;
                }

                // Add current geofence (if editing/creating)
                if (radius > 0) {
                    const marker = L.marker(center).addTo(mapInstanceRef.current);
                    marker.bindPopup('<b>Centre du périmètre</b>');
                    markersRef.current.push(marker);

                    const circle = L.circle(center, {
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.2,
                        radius: radius
                    }).addTo(mapInstanceRef.current);
                    circlesRef.current.push(circle);
                }

                // Add all existing geofences
                geofences.forEach((gf) => {
                    const marker = L.marker([gf.centerLat, gf.centerLng]).addTo(mapInstanceRef.current);
                    marker.bindPopup(`
                        <div>
                            <b>${gf.nom}</b><br/>
                            Rayon: ${gf.radiusMeters}m<br/>
                            ${gf.isActive ? '<span style="color: green;">✓ Actif</span>' : '<span style="color: gray;">○ Inactif</span>'}
                        </div>
                    `);
                    markersRef.current.push(marker);

                    const circle = L.circle([gf.centerLat, gf.centerLng], {
                        color: gf.isActive ? '#10b981' : '#9ca3af',
                        fillColor: gf.isActive ? '#10b981' : '#9ca3af',
                        fillOpacity: 0.15,
                        radius: gf.radiusMeters
                    }).addTo(mapInstanceRef.current);
                    circlesRef.current.push(circle);
                });
            }
        });

        // Cleanup
        return () => {
            if (mapInstanceRef.current) {
                // Leaflet map cleanup is handled by useEffect dependencies or manual removal
            }
        };
    }, [center, radius, geofences, onMapClick, userLocation]);

    return (
        <>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
            <div
                ref={mapRef}
                className="w-full h-[500px] rounded-2xl border-2 border-slate-200 overflow-hidden"
                style={{ zIndex: 1 }}
            />
        </>
    );
}
