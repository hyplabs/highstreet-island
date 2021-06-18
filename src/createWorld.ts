
import {
    BoxBufferGeometry,
    Color,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer
} from "three"
export function CreateWorld(canvas: HTMLCanvasElement, parent: HTMLDivElement){
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
        camera.updateProjectionMatrix();

        camera.position.set(-40, 0, 0)

        camera.lookAt(new Vector3(0, 0, 0));
    }

    //@ts-ignore for some reason ts complains ResizeObserver not found
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas);

    const scene = new Scene();

    const renderer = new WebGLRenderer({
        canvas: canvas
    })

    const box = new BoxBufferGeometry();
    const material = new MeshBasicMaterial();

    material.color = new Color(1, 0, 0)

    const mesh = new Mesh(box, material);
    mesh.position.set(0, 0, 0);
    mesh.scale.set(20, 20, 20);
    // mesh.scale.set()
    scene.add(mesh);

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