"use client"

import { useEffect, useState, useCallback } from "react"
import { useOrgStore } from "@/stores/orgStore"
import { BridgeRole } from "@/lib/types"

// 가교 역할별 색상
const bridgeRoleColors: Record<BridgeRole, string> = {
  primary: "#3b82f6",    // 파란색 - AE↔마케팅
  creative: "#8b5cf6",   // 보라색 - CD↔마케팅담당
  executive: "#f59e0b",  // 금색 - 대표↔원장
}

interface NodePosition {
  x: number
  y: number
  width: number
  height: number
}

export function BridgeOverlay() {
  const { bridges, nodes } = useOrgStore()
  const [positions, setPositions] = useState<Record<string, NodePosition>>({})
  const [hoveredBridgeId, setHoveredBridgeId] = useState<string | null>(null)

  // 노드 위치 업데이트 함수
  const updatePositions = useCallback(() => {
    const newPositions: Record<string, NodePosition> = {}

    // React Flow 노드 DOM 요소 찾기
    bridges.forEach((bridge) => {
      const companyNodeEl = document.querySelector(
        `[data-id="${bridge.companyTargetId}"]`
      )
      const hospitalNodeEl = document.querySelector(
        `[data-id="${bridge.hospitalTargetId}"]`
      )

      if (companyNodeEl) {
        const rect = companyNodeEl.getBoundingClientRect()
        newPositions[bridge.companyTargetId] = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        }
      }

      if (hospitalNodeEl) {
        const rect = hospitalNodeEl.getBoundingClientRect()
        newPositions[bridge.hospitalTargetId] = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        }
      }
    })

    setPositions(newPositions)
  }, [bridges])

  // 위치 업데이트 타이머
  useEffect(() => {
    updatePositions()

    // 스크롤, 리사이즈, 줌 시 위치 업데이트
    const handleUpdate = () => {
      requestAnimationFrame(updatePositions)
    }

    window.addEventListener("resize", handleUpdate)
    window.addEventListener("scroll", handleUpdate, true)

    // React Flow 줌/팬 감지를 위한 MutationObserver
    const observer = new MutationObserver(handleUpdate)
    const reactFlowContainers = document.querySelectorAll(".react-flow__viewport")
    reactFlowContainers.forEach((container) => {
      observer.observe(container, {
        attributes: true,
        attributeFilter: ["transform"],
        subtree: true,
      })
    })

    // 주기적 업데이트 (드래그 등 감지)
    const interval = setInterval(updatePositions, 100)

    return () => {
      window.removeEventListener("resize", handleUpdate)
      window.removeEventListener("scroll", handleUpdate, true)
      observer.disconnect()
      clearInterval(interval)
    }
  }, [updatePositions])

  // 연결선이 없으면 렌더링하지 않음
  if (bridges.length === 0) return null

  return (
    <svg
      className="fixed inset-0 pointer-events-none z-40"
      style={{ width: "100vw", height: "100vh" }}
    >
      <defs>
        {/* 그라데이션 정의 */}
        {Object.entries(bridgeRoleColors).map(([role, color]) => (
          <linearGradient
            key={role}
            id={`bridge-gradient-${role}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={color} stopOpacity={0.8} />
            <stop offset="50%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0.8} />
          </linearGradient>
        ))}
      </defs>

      {bridges.map((bridge) => {
        const companyPos = positions[bridge.companyTargetId]
        const hospitalPos = positions[bridge.hospitalTargetId]

        if (!companyPos || !hospitalPos) return null

        const isHovered = hoveredBridgeId === bridge.id
        const role = bridge.role || "primary"
        const color = bridgeRoleColors[role]

        // 베지어 곡선 컨트롤 포인트 계산
        const midX = (companyPos.x + hospitalPos.x) / 2
        const controlOffset = Math.abs(hospitalPos.x - companyPos.x) * 0.3

        const pathD = `
          M ${companyPos.x} ${companyPos.y}
          C ${companyPos.x + controlOffset} ${companyPos.y},
            ${hospitalPos.x - controlOffset} ${hospitalPos.y},
            ${hospitalPos.x} ${hospitalPos.y}
        `

        return (
          <g key={bridge.id}>
            {/* 연결선 */}
            <path
              d={pathD}
              fill="none"
              stroke={`url(#bridge-gradient-${role})`}
              strokeWidth={isHovered ? 4 : 2}
              strokeDasharray="8,4"
              className="transition-all duration-200"
              style={{
                filter: isHovered ? `drop-shadow(0 0 6px ${color})` : "none",
              }}
            />

            {/* 호버 영역 (투명) */}
            <path
              d={pathD}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => setHoveredBridgeId(bridge.id)}
              onMouseLeave={() => setHoveredBridgeId(null)}
            />

            {/* 중앙 라벨 */}
            {isHovered && (
              <g>
                <rect
                  x={midX - 60}
                  y={(companyPos.y + hospitalPos.y) / 2 - 12}
                  width={120}
                  height={24}
                  rx={4}
                  fill="white"
                  stroke={color}
                  strokeWidth={1}
                  className="pointer-events-none"
                />
                <text
                  x={midX}
                  y={(companyPos.y + hospitalPos.y) / 2 + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fill={color}
                  fontWeight={500}
                  className="pointer-events-none"
                >
                  {bridge.name}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}
