import { defaultApply, HandleStore } from "@pmndrs/handle";
import { RoundedBox } from "@react-three/drei";
import { type RootState, useFrame } from "@react-three/fiber";
import { Handle, HandleTarget, OrbitHandles } from "@react-three/handle";
import { NotInXR, useSessionFeatureEnabled, XRLayer } from "@react-three/xr";
import {
  CopyPass,
  EffectComposer,
  RenderPass,
  ShaderPass,
} from "postprocessing";
import { useMemo, useRef } from "react";
import {
  Camera,
  Euler,
  Group,
  MathUtils,
  Quaternion,
  Scene as SceneImpl,
  ShaderMaterial,
  Uniform,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { cameraStore } from "~/stores";
import { RotateGeometry } from "./customGeometries";
import { Hover } from "./interaction/Hover";
import SceneContent from "./scene/Scene";

const myShaderMaterial = new ShaderMaterial({
  uniforms: {
    tDiffuse: new Uniform(null), // Input texture (rendered scene)
    gamma: new Uniform(2.2), // Default gamma value
  },
  vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
  fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float gamma;
        varying vec2 vUv;
    
        void main() {
          // Sample the input texture
          vec4 color = texture2D(tDiffuse, vUv);
    
          // Apply gamma correction
          color.rgb = pow(color.rgb, vec3(1.0 / gamma));
    
          // Output the corrected color
          gl_FragColor = color;
        }
      `,
});

const eulerHelper = new Euler();
const quaternionHelper = new Quaternion();
const vectorHelper1 = new Vector3();
const vectorHelper2 = new Vector3();
const zAxis = new Vector3(0, 0, 1);

export function Screen() {
  const ref = useRef<Group>(null);
  const storeRef = useRef<HandleStore<unknown>>(null);
  useFrame((state, dt) => {
    if (ref.current == null || storeRef.current?.getState() == null) {
      return;
    }
    state.camera.getWorldPosition(vectorHelper1);
    ref.current.getWorldPosition(vectorHelper2);
    quaternionHelper.setFromUnitVectors(
      zAxis,
      vectorHelper1.sub(vectorHelper2).normalize(),
    );
    eulerHelper.setFromQuaternion(quaternionHelper, "YXZ");
    ref.current.rotation.y = MathUtils.damp(
      ref.current.rotation.y,
      eulerHelper.y,
      10,
      dt,
    );
  });
  const isInXR = useSessionFeatureEnabled("layers");
  const renderFunction = useMemo(() => {
    let cache:
      | {
          composer: EffectComposer;
          camera: Camera;
          scene: SceneImpl;
          renderer: WebGLRenderer;
          renderTarget: WebGLRenderTarget;
        }
      | undefined;
    return (
      renderTarget: WebGLRenderTarget,
      state: RootState,
      delta: number,
    ) => {
      if (
        cache == null ||
        state.scene != cache.scene ||
        state.camera != cache.camera ||
        state.gl != cache.renderer ||
        renderTarget != cache.renderTarget
      ) {
        if (cache != null) {
          cache.composer.dispose();
        }
        const composer = new EffectComposer(state.gl);
        composer.autoRenderToScreen = false;
        composer.addPass(new RenderPass(state.scene, state.camera));
        //gamma correction pass
        composer.addPass(new ShaderPass(myShaderMaterial, "tDiffuse"));
        composer.addPass(new CopyPass(renderTarget));
        cache = {
          composer,
          camera: state.camera,
          scene: state.scene,
          renderer: state.gl,
          renderTarget,
        };
      }
      cache.composer.render(delta);
    };
  }, []);

  return (
    <HandleTarget>
      <group position-z={-0.4}>
        <group ref={ref}>
          <group position-y={0.05}>
            <HandleTarget>
              <mesh
                position-y={0.15}
                rotation-y={Math.PI}
                scale={[(0.3 * 16) / 9, 0.3, 0.3]}
              >
                <planeGeometry />
                <meshBasicMaterial />
              </mesh>
              <XRLayer
                position-y={0.15}
                customRender={isInXR ? renderFunction : undefined}
                scale={[(0.3 * 16) / 9, 0.3, 0.3]}
                pixelWidth={1920 / 2}
                pixelHeight={1080 / 2}
              >
                <NotInXR>
                  <color attach="background" args={["white"]} />
                  <OrbitHandles damping store={cameraStore} />
                  <SceneContent isInScreen />
                </NotInXR>
              </XRLayer>
              <Handle
                targetRef="from-context"
                translate="as-scale"
                apply={(state, target) => {
                  defaultApply(state, target);
                  target.scale.z = state.current.scale.x;
                }}
                scale={{ z: false, uniform: true }}
                rotate={false}
              >
                <Hover>
                  {(hovered) => (
                    <mesh
                      rotation-x={Math.PI / 2}
                      rotation-z={Math.PI}
                      position={[
                        (0.15 * 16) / 9 + (hovered ? 0.035 : 0.03),
                        hovered ? 0.325 : 0.32,
                        0,
                      ]}
                      scale={hovered ? 0.035 : 0.025}
                    >
                      <RotateGeometry />
                      <meshStandardMaterial
                        emissiveIntensity={hovered ? 0.3 : 0}
                        emissive={0xffffff}
                        toneMapped={false}
                        color="grey"
                      />
                    </mesh>
                  )}
                </Hover>
              </Handle>
            </HandleTarget>
          </group>
          <Handle
            targetRef="from-context"
            ref={storeRef}
            scale={false}
            multitouch={false}
            rotate={false}
          >
            <Hover>
              {(hovered) => (
                <RoundedBox scale={hovered ? 0.125 : 0.1} args={[2, 0.2, 0.2]}>
                  <meshStandardMaterial
                    emissiveIntensity={hovered ? 0.3 : 0}
                    emissive={0xffffff}
                    toneMapped={false}
                    color="grey"
                  />
                </RoundedBox>
              )}
            </Hover>
          </Handle>
        </group>
      </group>
    </HandleTarget>
  );
}
