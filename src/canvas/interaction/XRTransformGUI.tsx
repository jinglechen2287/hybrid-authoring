import {
  Container,
  Input,
  Text,
} from "@react-three/uikit";
import { useXR } from "@react-three/xr";
import { produce } from "immer";
import { useCallback } from "react";
import { useEditorStore, useSceneStore } from "~/stores";
import type { SceneData } from "~/types";

export function XRTransformGUI() {
  const isInXR = useXR((s) => s.session != null);
  const selectedObjId = useEditorStore((s) => s.selectedObjId);

  if (!isInXR) return null;

  return (
    <group position={[-0.5, 0.5, -0.325]} rotation={[0, Math.PI / 2, 0]}>
      <Container pixelSize={0.002} sizeX={1.2}>
        <Container
          opacity={0.9}
          color="white"
          flexDirection="column"
          gap={12}
          backgroundColor="rgba(0,0,0,0.8)"
          padding={16}
          borderRadius={16}
        >
          {selectedObjId ? (
            <>
              <Text fontSize={24} fontWeight="bold" alignSelf="center">
                Transform
              </Text>
              <TransformGroup label="Position" type="position" />
              <TransformGroup label="Rotation" type="rotation" />
              <TransformGroup label="Scale" type="scale" />
            </>
          ) : (
            <Text fontSize={24} fontWeight="bold" alignSelf="center">
              Select an object
            </Text>
          )}
        </Container>
      </Container>
    </group>
  );
}

function TransformGroup({
  label,
  type,
}: {
  label: string;
  type: "position" | "rotation" | "scale";
}) {
  return (
    <Container flexDirection="column" gap={4}>
      <Text fontSize={16} color="#aaa">
        {label}
      </Text>
      <Container flexDirection="row" gap={8}>
        <XRNumberInput type={type} coordinate="X" />
        <XRNumberInput type={type} coordinate="Y" />
        <XRNumberInput type={type} coordinate="Z" />
      </Container>
    </Container>
  );
}

function XRNumberInput({
  type,
  coordinate,
}: {
  type: "position" | "rotation" | "scale";
  coordinate: "X" | "Y" | "Z";
}) {
  const sceneStore = useSceneStore();
  const editorStore = useEditorStore();
  const selectedObjId = editorStore.selectedObjId;
  const objStateIdxMap = editorStore.objStateIdxMap;

  const index = ["X", "Y", "Z"].indexOf(coordinate);
  const objStateIdx = selectedObjId ? (objStateIdxMap[selectedObjId] ?? 0) : 0;

  const handleValueChange = useCallback(
    (val: string) => {
      if (!selectedObjId) return;
      useSceneStore.setState(
        produce((sceneData: SceneData) => {
          let numValue = parseFloat(val);
          if (isNaN(numValue)) numValue = 0;
          const target = sceneData.content[selectedObjId];
          if (!target) return;
          const objStates = target.states;
          if (!objStates || objStates.length === 0) return;
          const idx = Math.min(objStateIdx, objStates.length - 1);
          objStates[idx].transform[type][index] = numValue;
        }),
      );
    },
    [selectedObjId, objStateIdx, type, index],
  );

  if (!selectedObjId) return null;

  const obj = sceneStore.content[selectedObjId];
  if (!obj) return null;

  const objStates = obj.states ?? [];
  const objState = objStates[objStateIdx] ?? objStates[0];
  if (!objState) return null;

  const value = objState.transform[type][index];

  return (
    <Container
      flexDirection="row"
      alignItems="center"
      backgroundColor="#333"
      borderRadius={4}
      paddingX={6}
      paddingY={2}
      flexGrow={1}
      width={70}
    >
      <Text color="#888" fontSize={12} marginRight={4}>
        {coordinate}
      </Text>
      <Input
        value={value.toFixed(2)}
        onValueChange={handleValueChange}
        fontSize={14}
        width="100%"
        color="white"
        backgroundColor="transparent"
        multiple={false}
      />
    </Container>
  );
}
