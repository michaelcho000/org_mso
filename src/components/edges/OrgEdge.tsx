"use client"

import { memo } from "react"
import { EdgeProps, getSmoothStepPath } from "@xyflow/react"
import { OrgEdge as OrgEdgeType, EdgeLineStyle } from "@/lib/types"

type OrgEdgeProps = EdgeProps & {
  data?: OrgEdgeType | Record<string, unknown>
}

// 선 스타일별 strokeDasharray 설정
const lineStyleMap: Record<EdgeLineStyle, string> = {
  solid: "none",
  dashed: "8,4",
}

export const OrgEdge = memo(function OrgEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: OrgEdgeProps) {
  // 직선 스타일의 계단형 연결선 사용
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0, // 완전 직선 (모서리 곡률 없음)
  })

  // lineStyle에 따른 dasharray 결정
  const lineStyle = (data as OrgEdgeType | undefined)?.lineStyle || "solid"
  const strokeDasharray = lineStyleMap[lineStyle]

  return (
    <path
      id={id}
      style={{
        ...style,
        strokeWidth: 2,
        stroke: lineStyle === "dashed"
          ? "hsl(var(--muted-foreground) / 0.6)"
          : "hsl(var(--muted-foreground))",
        strokeDasharray,
      }}
      className="react-flow__edge-path"
      d={edgePath}
      markerEnd={markerEnd}
    />
  )
})
