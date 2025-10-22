import {useEffect, useContext, useRef} from 'react';
import {useGLTF, OrbitControls} from '@react-three/drei';
import {AxesHelper, Box3, Mesh, Vector3} from 'three';
import {useFrame, useThree} from '@react-three/fiber';
import {PerformanceContext} from '../../context/PerformanceProvider';

interface IModelLoader {
  url: string,
  color: number,
  testPerformance?: boolean,
}

export const ModelLoader: React.FC<IModelLoader> = ({url, color}) => {
  const {setTimeToPaint, isPerformanceRecording} = useContext(PerformanceContext);
  const {scene: gltfScene} = useGLTF(url);
  const {scene: currentScene, camera, gl} = useThree();
  const angleRef = useRef<number>(0);

  useEffect(() => {
    const currentModel = gltfScene.clone();

    currentModel.traverse(child => {
      if (child instanceof Mesh) {
        child.material.color.set(color);
      }
    });

    const box = new Box3().setFromObject(currentModel);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);

    currentModel.position.set(-center.x, -center.y, -center.z);

    camera.position.set(center.x, center.y + 20, maxSize);
    camera.lookAt(currentModel.position);
    camera.updateProjectionMatrix();

    const axesHelper = new AxesHelper(maxSize);
    currentScene.add(currentModel, axesHelper);

    requestAnimationFrame(() => {
      performance.mark('graphicEnd');
      const renderMeasure = performance.measure('graphicDuration', 'graphicStart', 'graphicEnd');
      setTimeToPaint(renderMeasure.duration);
    });

    return () => {
      currentScene.remove(currentModel);
      currentModel.traverse(child => {
        const tChild = child as Mesh;

        if (tChild.isMesh) {
          tChild.geometry.dispose();
          if (Array.isArray(tChild.material)) {
            tChild.material.forEach(material => material.dispose());
          } else {
            tChild.material.dispose();
          }
        }
      });
    };
  }, [url, gltfScene, currentScene]);

  useFrame(() => {
    if (isPerformanceRecording) {
      angleRef.current += 0.05;
      const radius = 200;
      camera.position.setX(Math.sin(angleRef.current) * radius);
      camera.position.setY(Math.cos(angleRef.current) * radius);
      camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <OrbitControls
        camera={camera}
        domElement={gl.domElement}
      />
    </>
  );
};