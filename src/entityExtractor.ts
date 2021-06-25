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
  const clouds = getObjectByName(root, 'Clouds');
  const gift = getObjectByName(root, 'Floating_Gift');
  return {
    land: {
      obj: land,
      high: {
        obj: getObjectByName(land, 'HighLogo') as Mesh,
      },
      duckBlock: {
        obj: getObjectByName(land, 'HighLogoDuckBlock') as Mesh,
        emblem: {
          obj: getObjectByName(land, 'HighLogoDuckBlock').getObjectByName('Emblem') as Mesh,
        }
      },
      duck: {
        obj: getObjectByName(land, 'Duck_Icon') as Mesh,
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
      obj: getObjectByName(root, 'Moon002'),
    },
  };
}
