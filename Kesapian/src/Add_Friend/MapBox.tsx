import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
//import L from "leaflet";
import { useEffect, useState } from "react";

const MapBox = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setPosition([pos.coords.latitude, pos.coords.longitude]);
    });
  }, []);

  return position ? (
    <MapContainer center={position} zoom={15} style={{ height: "219px", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>Lokasi kamu</Popup>
      </Marker>
    </MapContainer>
  ) : (
    <div className="w-full h-[219px] bg-gray-300 flex items-center justify-center">Memuat peta...</div>
  );
};

export default MapBox;
