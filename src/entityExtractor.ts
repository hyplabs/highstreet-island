import { Mesh, Object3D } from 'three';

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
  const gift = getObjectByName(root, 'Floating_Balloon');
  return {
    land: {
      obj: land,
      high: {
        h1: { obj: getObjectByName(land, 'H1') as Mesh },
        i: { obj: getObjectByName(land, 'I') as Mesh },
        i_block: { obj: getObjectByName(land, 'I_Block') as Mesh },
        g: { obj: getObjectByName(land, 'G') as Mesh },
        h2: { obj: getObjectByName(land, 'H2') as Mesh },
      },
      duckEmblem: {
        obj: getObjectByName(
          getObjectByName(land, 'I_Block'),
          'Duck_Emblem'
        ) as Mesh,
      },
      duck: {
        obj: getObjectByName(land, 'Duck_Icon') as Mesh,
      },
    },
    clouds: {
      left: {
        obj: getObjectByName(root, 'Clouds_01'),
      },
      right: {
        obj: getObjectByName(root, 'Clouds_04'),
      },
      middle: {
        obj: getObjectByName(root, 'Clouds_03'),
      },
      top: {
        obj: getObjectByName(root, 'Clouds_02'),
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
      obj: getObjectByName(root, 'Moon'),
    },
  };
}
