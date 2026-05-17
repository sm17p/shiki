import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ImageLoader, type MediaItem } from "tauri-plugin-media-api";

type HoneycombGalleryProps = {
  activePath: string;
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
};

type Tile = {
  item: MediaItem;
  mesh: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;
  outline: THREE.LineSegments<THREE.EdgesGeometry<THREE.ShapeGeometry>, THREE.LineBasicMaterial>;
  texture?: THREE.Texture;
};

const TILE_RADIUS = 1;
const TILE_STEP_X = TILE_RADIUS * 1.78;
const TILE_STEP_Y = TILE_RADIUS * 1.54;
const TILE_FALLBACK_COLORS = ["#7a83ff", "#facc00", "#ff4d50", "#00d696", "#0099ff", "#f2e3ff"];

function createHexGeometry() {
  const shape = new THREE.Shape();

  for (let i = 0; i < 6; i += 1) {
    const angle = Math.PI / 6 + (i * Math.PI) / 3;
    const x = Math.cos(angle) * TILE_RADIUS;
    const y = Math.sin(angle) * TILE_RADIUS;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  const positions = geometry.attributes.position;
  const uvs: number[] = [];

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    uvs.push((x / TILE_RADIUS + 1) / 2, (y / TILE_RADIUS + 1) / 2);
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  return geometry;
}

function layoutPosition(index: number, total: number) {
  const columns = Math.max(3, Math.ceil(Math.sqrt(total * 1.35)));
  const row = Math.floor(index / columns);
  const column = index % columns;
  const rows = Math.ceil(total / columns);
  const offsetX = row % 2 === 0 ? 0 : TILE_STEP_X / 2;

  return {
    x: (column - (columns - 1) / 2) * TILE_STEP_X + offsetX,
    y: ((rows - 1) / 2 - row) * TILE_STEP_Y,
  };
}

export function HoneycombGallery({ activePath, items, onSelect }: HoneycombGalleryProps) {
  const activePathRef = useRef(activePath);
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    activePathRef.current = activePath;
  }, [activePath]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#ffffff");

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const textureLoader = new THREE.TextureLoader();
    const tiles: Tile[] = [];
    const dragState = {
      active: false,
      moved: false,
      pointerId: 0,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    };

    const resize = () => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      const aspect = width / height;
      const frustumHeight = width < 520 ? 8.5 : 7;

      camera.left = (-frustumHeight * aspect) / 2;
      camera.right = (frustumHeight * aspect) / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const syncActiveState = () => {
      tiles.forEach((tile) => {
        const isActive = tile.item.path === activePathRef.current;
        tile.outline.material.color.set(isActive ? "#00d696" : "#000000");
        tile.outline.material.linewidth = isActive ? 3 : 1;
        tile.mesh.scale.setScalar(isActive ? 1.07 : 1);
      });
    };

    items.forEach((item, index) => {
      const geometry = createHexGeometry();
      const fallbackColor = new THREE.Color(
        TILE_FALLBACK_COLORS[index % TILE_FALLBACK_COLORS.length],
      );
      const material = new THREE.MeshBasicMaterial({
        color: fallbackColor,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const outline = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: "#000000" }),
      );
      const tile: Tile = { item, mesh, outline };
      const position = layoutPosition(index, items.length);

      mesh.position.set(position.x, position.y, 0);
      outline.position.copy(mesh.position);
      mesh.userData.index = index;
      group.add(mesh);
      group.add(outline);
      tiles.push(tile);

      textureLoader.load(
        ImageLoader.getThumbnailUrl(item.path),
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.needsUpdate = true;
          material.color.set("#ffffff");
          material.map = texture;
          material.needsUpdate = true;
          tile.texture = texture;
        },
        undefined,
        () => {
          material.map = null;
          material.color.copy(fallbackColor);
          material.needsUpdate = true;
        },
      );
    });

    syncActiveState();
    resize();

    const setPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragState.active = true;
      dragState.moved = false;
      dragState.pointerId = event.pointerId;
      dragState.startX = event.clientX;
      dragState.startY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragState.active) {
        return;
      }

      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;
      dragState.moved = dragState.moved || Math.abs(dx) + Math.abs(dy) > 8;
      dragState.offsetX += dx * 0.006;
      dragState.offsetY -= dy * 0.006;
      dragState.startX = event.clientX;
      dragState.startY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragState.active) {
        return;
      }

      dragState.active = false;
      renderer.domElement.releasePointerCapture(dragState.pointerId);

      if (dragState.moved) {
        return;
      }

      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const intersection = raycaster.intersectObjects(tiles.map((tile) => tile.mesh))[0];

      if (intersection) {
        const selected = tiles[intersection.object.userData.index]?.item;

        if (selected) {
          onSelectRef.current(selected);
        }
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.zoom = THREE.MathUtils.clamp(camera.zoom + event.deltaY * -0.001, 0.7, 1.8);
      camera.updateProjectionMatrix();
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", resize);

    let frameId = 0;
    const animate = (time: number) => {
      const driftX = Math.sin(time * 0.00022) * 0.85;
      const driftY = Math.cos(time * 0.00017) * 0.65;

      group.position.x = dragState.offsetX + driftX;
      group.position.y = dragState.offsetY + driftY;
      group.rotation.z = Math.sin(time * 0.00012) * 0.035;
      syncActiveState();
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      tiles.forEach((tile) => {
        tile.texture?.dispose();
        tile.mesh.geometry.dispose();
        tile.mesh.material.dispose();
        tile.outline.geometry.dispose();
        tile.outline.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [items]);

  return (
    <div ref={containerRef} className="h-[58vh] min-h-[420px] w-full overflow-hidden bg-white" />
  );
}

export default HoneycombGallery;
