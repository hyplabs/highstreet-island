import {Color, DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, sRGBEncoding, WebGLRenderer} from "three"
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {degToRad} from "three/src/math/MathUtils";

export type WorldConfig = {
    gltfPath: string
}

export function CreateWorld(canvas: HTMLCanvasElement, parent: HTMLDivElement, config: WorldConfig){
    const camera = new PerspectiveCamera();
    //AXIS FOR OUR WORLD

    // X -> Inward toward island
    // Y -> Up
    // Z -> Right

    const onResize = () => {
        const w = parent.clientWidth;
        const h = parent.clientHeight;

        if(w === canvas.width && h === canvas.height) return;

        console.log("SETTING CANVAS SIZE:", w, h);
        //have renderer take full size of parent
        renderer.setSize(w, h);

        camera.aspect = w/h;
        camera.fov = 70;
        // camera.rotation.setFromVector3(new Vector3(-Math.PI, 0, -Math.PI))
        camera.position.set(-80, 25, 0)
        camera.rotateY(degToRad(-90));
        camera.updateProjectionMatrix();

    }

    //@ts-ignore for some reason ts complains ResizeObserver not found
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas);

    const scene = new Scene();
    const loader = new GLTFLoader();
    console.log("LOADER", loader);

    (async () => {
        const gltf = await loader.loadAsync(config.gltfPath);
        console.log(gltf.scene);
        scene.add(gltf.scene);

        const island = gltf.scene.getObjectByName('Island_v2');
        console.assert(island);
            island?.rotateY(degToRad(180));


    })();

    const renderer = new WebGLRenderer({
        canvas: canvas,
        antialias: true
    })

    renderer.outputEncoding = sRGBEncoding;
    renderer.gammaFactor = 2.2;

    scene.background = new Color(0xe4cece); // pink

    // Hemisphere light for subtle gradient
    scene.add(new HemisphereLight(
        new Color(0xb6daed), //sky blue,
        new Color(0xdfcb9b), //tan,
        1
    ));

    // Directional light
    const directionalLight = new DirectionalLight(
        new Color(0xFFFFFF), // white
        1
    );

    directionalLight.position.set(-8, 29, -25)
    scene.add(directionalLight);

    // render loop
    let frameHandle = 0;
    const animate = function () {
        frameHandle = requestAnimationFrame( animate );
        renderer.render( scene, camera );
    };
    animate();

    // cleanup function
    return () => {
        cancelAnimationFrame(frameHandle);
        resizeObserver.disconnect();
    }

}
