"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// Color mappings based on tailwind colors
const COLORS = {
  Available: "#10b981", // Emerald 500
  Occupied: "#f43f5e", // Rose 500
  Maintenance: "#f59e0b", // Amber 500
};

function RoomCube({ position, room, index, activeRoom, setActiveRoom }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isActive = activeRoom === room.roomNumber;
  const color = COLORS[room.status as keyof typeof COLORS] || "#94a3b8";

  // Gentle floating animation offset by index
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2 + index) * 0.05;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setActiveRoom(room.roomNumber); }}
        onPointerOut={() => setActiveRoom(null)}
        onClick={(e) => { e.stopPropagation(); setActiveRoom(isActive ? null : room.roomNumber); }}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isActive ? 1 : 0.85}
          roughness={0.2}
          metalness={0.7}
          emissive={color}
          emissiveIntensity={isActive ? 0.6 : 0.2}
        />
      </mesh>

      {/* Hover Info Card (HTML Overlay) */}
      {isActive && (
        <Html position={[0, 1, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-slate-900/90 text-white p-3 rounded-xl shadow-2xl backdrop-blur-md min-w-[140px] text-center border border-white/10 pointer-events-none transform -translate-y-2">
            <h3 className="font-black text-xl">{room.roomNumber}</h3>
            <p
              className="text-xs uppercase tracking-widest font-bold mt-1"
              style={{ color }}
            >
              {room.status}
            </p>
            {room.currentGuestName && (
              <div className="mt-3 pt-2 border-t border-white/10">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Guest
                </p>
                <p className="text-sm font-semibold text-slate-100">
                  {room.currentGuestName}
                </p>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export function Rooms3D() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/rooms");
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (err) {
        console.error("Failed to fetch rooms for 3D view");
      }
    };
    fetchRooms();
  }, []);

  if (!mounted)
    return (
      <div className="w-full h-[450px] bg-slate-900 rounded-3xl animate-pulse" />
    );

  // Calculate grid layout sizes
  const count = rooms.length || 1;
  const columns = Math.ceil(Math.sqrt(count));
  const spacing = 1.8; // Gap between rooms

  return (
    <div className="w-full h-[450px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20 relative group border-4 border-slate-800">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 text-white right-4">
        <h2 className="font-black text-xl sm:text-2xl drop-shadow-md tracking-tight">
          Live 3D Hotel Rooms
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          Drag to rotate • Scroll to zoom • Tap/Hover for details
        </p>
      </div>

      {/* Status Legend */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-4 sm:right-auto z-10 flex flex-wrap gap-2 sm:gap-4">
        {Object.entries(COLORS).map(([status, color]) => (
          <div
            key={status}
            className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
            />
            <span className="text-[10px] text-white font-bold uppercase tracking-widest">
              {status}
            </span>
          </div>
        ))}
      </div>

      <Canvas 
        camera={{ position: [5, 6, 8], fov: 40 }} 
        shadows
        onPointerMissed={() => setActiveRoom(null)}
      >
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 15, 10]} intensity={1.5} castShadow />
        <directionalLight
          position={[-5, 5, -5]}
          intensity={0.5}
          color="#818cf8"
        />
        <directionalLight
          position={[5, -5, 5]}
          intensity={0.2}
          color="#f472b6"
        />

        <OrbitControls
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.6}
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going below the floor
          minDistance={4}
          maxDistance={15}
        />

        {/* Center the grid */}
        <group
          position={[
            -(columns * spacing) / 2 + spacing / 2,
            0,
            -(Math.ceil(count / columns) * spacing) / 2 + spacing / 2,
          ]}
        >
          {rooms.map((room, i) => {
            const x = (i % columns) * spacing;
            const z = Math.floor(i / columns) * spacing;
            return (
              <RoomCube
                key={room._id || i}
                room={room}
                index={i}
                position={[x, 0, z]}
                activeRoom={activeRoom}
                setActiveRoom={setActiveRoom}
              />
            );
          })}
        </group>

        {/* High-tech grid floor */}
        <gridHelper
          args={[30, 30, "#334155", "#0f172a"]}
          position={[0, -0.6, 0]}
        />
      </Canvas>
    </div>
  );
}
