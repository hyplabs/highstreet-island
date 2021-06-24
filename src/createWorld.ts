import {
  BoxBufferGeometry,
  // BufferGeometry,
  CatmullRomCurve3,
  Clock,
  Color,
  DirectionalLight,
  HemisphereLight,
  // Line,
  // LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Scene,
  sRGBEncoding,
  Vector3,
  // Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { degToRad } from 'three/src/math/MathUtils';
import { entityExtractors } from './entityExtractor';
import { Puppeteer } from './Puppeteer';
import { LogoGradientMaterial } from './shaders/logo';
import { ProportionalController } from './physics/ProportionalController';
import { easeInOutCubic, easeOutQuadratic } from './util/easingFunctions';
// import { throttleLog } from './util/throttleLog';

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
    camera.position.set(-80, 25, 0);
    camera.rotateY(degToRad(-90));
    camera.updateProjectionMatrix();
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

  // prewarm scene while mesh loading
  function prewarm() {
    let boxBufferGeometry = new BoxBufferGeometry();
    const standard = new Mesh(boxBufferGeometry, new MeshStandardMaterial());
    const logo = new Mesh(boxBufferGeometry, LogoGradientMaterial);

    standard.position.set(1000, 1000, 1000);
    logo.position.set(1000, 1000, 1000);
    scene.add(standard);
    scene.add(logo);
    console.log('PRECOMPILE SHADERS');
    renderer.compile(scene, camera);

    scene.remove(standard);
    scene.remove(logo);
  }

  const loader = new GLTFLoader();
  const puppeteer = new Puppeteer();
  (async () => {
    const gltf = await loader.loadAsync(config.gltfPath);
    scene.add(gltf.scene);

    const island = gltf.scene.getObjectByName('Island_v2');
    if (!island) throw new Error('Mesh not found');
    island.rotateY(degToRad(180));

    const entities = entityExtractors(island);

    // use custom shader for logo
    entities.land.high.obj.material = LogoGradientMaterial;
    entities.land.duckBlock.obj.material = LogoGradientMaterial;

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
          LogoGradientMaterial.userData.heightOffset.value =
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
    function initRocket() {
      rocket.rotation.set(0, 0, 0);
      rocket.scale.setScalar(0.75);
      rocket.position.set(20, 1, -17);
    }

    initRocket();

    interface PathSegment {
      startTime: number;
      update: (progress: number, isStart: boolean) => void;
    }

    function linterp(from: number, to: number, progress: number) {
      return (1 - progress) * from + to * progress;
    }

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
    // const geometry = new BufferGeometry().setFromPoints(curve.getPoints(50));

    // const material = new LineBasicMaterial({ color: 0xff0000 });

    // Create the final object to add to the scene
    // const curveObject = new Line(geometry, material);
    // island.add(curveObject);
    // island.add(rocket);

    const segments: PathSegment[] = [
      {
        //idle
        startTime: 0,
        update: () => {
          rocket.position.set(points[0].x, points[0].y, points[0].z);
          rocket.rotation.set(0, 0, 0);
        },
      },
      {
        //launch
        startTime: 1,
        update: progress => {
          curve.getPointAt(progress, rocket.position);
          const tan = curve.getTangentAt(progress);
          rocket.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), tan);
          // // const y = linterp(1, 50, progress * progress);
          // // const z = linterp(-22, -10, progress * progress);
          // // const x = linterp(2.25, -40, progress * progress);
          // // throttleLog(z);
          //
          // rocketY.setDesired(vec.x);
          // rocketZ.setDesired(vec.y);
          // rocketX.setDesired(vec.z);
        },
      },
      {
        startTime: 3,
        update: (() => {
          let initialX = 0;
          let initialRotation = new Quaternion();

          return (progress: number, isStart: boolean) => {
            if (isStart) {
              initialX = rocket.position.x;
              initialRotation.copy(rocket.quaternion);
            }

            // moon.position.x = rocket.position.x;
            const moonToRocket = moon.position
              .clone()
              .sub(rocket.position)
              .normalize();
            // moonToRocket.x = 0; //zero out depth difference
            const tangentDir = moonToRocket.cross(new Vector3(1, 0, 0));
            // const tangentDirQuat = new Quaternion().setFromUnitVectors
            const quatToAlign = new Quaternion().setFromUnitVectors(
              new Vector3(0, 1, 0),
              tangentDir
            );
            // rocket.quaternion.copy(quatToAlign);

            rocket.position.x = linterp(initialX, -80, progress);
            rocket.quaternion.copy(
              initialRotation.clone().slerp(quatToAlign, progress)
            );

            //
            // rocket.position.x = 0.1 * (-80) + ( 1- 0.1) * rocket.position.x;
            // rocket.quaternion.slerp(quatToAlign, 0.1);
            // const forward = new Vector3(0, 1, 0).applyQuaternion(rocket.quaternion);
            // rocket.position.add(forward.setScalar(-0.5));
            // // rocket.position.add(rocket.axi)
          };
        })(),
      },
      {
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
            // rocket.quaternion.slerp(quatToAlign, 0.1);

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
      // {
      //   //stop
      //   startTime: 7,

      // },
      // {
      //   //stop
      //   startTime: 9,
      //   update: () => {},
      // },
    ];

    function getActiveSegment(tCycle: number) {
      for (let i = 0; i < segments.length; i++) {
        if (tCycle < segments[i].startTime) {
          return i - 1;
        }
      }
      throw new Error('SHOULD NEVER REACH HERE');
    }

    let lastSegment: PathSegment | null = null;
    function animateRocket(t: number) {
      const tCycle = t % segments[segments.length - 1].startTime;
      const activeSegmentIndex = getActiveSegment(tCycle);
      const activeSegment = segments[activeSegmentIndex];
      const endTime = segments[activeSegmentIndex + 1].startTime;
      const cycleProgress =
        (tCycle - activeSegment.startTime) /
        (endTime - activeSegment.startTime);

      activeSegment.update(cycleProgress, lastSegment !== activeSegment);
      if (lastSegment !== activeSegment) {
        lastSegment = activeSegment;
      }
      // throttleLog(cycleProgress);
    }
    // const cacheProjectVec = new Vector3();
    // parent.addEventListener('click', e => {
    //   //
    //   const screenX = (e.pageX - parent.offsetLeft) / parent.clientWidth;
    //   const screenY = (e.pageY - parent.clientTop) / parent.clientHeight;
    //   //
    //   const ndc_x = screenX * 2 - 1;
    //   const ndc_y = -(screenY * 2 - 1);
    //
    //   cacheProjectVec.set(ndc_x, ndc_y, 0.999).unproject(camera);
    //   rocketX.setDesired(cacheProjectVec.x);
    //   rocketY.setDesired(cacheProjectVec.y);
    //   rocketZ.setDesired(cacheProjectVec.z);
    // });

    const rocketAnimation = (() => {
      // rocking island animation

      let elapsedTime = 0;
      return {
        update: (dt: number) => {
          if (dt > 0.1) {
            // this is a large timestamp, might screw things up, reset rocket
            console.log(`TIME STEP TOO LARGE ${dt}, reseting loop`);
            elapsedTime = 0;
            initRocket();
          }
          animateRocket(elapsedTime);
          elapsedTime += dt;
        },
      };
    })();

    setTimeout(() => {
      puppeteer.addAnimation(rocketAnimation);
    }, 500);

    //gift

    //recenter pivot to be at the balloons
    const parentToGift = entities.floatingGift.highstreet.obj.matrix
      .clone()
      .invert();
    entities.floatingGift.obj.children.forEach(child => {
      child.applyMatrix4(parentToGift);
    });

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

    //gradually fade in island
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

    // setTimeout(() => {
    //   puppeteer.addAnimation(fadeIn)
    // }, 500)
  })();

  const renderer = new WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setClearColor(0x000000, 0); // the default

  renderer.outputEncoding = sRGBEncoding;
  renderer.gammaFactor = 2.2;

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

  prewarm();

  // cleanup function
  return () => {
    cancelAnimationFrame(frameHandle);
    resizeObserver.disconnect();
  };
}
