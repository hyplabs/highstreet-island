import { Mesh, Object3D } from 'three';

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
  const clouds = getObjectByName(root, 'Clouds');
  let gift = getObjectByName(root, 'Floating_Gift');
  return {
    land: {
      obj: land,
      high: {
        obj: getObjectByName(land, 'G001') as Mesh,
      },
    },
    clouds: {
      obj: clouds,
      left: {
        obj: getObjectByName(clouds, 'Clouds_01'),
      },
      right: {
        obj: getObjectByName(clouds, 'Clouds_04'),
      },
      middle: {
        obj: getObjectByName(clouds, 'Clouds_03'),
      },
      top: {
        obj: getObjectByName(clouds, 'Clouds_02'),
      },
    },
    rocket: {
      obj: getObjectByName(root, 'Rocket'),
    },
    floatingGift: {
      obj: gift,
      dia: {
        obj: getObjectByName(gift, 'Ballons_Dia'),
      },
      ethereum: {
        obj: getObjectByName(gift, 'Ballons_Ethereum'),
      },
      highstreet: {
        obj: getObjectByName(gift, 'Ballons_HighStreet'),
      },
      gift: {
        obj: getObjectByName(gift, 'Gift_D'),
      },
    },
    moon: {
      obj: getObjectByName(root, 'Moon002')
    }
  };
}
