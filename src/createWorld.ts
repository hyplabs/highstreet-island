import {
  BoxBufferGeometry,
  Clock,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Scene,
  sRGBEncoding,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { degToRad } from 'three/src/math/MathUtils';
import { entityExtractors } from './entityExtractor';
import { Puppeteer } from './Puppeteer';
import { LogoGradientMaterial } from './shaders/logo';
import { ProportionalController } from './physics/ProportionalController';

export type WorldConfig = {
  gltfPath: string;
};

export function CreateWorld(
  canvas: HTMLCanvasElement,
  parent: HTMLDivElement,
  config: WorldConfig
) {
  const camera = new PerspectiveCamera();
  //AXIS FOR OUR WORLD

  // X -> Inward toward island
  // Y -> Up
  // Z -> Right

  const onResize = () => {
    const w = parent.clientWidth;
    const h = parent.clientHeight;

    if (w === canvas.width && h === canvas.height) return;

    console.log('SETTING CANVAS SIZE:', w, h);
    //have renderer take full size of parent
    renderer.setSize(w, h);

    camera.aspect = w / h;
    camera.fov = 70;
    // camera.rotation.setFromVector3(new Vector3(-Math.PI, 0, -Math.PI))
    camera.position.set(-80, 25, 0);
    camera.rotateY(degToRad(-90));
    camera.updateProjectionMatrix();

    const projected = new Vector3(0, 0, 0.5).unproject(camera);
    console.log(projected.clone());
  };

  //@ts-ignore for some reason ts complains ResizeObserver not found
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(canvas);

  // camera.updateProjectionMatrix();

  // setInterval(() => {
  //   const projected = new Vector3(0, 0, 0.5).unproject(camera)
  //   console.log(projected.clone());
  // }, 1000);

  const scene = new Scene();
  const loader = new GLTFLoader();
  const puppeteer = new Puppeteer();
  (async () => {
    const gltf = await loader.loadAsync(config.gltfPath);
    console.log(gltf.scene);
    scene.add(gltf.scene);

    const island = gltf.scene.getObjectByName('Island_v2');
    if (!island) throw new Error('Mesh not found');
    island.rotateY(degToRad(180));

    const entities = entityExtractors(island);

    // use custom shader for logo
    const logo = entities.land.high.obj;
    logo.material = LogoGradientMaterial;

    const genCloudAnimation = (
      dz_min: number,
      dz_max: number,
      speed: number,
      mesh: Object3D
    ) => {
      const xBias = mesh.position.z;
      let elapsed = 0;
      return {
        update: (dt: number, _: number) => {
          const sine0to1 = (Math.sin(speed * elapsed - Math.PI / 2) + 1) / 2;
          const dx = dz_min + (dz_max - dz_min) * sine0to1;
          mesh.position.z = xBias + dx;
          elapsed += dt;
        },
      };
    };

    puppeteer.addAnimation(
      genCloudAnimation(0, -80, 0.07, entities.clouds.left.obj)
    );
    puppeteer.addAnimation(
      genCloudAnimation(0, 80, 0.03, entities.clouds.right.obj)
    );
    puppeteer.addAnimation(
      genCloudAnimation(20, -40, 0.1, entities.clouds.top.obj)
    );
    puppeteer.addAnimation(
      genCloudAnimation(-20, 40, 0.08, entities.clouds.middle.obj)
    );

    const gradientAnimation = (() => {
      return {
        update: (_: number, elapsed: number) => {
          LogoGradientMaterial.uniforms.heightOffset.value =
            0.2 * Math.sin(elapsed * 0.7) + 0.05;
        },
      };
    })();

    const islandAnimation = (() => {
      // rocking island animation
      const landObj = entities.land.obj;
      const yBias = landObj.position.y;
      const rx_bias = landObj.rotation.x;
      return {
        update: (_: number, elapsed: number) => {
          // multiply sin waves for more complex effect
          const ySignal =
            0.6 * Math.sin(0.9 * elapsed) * Math.sin(1.3 * elapsed);
          landObj.position.y = yBias + ySignal;
          landObj.rotation.x = rx_bias + degToRad(1) * Math.sin(0.5 * elapsed);
        },
      };
    })();
    puppeteer.addAnimation(islandAnimation);
    puppeteer.addAnimation(gradientAnimation);

    const rocket = entities.rocket.obj;

    //extract rocket out of scene

    rocket.parent = scene;

    rocket.rotation.set(0, 0, 0);

    const rocketX = new ProportionalController(50, 10, 0);
    const rocketY = new ProportionalController(50, 10, 0);
    const rocketZ = new ProportionalController(50, 10, 0);

    const align = new ProportionalController(100, 39, 0);
    const cacheProjectVec = new Vector3();

    parent.addEventListener('mousemove', e => {
      //
      const screenX = (e.pageX - parent.offsetLeft) / parent.clientWidth;
      const screenY = (e.pageY - parent.clientTop) / parent.clientHeight;
      //
      const ndc_x = screenX * 2 - 1;
      const ndc_y = -(screenY * 2 - 1);

      cacheProjectVec.set(ndc_x, ndc_y, 0.999).unproject(camera);
      rocketX.setDesired(cacheProjectVec.x);
      rocketY.setDesired(cacheProjectVec.y);
      rocketZ.setDesired(cacheProjectVec.z);
    });

    const rocketAnimation = (() => {
      // rocking island animation
      return {
        update: (dt: number) => {
          rocketX.step(dt);
          rocketY.step(dt);
          rocketZ.step(dt);
          rocket.position.set(
            rocketX.getCurrent(),
            rocketY.getCurrent(),
            rocketZ.getCurrent()
          );

          // const distanceToRocket = rocket.position.distanceTo(new Vector3(rocketX._desired, rocketY._desired, rocketZ._desired));
          //
          // if(Math.round(elapsed * 2) % 2 === 0){
          //   // console.log(distanceToRocket);
          // }

          // if(distanceToRocket > 30){
          //   // align.setDesired(1);
          //   const currentRocketQuaternion = rocket.quaternion.copy(rocketQuatCache);
          //   rocket.lookAt(rocketX._desired, rocketY._desired, rocketZ._desired);

          // const logit = 1/(1 + Math.pow(2, -(distanceToRocket- 1000)));

          // if(logit < 0.3) return;
          // rocket.quaternion.slerp(currentRocketQuaternion, 1 - logit);

          //
          // if(logit < 0.9){
          //   }

          // }
          // else if(distanceToRocket < 5){
          //   align.setDesired(0);
          // }
        },
      };
    })();

    puppeteer.addAnimation(rocketAnimation);
  })();

  const renderer = new WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0); // the default

  renderer.outputEncoding = sRGBEncoding;
  renderer.gammaFactor = 2.2;

  // scene.background = new Color(0xe4cece); // pink

  // Hemisphere light for subtle gradient
  scene.add(
    new HemisphereLight(
      new Color(0xb6daed), //sky blue,
      new Color(0xdfcb9b), //tan,
      1
    )
  );

  // Directional light
  const directionalLight = new DirectionalLight(
    new Color(0xffffff), // white
    1
  );

  directionalLight.position.set(-8, 29, -25);
  scene.add(directionalLight);

  // render loop
  const clock = new Clock();
  let frameHandle = 0;
  const animate = function() {
    frameHandle = requestAnimationFrame(animate);
    puppeteer.render(clock.getDelta(), clock.getElapsedTime());
    renderer.render(scene, camera);
  };
  animate();

  // cleanup function
  return () => {
    cancelAnimationFrame(frameHandle);
    resizeObserver.disconnect();
  };
}
