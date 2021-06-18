import { Object3D } from 'three';

// enum MeshNodes {
//     ISLAND = "ISLAND",
//     LAND = "LAND"
// }
//
// interface MeshPath {
//     name: MeshNodes
//     children: MeshPath[]
// }
//
// interface ResolvedMeshes {
//     name: MeshNodes
//     children: Map<MeshNodes, Object3D>
// }
//
// const ISLAND_ROOT_MESH_PATH = {
//     name: MeshNodes.ISLAND,
//     children: [
//
//     ]
// }

function getObjectByName(root: Object3D, name: string) {
  const obj = root.getObjectByName(name);
  if (!obj) {
    console.error(`PARENT MESH:`, root);
    throw new Error(`MESH NOT FOUND: ${name}`);
  }
  return obj;
}

export function entityExtractors(root: Object3D) {
  const land = getObjectByName(root, 'Land');
  return {
    land: {
      obj: land,
    },
  };
}
