import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconRetinaUrl: iconRetina,
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const HandleIcon = L.divIcon({
  className: 'custom-handle-icon',
  html: `<div style="width: 14px; height: 14px; background-color: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.4); cursor: ew-resize;"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, radius, setRadius, disabled }) {
  const map = useMap();
  const handleRef = useRef(null);

  useMapEvents({
    click(e) {
      if (!disabled) {
        setPosition(e.latlng);
      }
    },
  });

  const handlePosition = useMemo(() => {
    if (!position || !radius || disabled) return null;
    const earthRadius = 6378137;
    const lat = position.lat;
    const lng = position.lng;
    const newLng = lng + (radius / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
    return { lat, lng: newLng };
  }, [position, radius, disabled]);

  const onHandleDrag = (e) => {
    const handleLatLng = e.target.getLatLng();
    const posLatLng = L.latLng(position.lat, position.lng);
    const newRadius = posLatLng.distanceTo(handleLatLng);
    setRadius(Math.round(newRadius));
  };

  if (disabled) return null;

  return position === null ? null : (
    <>
      <Marker position={position} />
      {radius > 0 && <Circle center={position} radius={radius} />}
      {handlePosition && (
        <Marker 
          position={handlePosition} 
          icon={HandleIcon} 
          draggable={true}
          eventHandlers={{ drag: onHandleDrag }}
          ref={handleRef}
        />
      )}
    </>
  );
}

function MapUpdater({ position, isManualEdit, polygonCoords, type }) {
  const map = useMap();
  useEffect(() => {
    if (type === "polygon" && polygonCoords && polygonCoords.length > 0 && isManualEdit) {
       const bounds = L.polygon(polygonCoords).getBounds();
       map.fitBounds(bounds, { padding: [20, 20], animate: true });
    } else if (type === "circle" && position && isManualEdit) {
      map.flyTo(position, map.getZoom(), { animate: true });
    }
  }, [position, map, isManualEdit, type, polygonCoords]);
  return null;
}

function GeomanControls({ onChangePolygon, polygonCoords, type }) {
  const map = useMap();
  const polygonLayerRef = useRef(null);

  const extractCoords = (layer) => {
    const latlngs = layer.getLatLngs()[0];
    return latlngs.map(ll => ({ lat: ll.lat, lng: ll.lng }));
  };

  useEffect(() => {
    if (type !== "polygon") {
      map.pm.removeControls();
      if (polygonLayerRef.current) {
        polygonLayerRef.current.remove();
        polygonLayerRef.current = null;
      }
      return;
    }

    map.pm.addControls({
      position: 'topright',
      drawCircle: false,
      drawMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircleMarker: false,
      drawText: false,
      drawPolygon: true,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true
    });

    // Clear existing and add saved
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
    }

    if (polygonCoords && polygonCoords.length > 0) {
      polygonLayerRef.current = L.polygon(polygonCoords).addTo(map);
      
      // Attach edit events to the loaded layer
      polygonLayerRef.current.on('pm:edit', (e) => {
        onChangePolygon(extractCoords(e.target));
      });
      polygonLayerRef.current.on('pm:dragend', (e) => {
        onChangePolygon(extractCoords(e.target));
      });
    }

    const onCreated = (e) => {
      if (e.shape === 'Polygon') {
        if (polygonLayerRef.current) {
          polygonLayerRef.current.remove();
        }
        polygonLayerRef.current = e.layer;
        onChangePolygon(extractCoords(e.layer));

        e.layer.on('pm:edit', (ev) => {
          onChangePolygon(extractCoords(ev.target));
        });
        e.layer.on('pm:dragend', (ev) => {
          onChangePolygon(extractCoords(ev.target));
        });
      }
    };

    const onRemove = (e) => {
      if (e.layer === polygonLayerRef.current) {
        polygonLayerRef.current = null;
        onChangePolygon([]);
      }
    };

    map.on('pm:create', onCreated);
    map.on('pm:remove', onRemove);

    return () => {
      map.pm.removeControls();
      map.off('pm:create', onCreated);
      map.off('pm:remove', onRemove);
      if (polygonLayerRef.current) {
        polygonLayerRef.current.remove();
      }
    };
  }, [map, type]); // Re-bind if type changes

  return null;
}

export default function LocationMapPicker({ 
  type = "circle", 
  latitude, 
  longitude, 
  radius, 
  polygonCoords = [], 
  onChangeLocation, 
  onChangeRadius,
  onChangePolygon 
}) {
  const [initialCenter] = useState({ lat: latitude || 28.6139, lng: longitude || 77.2090 });
  const position = latitude && longitude ? { lat: latitude, lng: longitude } : null;
  const [isManualEdit, setIsManualEdit] = useState(true);

  const handlePositionChange = (newPos) => {
    setIsManualEdit(false);
    onChangeLocation(newPos.lat, newPos.lng);
  };

  const handleRadiusChange = (newRadius) => {
    setIsManualEdit(false);
    onChangeRadius(newRadius);
  };

  useEffect(() => {
    setIsManualEdit(true);
  }, [latitude, longitude]);

  return (
    <div className="w-full h-[400px] rounded-[12px] overflow-hidden border border-border-card z-0 relative">
      <MapContainer 
        center={initialCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocationMarker 
          position={position} 
          setPosition={handlePositionChange} 
          radius={radius} 
          setRadius={handleRadiusChange}
          disabled={type !== "circle"}
        />

        <GeomanControls 
          type={type} 
          polygonCoords={polygonCoords} 
          onChangePolygon={onChangePolygon} 
        />

        <MapUpdater 
          position={position} 
          isManualEdit={isManualEdit} 
          type={type}
          polygonCoords={polygonCoords}
        />
      </MapContainer>
    </div>
  );
}

