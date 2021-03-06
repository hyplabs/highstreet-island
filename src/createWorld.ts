import {
  BoxBufferGeometry,
  CatmullRomCurve3,
  Clock,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Scene,
  sRGBEncoding,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { degToRad } from 'three/src/math/MathUtils';
import { entityExtractors } from './entityExtractor';
import { Puppeteer } from './Puppeteer';
import { PathSegment, segmentedAnimation } from './segmentedAnimation';
import { LogoGradientMaterial } from './shaders/logo';
import { ProportionalController } from './physics/ProportionalController';
import { easeInOutCubic, easeOutQuadratic } from './util/easingFunctions';
import { linterp } from './util/linterp';

export type WorldConfig = {
  gltfPath: string;
};

export function CreateWorld(
  canvas: HTMLCanvasElement,
  parent: HTMLDivElement,
  config: WorldConfig
) {
  /*
  SETUP
   */
  const camera = new PerspectiveCamera();
  camera.rotateY(degToRad(-90)); // rotate camera to face island

  // resize renderer when viewport resized
  const onResize = () => {
    const w = parent.clientWidth;
    const h = parent.clientHeight;

    if (w === canvas.width && h === canvas.height) return;
    renderer.setSize(w, h);

    camera.aspect = w / h;
    camera.fov = 66;
    camera.position.set(-70, 20, 0);
    camera.updateProjectionMatrix();
  };

  //@ts-ignore for some reason ts complains ResizeObserver not found
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(parent);

  const scene = new Scene();

  // prewarm scene while mesh loading
  function prewarm() {
    let boxBufferGeometry = new BoxBufferGeometry();
    const standard = new Mesh(boxBufferGeometry, new MeshStandardMaterial());
    const logo = new Mesh(boxBufferGeometry, LogoGradientMaterial);
    standard.position.set(1000, 1000, 1000);
    logo.position.set(1000, 1000, 1000);
    scene.add(standard);
    scene.add(logo);
    renderer.compile(scene, camera);
    scene.remove(standard);
    scene.remove(logo);
  }

  const loader = new GLTFLoader();
  const puppeteer = new Puppeteer();
  (async () => {
    const gltf = await loader.loadAsync(config.gltfPath);
    scene.add(gltf.scene);

    const island = gltf.scene.getObjectByName('Island_v3');
    if (!island) throw new Error('Mesh not found');

    // rotate island to face camera
    island.rotateY(degToRad(180));
    const entities = entityExtractors(island);

    // use custom shader for logo
    entities.land.high.h1.obj.material = LogoGradientMaterial;
    entities.land.high.h2.obj.material = LogoGradientMaterial;
    entities.land.high.i.obj.material = LogoGradientMaterial;
    entities.land.high.i_block.obj.material = LogoGradientMaterial;
    entities.land.high.g.obj.material = LogoGradientMaterial;

    /*
    CLOUDS
     */
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

    /*
    LOGO
     */
    const gradientAnimation = (() => {
      return {
        update: (_: number, elapsed: number) => {
          LogoGradientMaterial.userData.heightOffset.value =
            0.2 * Math.sin(elapsed * 0.7) + 0.05;
        },
      };
    })();
    puppeteer.addAnimation(gradientAnimation);

    /*
    LAND
     */
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

    /*
    ROCKET
     */
    const rocket = entities.rocket.obj;
    function initRocket() {
      rocket.rotation.set(0, 0, 0);
      rocket.scale.setScalar(0.75);
      rocket.position.set(20, 1, -17);
    }
    initRocket();

    const moon = entities.moon.obj;

    moon.position.x = -80;
    moon.position.z -= 10;
    moon.position.y += 10;

    moon.scale.setScalar(1.5);

    const points = [
      new Vector3(20, 1, -17),
      new Vector3(18, 20, -10),
      new Vector3(-20, 25, 15),
      new Vector3(0, 80, 20),
      new Vector3(-60, 66, -13),
      new Vector3(-80, 45, -25),
    ];

    const curve = new CatmullRomCurve3(points);

    // UNCOMMENT TO VISUALIZE CURVE
    // const geometry = new BufferGeometry().setFromPoints(curve.getPoints(50));
    // const material = new LineBasicMaterial({ color: 0xff0000 });
    // const curveObject = new Line(geometry, material);
    // island.add(curveObject);

    const rocketSegments: PathSegment[] = [
      {
        //idle
        startTime: 0,
        update: () => {
          rocket.position.set(points[0].x, points[0].y, points[0].z);
          rocket.rotation.set(0, 0, 0);
        },
      },
      {
        //launch trajectory
        startTime: 1,
        update: progress => {
          curve.getPointAt(progress, rocket.position);
          const tan = curve.getTangentAt(progress);
          rocket.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), tan);
        },
      },
      {
        //reorient for entry
        startTime: 3,
        update: (() => {
          let initialX = 0;
          let initialRotation = new Quaternion();

          return (progress: number, isStart: boolean) => {
            if (isStart) {
              initialX = rocket.position.x;
              initialRotation.copy(rocket.quaternion);
            }

            const moonToRocket = moon.position
              .clone()
              .sub(rocket.position)
              .normalize();
            const tangentDir = moonToRocket.cross(new Vector3(1, 0, 0));
            const quatToAlign = new Quaternion().setFromUnitVectors(
              new Vector3(0, 1, 0),
              tangentDir
            );

            rocket.position.x = linterp(initialX, -80, progress);
            rocket.quaternion.copy(
              initialRotation.clone().slerp(quatToAlign, progress)
            );
          };
        })(),
      },
      {
        //revolve around moon
        startTime: 3.2,
        update: (() => {
          let initialAngle = 0;
          let radius = 0;
          let totalAngularDistance = 0;

          return (progress: number, isStart: boolean) => {
            if (isStart) {
              const D = rocket.position.clone().sub(moon.position);
              radius = D.length();
              initialAngle = Math.atan2(D.y, D.z);
              totalAngularDistance = -3 * Math.PI + initialAngle;
            }

            const angle = progress * totalAngularDistance + initialAngle;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);
            rocket.position.y = moon.position.y + dy * radius;
            rocket.position.z = moon.position.z + dx * radius;
            const tangentDir = new Vector3(0, dy, dx).cross(
              new Vector3(-1, 0, 0)
            );
            rocket.quaternion.setFromUnitVectors(
              new Vector3(0, 1, 0),
              tangentDir
            );
          };
        })(),
      },
      {
        //stop
        startTime: 4.5,
        update: (() => {
          const initialRocketPosition = new Vector3();
          const initialRocketRotation = new Quaternion();
          return (progress: number, isStart: boolean) => {
            if (isStart) {
              initialRocketPosition.copy(rocket.position);
              initialRocketRotation.copy(rocket.quaternion);
            }

            const moonToRocket = moon.position
              .clone()
              .sub(rocket.position)
              .normalize();

            const quatToAlign = new Quaternion().setFromUnitVectors(
              new Vector3(0, -1, 0),
              moonToRocket
            );

            const fastProgress = easeOutQuadratic(progress);

            rocket.quaternion.copy(
              initialRocketRotation
                .clone()
                .slerp(quatToAlign, Math.min(fastProgress * 2, 1))
            );

            rocket.position.copy(
              initialRocketPosition
                .clone()
                .add(
                  moonToRocket.multiplyScalar(
                    easeOutQuadratic(fastProgress) * 10
                  )
                )
            );
          };
        })(),
      },
      {
        startTime: 6,
        update: () => {},
      },
      {
        //stop
        startTime: 7,
        update: (() => {
          let initialRocketPosition = new Vector3();
          return (progress: number, isStart: boolean) => {
            if (isStart) {
              initialRocketPosition.copy(rocket.position);
            }

            const forward = new Vector3(0, 1, 0).applyQuaternion(
              rocket.quaternion
            );
            rocket.position.copy(
              initialRocketPosition
                .clone()
                .add(forward.multiplyScalar(easeOutQuadratic(progress) * 50))
            );
          };
        })(),
      },
      {
        //stop
        startTime: 7.5,
        update: progress => {
          rocket.position.set(points[0].x, points[0].y, points[0].z);
          rocket.rotation.set(0, 0, 0);
          rocket.scale.setScalar(progress * 0.75);
        },
      },
      {
        //stop
        startTime: 8,
        update: () => {},
      },
    ];
    const segmentedRocketAnimation = segmentedAnimation(rocketSegments);
    const rocketAnimation = (() => {
      let elapsedTime = 0;
      return {
        update: (dt: number) => {
          segmentedRocketAnimation(elapsedTime);
          elapsedTime += Math.min(dt, 0.033); //throttle dt
        },
      };
    })();

    setTimeout(() => {
      puppeteer.addAnimation(rocketAnimation);
    }, 500);

    /*
    DUCK
     */
    const duckBlock = entities.land.high.i_block.obj;
    const duck = entities.land.duck.obj;
    const duckFomo = entities.land.duckClicked.obj;
    const emblem = entities.land.duckEmblem.obj;

    duckFomo.visible = false;
    const duckMaterial = emblem.material as MeshStandardMaterial;
    duckMaterial.alphaTest = 0.01;
    duckMaterial.transparent = true;
    const customDuckEmblemMaterial = (emblem.material as MeshStandardMaterial).clone();
    emblem.material = customDuckEmblemMaterial;
    duck.position.x -= 1;

    const emblemAnimation = (() => {
      return {
        update: (_: number, elapsedTime: number) => {
          customDuckEmblemMaterial.opacity =
            0.3 + 0.2 * Math.abs(Math.sin(elapsedTime * 3));
        },
      };
    })();
    puppeteer.addAnimation(emblemAnimation);

    const duckYbias = duck.position.y;
    const duckBlockYbias = duckBlock.position.y;
    const duckSegments: PathSegment[] = [
      {
        //bouncy block
        startTime: 0,
        update: progress => {
          duck.visible = false;
          duckBlock.position.y =
            duckBlockYbias + 1.5 * Math.sin(Math.PI * progress);
        },
      },
      {
        //duck appears
        startTime: 0.5,
        update: (progress, isStart) => {
          if (isStart) {
            puppeteer.removeAnimation(emblemAnimation);
          }
          duck.visible = true;
          duck.position.y = duckYbias + progress * 4;
          duck.scale.setScalar(1 + progress * progress * 1.7); // ease in scale
          customDuckEmblemMaterial.opacity = 0.3 * (1 - progress);

          duckFomo.position.copy(duck.position);
          duckFomo.scale.copy(duck.scale);
        },
      },
      {
        //wait
        startTime: 2,
        update: _ => {},
      },
      {
        //stop
        startTime: 3,
        update: _ => {},
      },
    ];
    const duckAnimationDuration =
      duckSegments[duckSegments.length - 1].startTime;
    const segmentedDuckAnimation = segmentedAnimation(duckSegments);
    const duckAnimation = (() => {
      let elaspsedTime = 0;
      return {
        update: (dt: number) => {
          segmentedDuckAnimation(elaspsedTime);
          elaspsedTime += dt;
          if (elaspsedTime > duckAnimationDuration) {
            //play animation once
            puppeteer.removeAnimation(duckAnimation);
          }
        },
      };
    })();

    const raycaster = new Raycaster();
    const mouse = new Vector2();

    // configure raycster
    raycaster.layers.enableAll();
    raycaster.layers.disableAll();
    raycaster.layers.enable(1);
    duckBlock.layers.enable(1);
    duck.layers.enable(1);

    //click block/duck
    let duckClicked = false;
    canvas.addEventListener('mousedown', e => {
      const rect = canvas.getBoundingClientRect();
      const dx = e.clientX - rect.left;
      const dy = e.clientY - rect.top;

      const screenX = dx / rect.width;
      const screenY = dy / rect.height;

      mouse.x = screenX * 2 - 1;
      mouse.y = -(screenY * 2 - 1);
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects[0]?.object === entities.land.high.i_block.obj) {
        if (duckClicked) return;
        duckClicked = true;

        puppeteer.addAnimation(duckAnimation);
      } else if (intersects[0]?.object === duck) {
        duck.visible = false;
        duckFomo.visible = !duck.visible;
      }
    });

    document.addEventListener('mouseup', () => {
      duck.visible = true;
      duckFomo.visible = !duck.visible;
    });

    /*
    GIFT
     */

    //recenter pivot to be at the balloons
    const parentToGift = entities.floatingGift.highstreet.obj.matrix
      .clone()
      .invert();
    entities.floatingGift.obj.children.forEach(child => {
      child.applyMatrix4(parentToGift);
    });

    // shift balloon right ward so it's closer
    entities.floatingGift.obj.position.z -= 5;

    const balloonController = new ProportionalController(3, 10, 0);

    const giftAnimation = (() => {
      // rocking island animation
      const rx_bias = entities.floatingGift.obj.rotation.x;
      const y_bias = entities.floatingGift.obj.position.y;
      return {
        update: (dt: number, elapsed: number) => {
          balloonController.step(dt);

          //slowly vary intensity of wind
          const intensity = Math.cos(0.25 * elapsed);

          //oscillate roughly sinusoidal
          balloonController.setDesired(
            degToRad(intensity * 15) *
              (Math.sin(0.5 * elapsed) +
                0.3 * Math.sin(elapsed) +
                0.1 * Math.sin(2 * elapsed))
          );
          entities.floatingGift.obj.rotation.x =
            rx_bias + balloonController.step(dt);
          entities.floatingGift.obj.position.y =
            y_bias + intensity * 2 * Math.sin(elapsed);
        },
      };
    })();
    puppeteer.addAnimation(giftAnimation);

    /*
    ISLAND FADE IN
     */

    const fadeIn = (() => {
      const fadeInTime = 1.3;
      let elapsed = 0;
      const origPosition = island.position.x;
      const origScale = island.scale.x;

      return {
        update(dt: number) {
          const progress = Math.min(elapsed / fadeInTime, 1);
          // const progress = elapsed/fadeInTime;

          const ratio = easeInOutCubic(progress);
          island.position.x = (1 - ratio) * 200 + ratio * origPosition;
          island.scale.setScalar((1 - ratio) * 0.4 + ratio * origScale);
          if (progress === 1) {
            //done
            puppeteer.removeAnimation(fadeIn);
          }

          elapsed += dt;
        },
      };
    })();
    puppeteer.addAnimation(fadeIn);
  })();

  /*
  RENDERER SETUP
   */

  const renderer = new WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0); // the default
  renderer.outputEncoding = sRGBEncoding;
  renderer.gammaFactor = 2.2;

  /*
  LIGHTING
   */

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

  /*
  RENDER LOOP
   */

  const clock = new Clock();
  let frameHandle = 0;
  const animate = function() {
    frameHandle = requestAnimationFrame(animate);
    puppeteer.render(clock.getDelta(), clock.getElapsedTime());
    renderer.render(scene, camera);
  };
  animate();
  prewarm();

  // cleanup function
  return () => {
    cancelAnimationFrame(frameHandle);
    resizeObserver.disconnect();
  };
}
