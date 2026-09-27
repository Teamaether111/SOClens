import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface CSEDataNode {
  id: string;
  code: string;
  name: string;
  attentionScore: number;
  priority: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  findingsCount: number;
  sector: string;
}

interface Network3DProps {
  cses: CSEDataNode[];
  onSelectCSE?: (cseId: string) => void;
}

export const Network3D: React.FC<Network3DProps> = ({ cses, onSelectCSE }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<CSEDataNode | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070d18, 0.0035);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 50, 160);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00f0ff, 2, 300);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    // Central Supervisory Node (NCIIPC Core Hub)
    const centralGeo = new THREE.IcosahedronGeometry(8, 2);
    const centralMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x007799,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true
    });
    const centralNode = new THREE.Mesh(centralGeo, centralMat);
    scene.add(centralNode);

    // Orbital rings
    const ringGeo = new THREE.RingGeometry(55, 55.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.RingGeometry(95, 95.5, 64), ringMat);
    ring2.rotation.x = Math.PI / 2;
    scene.add(ring2);

    // CSE Nodes
    const nodeMeshes: { mesh: THREE.Mesh; data: CSEDataNode }[] = [];
    const linesGroup = new THREE.Group();
    scene.add(linesGroup);

    const getColorForTier = (tier: string) => {
      switch (tier) {
        case 'CRITICAL': return 0xef4444; // Red
        case 'HIGH': return 0xf59e0b; // Amber
        case 'MODERATE': return 0xeab308; // Yellow
        case 'LOW':
        default: return 0x10b981; // Emerald
      }
    };

    const count = cses.length || 20;
    cses.forEach((cse, i) => {
      // 2 concentric orbits based on criticality/index
      const radius = i % 2 === 0 ? 55 : 95;
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.sin(i * 1.5) * 15);

      // Node size scaled by Attention Score (0 - 100)
      const nodeRadius = 2.2 + ((cse.attentionScore || 30) / 100) * 3.5;
      const nodeGeo = new THREE.SphereGeometry(nodeRadius, 16, 16);
      const color = getColorForTier(cse.priority);

      const nodeMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.5
      });

      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      nodeMeshes.push({ mesh, data: cse });

      // Connection beam to central supervisory hub
      const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: cse.priority === 'CRITICAL' ? 0xef4444 : 0x1e3a5f,
        transparent: true,
        opacity: cse.priority === 'CRITICAL' ? 0.7 : 0.25
      });
      const line = new THREE.Line(lineGeo, lineMat);
      linesGroup.add(line);
    });

    // Raycasting for Hover & Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      setMousePos({ x: event.clientX - rect.left, y: event.clientY - rect.top });

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map(n => n.mesh));

      if (intersects.length > 0) {
        const found = nodeMeshes.find(n => n.mesh === intersects[0].object);
        if (found) {
          setHoveredNode(found.data);
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredNode(null);
      container.style.cursor = 'grab';
    };

    const onClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes.map(n => n.mesh));

      if (intersects.length > 0) {
        const found = nodeMeshes.find(n => n.mesh === intersects[0].object);
        if (found && onSelectCSE) {
          onSelectCSE(found.data.id);
        }
      }
    };

    // Orbit controls / drag rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotationVelocityX = 0.0015;
    let rotationVelocityY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWindowMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      scene.rotation.y += deltaX * 0.005;
      scene.rotation.x += deltaY * 0.005;
    };

    const onWheel = (e: WheelEvent) => {
      camera.position.z = Math.max(70, Math.min(260, camera.position.z + e.deltaY * 0.1));
      e.preventDefault();
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('click', onClick);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onWindowMouseMove);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Idle auto-rotation if not dragging
      if (!isDragging) {
        scene.rotation.y += rotationVelocityX;
      }

      centralNode.rotation.y += 0.01;
      centralNode.rotation.x += 0.005;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('click', onClick);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onWindowMouseMove);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cses]);

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-950/70 rounded-lg border border-slate-800/80 overflow-hidden">
      <div ref={mountRef} className="w-full h-full min-h-[380px]" />

      {/* Overlay Header */}
      <div className="absolute top-3 left-4 pointer-events-none">
        <div className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Interactive 3D Supervisory Network
        </div>
        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
          Central Node: NCIIPC Hub | Orbiting: 20 Critical Sector Entities | Node Scale = Attention Score
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="absolute bottom-3 left-4 pointer-events-none flex items-center gap-4 text-[10px] font-mono bg-slate-900/90 px-3 py-1.5 rounded border border-slate-800">
        <span className="text-slate-400">Drag to Rotate • Scroll to Zoom • Click Node to Open Assessment</span>
        <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
          <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
          <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500" /> High</span>
          <span className="flex items-center gap-1 text-yellow-400"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Moderate</span>
          <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Low</span>
        </div>
      </div>

      {/* Hover Card */}
      {hoveredNode && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/95 border border-cyan-500/50 rounded p-3 shadow-xl backdrop-blur max-w-xs transition-opacity duration-150"
          style={{
            left: Math.min(mousePos.x + 15, (mountRef.current?.clientWidth || 600) - 220),
            top: Math.max(10, mousePos.y - 40)
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs font-bold text-cyan-300">{hoveredNode.code}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              hoveredNode.priority === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
              hoveredNode.priority === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
              'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {hoveredNode.priority}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-100 mt-1 line-clamp-1">{hoveredNode.name}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-800 pt-2 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px]">ATTENTION SCORE</span>
              <span className="font-bold text-cyan-400">{hoveredNode.attentionScore} / 100</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ACTIVE FINDINGS</span>
              <span className="font-bold text-amber-400">{hoveredNode.findingsCount} signals</span>
            </div>
          </div>
          <div className="mt-1 text-[10px] text-cyan-400/80 font-mono text-center">Click to open deep-dive</div>
        </div>
      )}
    </div>
  );
};
