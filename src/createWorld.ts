import {
  Clock,
  Color,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { degToRad } from 'three/src/math/MathUtils';
import { entityExtractors } from './entityExtractor';
import { Puppeteer } from './Puppeteer';
import { LogoGradientMaterial } from './shaders/logo';

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
  };

  //@ts-ignore for some reason ts complains ResizeObserver not found
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(canvas);

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
  })();

  const renderer = new WebGLRenderer({
    canvas: canvas,
    antialias: true,
  });

  renderer.outputEncoding = sRGBEncoding;
  renderer.gammaFactor = 2.2;

  scene.background = new Color(0xe4cece); // pink

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
