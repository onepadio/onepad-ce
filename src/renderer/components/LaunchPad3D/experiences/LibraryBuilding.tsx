import { useMemo } from "react";
import { Cloud, Clouds, Sky } from "@react-three/drei";
import * as THREE from "three";

import { useLibraryMaterials } from "./LibrarySurfaces";

const FLOOR_Y = -2.8;
const WALL_H = 7.4;

type WindowSpec = { cx: number; cy: number; w: number; h: number };

function makeWallWithWindows(
  wallW: number,
  wallH: number,
  thickness: number,
  windows: WindowSpec[]
) {
  const shape = new THREE.Shape();
  const hw = wallW / 2;
  const hh = wallH / 2;
  shape.moveTo(-hw, -hh);
  shape.lineTo(hw, -hh);
  shape.lineTo(hw, hh);
  shape.lineTo(-hw, hh);
  shape.closePath();

  for (const win of windows) {
    const hole = new THREE.Path();
    const x0 = win.cx - win.w / 2;
    const y0 = win.cy - win.h / 2;
    hole.moveTo(x0, y0);
    hole.lineTo(x0 + win.w, y0);
    hole.lineTo(x0 + win.w, y0 + win.h);
    hole.lineTo(x0, y0 + win.h);
    hole.closePath();
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geo.translate(0, 0, -thickness / 2);
  return geo;
}

/** Evenly spaced tall library windows along a wall local-X axis. */
function makeWindowRow(
  wallW: number,
  count: number,
  winW = 2.35,
  winH = 3.15,
  cy = 0.55
): WindowSpec[] {
  const margin = 2.2;
  const usable = wallW - margin * 2;
  if (count < 1 || usable < winW) return [];
  const step = usable / count;
  const specs: WindowSpec[] = [];
  for (let i = 0; i < count; i++) {
    const cx = -wallW / 2 + margin + step * (i + 0.5);
    specs.push({ cx, cy, w: winW, h: winH });
  }
  return specs;
}

function WindowFrame({
  cx,
  cy,
  w,
  h,
  frameMat,
  glassMat,
}: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  frameMat: THREE.Material;
  glassMat: THREE.Material;
}) {
  const t = 0.08;
  return (
    <group position={[cx, cy, 0]}>
      <mesh position={[0, h / 2 + t / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[w + t * 2, t, 0.14]} />
      </mesh>
      <mesh position={[0, -h / 2 - t / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[w + t * 2, t, 0.14]} />
      </mesh>
      <mesh position={[-w / 2 - t / 2, 0, 0]} material={frameMat} castShadow>
        <boxGeometry args={[t, h, 0.14]} />
      </mesh>
      <mesh position={[w / 2 + t / 2, 0, 0]} material={frameMat} castShadow>
        <boxGeometry args={[t, h, 0.14]} />
      </mesh>
      <mesh position={[0, 0, 0.02]} material={frameMat}>
        <boxGeometry args={[0.05, h, 0.08]} />
      </mesh>
      <mesh position={[0, 0, 0.02]} material={frameMat}>
        <boxGeometry args={[w, 0.05, 0.08]} />
      </mesh>
      <mesh position={[0, 0, -0.02]} material={glassMat}>
        <planeGeometry args={[w * 0.98, h * 0.98]} />
      </mesh>
    </group>
  );
}

/**
 * Full library building envelope that wraps the desk ring + hall aisle.
 * Desk sits at world origin; walls extend past it so the seat is indoors.
 */
export default function LibraryBuilding({
  clearR,
  aisleZ0,
}: {
  clearR: number;
  aisleZ0: number;
}) {
  const { floorMat, wallMat, beamMat } = useLibraryMaterials();

  // Envelope sized so the circular desk + monitor ring are inside the room
  const frontZ = -clearR - 3.2;
  const rearZ = aisleZ0 + 12.5;
  const sideX = clearR + 2.4;
  const depth = rearZ - frontZ;
  const width = sideX * 2;
  const midZ = (frontZ + rearZ) * 0.5;
  const wallY = FLOOR_Y + WALL_H / 2;

  const sideWindows = useMemo(
    () => makeWindowRow(depth, 7, 2.3, 3.2, 0.55),
    [depth]
  );
  const rearWindows = useMemo(
    () => makeWindowRow(width - 2, 5, 2.5, 3.0, 0.5),
    [width]
  );

  const sideWallGeo = useMemo(
    () => makeWallWithWindows(depth, WALL_H, 0.4, sideWindows),
    [depth, sideWindows]
  );
  const rearWallGeo = useMemo(
    () => makeWallWithWindows(width, WALL_H, 0.42, rearWindows),
    [width, rearWindows]
  );

  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a281c",
        roughness: 0.85,
        metalness: 0.04,
      }),
    []
  );
  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#c8dce8",
        transmission: 0.5,
        transparent: true,
        opacity: 0.32,
        roughness: 0.18,
        metalness: 0,
        thickness: 0.04,
        ior: 1.4,
        side: THREE.DoubleSide,
      }),
    []
  );

  const beamZs = useMemo(() => {
    const zs: number[] = [];
    for (let z = frontZ + 2; z < rearZ - 1; z += 4) zs.push(z);
    return zs;
  }, [frontZ, rearZ]);

  return (
    <group>
      <Sky
        sunPosition={[55, 30, -25]}
        turbidity={3.2}
        rayleigh={1.3}
        mieCoefficient={0.004}
        mieDirectionalG={0.8}
        inclination={0.49}
        azimuth={0.2}
      />
      <Clouds material={THREE.MeshLambertMaterial} limit={20} range={56}>
        <Cloud
          seed={1}
          position={[-sideX - 12, FLOOR_Y + 11, midZ - 6]}
          scale={2.4}
          volume={7}
          color="#f4f0ea"
          fade={30}
          speed={0.1}
        />
        <Cloud
          seed={2}
          position={[sideX + 14, FLOOR_Y + 13, midZ + 4]}
          scale={3}
          volume={9}
          color="#efe8dc"
          fade={34}
          speed={0.08}
        />
        <Cloud
          seed={3}
          position={[0, FLOOR_Y + 15, rearZ + 18]}
          scale={3.4}
          volume={11}
          color="#f7f2ea"
          fade={42}
          speed={0.09}
        />
        <Cloud
          seed={4}
          position={[-8, FLOOR_Y + 10, frontZ - 10]}
          scale={2.2}
          volume={6}
          color="#ebe4d8"
          fade={28}
          speed={0.12}
        />
      </Clouds>

      {/* Exterior ground around the building */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y - 0.35, midZ]}
        receiveShadow
      >
        <planeGeometry args={[width + 50, depth + 40]} />
        <meshStandardMaterial color="#4a5a3a" roughness={0.95} />
      </mesh>

      {/* Full interior floor — desk is on this plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y + 0.004, midZ]}
        material={floorMat}
        receiveShadow
      >
        <planeGeometry args={[width - 0.6, depth - 0.6]} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y + 0.012, 0]}
        receiveShadow
      >
        <circleGeometry args={[Math.max(3.5, clearR - 2.2), 64]} />
        <meshStandardMaterial color="#5a2424" roughness={0.97} metalness={0} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y + 0.013, aisleZ0 + 4]}
        receiveShadow
      >
        <planeGeometry args={[2.1, Math.min(14, rearZ - aisleZ0)]} />
        <meshStandardMaterial color="#6b2a2a" roughness={0.97} metalness={0} />
      </mesh>

      {/* Rear wall */}
      <mesh
        geometry={rearWallGeo}
        position={[0, wallY, rearZ]}
        material={wallMat}
        receiveShadow
        castShadow
      />
      <group position={[0, wallY, rearZ]}>
        {rearWindows.map((w, i) => (
          <WindowFrame
            key={`rear-${i}`}
            {...w}
            frameMat={frameMat}
            glassMat={glassMat}
          />
        ))}
      </group>

      {/* Left wall — spans front→rear so the desk is indoors */}
      <mesh
        geometry={sideWallGeo}
        position={[-sideX, wallY, midZ]}
        rotation={[0, Math.PI / 2, 0]}
        material={wallMat}
        receiveShadow
        castShadow
      />
      <group position={[-sideX, wallY, midZ]} rotation={[0, Math.PI / 2, 0]}>
        {sideWindows.map((w, i) => (
          <WindowFrame
            key={`left-${i}`}
            {...w}
            frameMat={frameMat}
            glassMat={glassMat}
          />
        ))}
      </group>

      {/* Right wall */}
      <mesh
        geometry={sideWallGeo}
        position={[sideX, wallY, midZ]}
        rotation={[0, -Math.PI / 2, 0]}
        material={wallMat}
        receiveShadow
        castShadow
      />
      <group position={[sideX, wallY, midZ]} rotation={[0, -Math.PI / 2, 0]}>
        {sideWindows.map((w, i) => (
          <WindowFrame
            key={`right-${i}`}
            {...w}
            frameMat={frameMat}
            glassMat={glassMat}
          />
        ))}
      </group>

      {/* Front wall behind the monitor bank */}
      <mesh position={[0, wallY, frontZ]} material={wallMat} receiveShadow>
        <boxGeometry args={[width, WALL_H, 0.42]} />
      </mesh>

      {/* Wainscot on rear */}
      <mesh position={[0, FLOOR_Y + 0.7, rearZ - 0.15]} material={beamMat}>
        <boxGeometry args={[width - 0.5, 1.2, 0.18]} />
      </mesh>

      {/* Coffered ceiling over the entire room */}
      <mesh
        position={[0, FLOOR_Y + WALL_H - 0.12, midZ]}
        material={beamMat}
        receiveShadow
      >
        <boxGeometry args={[width - 0.2, 0.28, depth - 0.2]} />
      </mesh>
      {([-sideX * 0.55, -sideX * 0.18, sideX * 0.18, sideX * 0.55] as number[]).map(
        (x) => (
          <mesh
            key={`bx-${x}`}
            position={[x, FLOOR_Y + WALL_H - 0.35, midZ]}
            material={beamMat}
            castShadow
          >
            <boxGeometry args={[0.32, 0.38, depth - 1.5]} />
          </mesh>
        )
      )}
      {beamZs.map((z) => (
        <mesh
          key={`bz-${z}`}
          position={[0, FLOOR_Y + WALL_H - 0.35, z]}
          material={beamMat}
          castShadow
        >
          <boxGeometry args={[width - 1.5, 0.36, 0.32]} />
        </mesh>
      ))}

      {/* Columns along the aisle only (still indoors) */}
      {(
        [
          [-5.6, aisleZ0 + 1.4],
          [5.6, aisleZ0 + 1.4],
          [-5.6, aisleZ0 + 6.8],
          [5.6, aisleZ0 + 6.8],
        ] as [number, number][]
      ).map(([x, z]) => (
        <group key={`col-${x}-${z}`} position={[x, FLOOR_Y, z]}>
          <mesh position={[0, 3.15, 0]} material={beamMat} castShadow>
            <cylinderGeometry args={[0.3, 0.34, 6.3, 16]} />
          </mesh>
          <mesh position={[0, 6.25, 0]} material={beamMat}>
            <boxGeometry args={[0.8, 0.24, 0.8]} />
          </mesh>
          <mesh position={[0, 0.12, 0]} material={beamMat}>
            <cylinderGeometry args={[0.42, 0.46, 0.24, 16]} />
          </mesh>
        </group>
      ))}

      <directionalLight
        position={[-sideX - 16, 18, midZ]}
        intensity={1.05}
        color="#fff1d0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={55}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.00025}
      />
    </group>
  );
}
