'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import * as THREE from 'three'
import { CustomizableProduct, DesignElement, FinishType, ProductColors } from '@/lib/customize/types'
import { GRAPHIC_ASSETS } from '@/lib/customize/graphics'
import { Camera, Maximize2, Minus, Move3d, Plus, RefreshCw, RotateCcw } from 'lucide-react'

export interface ThreeProductViewerRef {
  captureSnapshot: () => string
  resetCamera: () => void
  setPresetAngle: (angle: 'front' | 'right' | 'back' | 'left' | 'top') => void
  focusSurface: (surfaceId: string) => void
}

interface ThreeProductViewerProps {
  product: CustomizableProduct
  colors: ProductColors
  finish: FinishType
  elements: DesignElement[]
  activeSurfaceId: string
  selectedElementId: string | null
  onSelectElement?: (id: string | null) => void
  onUpdateElement?: (id: string, updates: Partial<DesignElement>) => void
  backgroundPattern?: {
    type: string
    scale: number
    color: string
    bgColor: string
    opacity: number
  }
  className?: string
}

export const ThreeProductViewer = forwardRef<ThreeProductViewerRef, ThreeProductViewerProps>(
  (
    {
      product,
      colors,
      finish,
      elements,
      activeSurfaceId,
      selectedElementId,
      onSelectElement,
      onUpdateElement,
      backgroundPattern,
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const textureCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const basinCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const modelGroupRef = useRef<THREE.Group | null>(null)
    const bodyTextureRef = useRef<THREE.CanvasTexture | null>(null)
    const basinTextureRef = useRef<THREE.CanvasTexture | null>(null)
    const materialsRef = useRef<{ [key: string]: THREE.MeshStandardMaterial }>({})

    // Rotation and interaction state
    const [autoRotate, setAutoRotate] = useState(false)
    const autoRotateRef = useRef(false)
    const [isLoading, setIsLoading] = useState(true)
    const [webGlSupported, setWebGlSupported] = useState(true)

    const toggleAutoRotate = () => {
      setAutoRotate((prev) => {
        const next = !prev
        autoRotateRef.current = next
        return next
      })
    }

    useEffect(() => {
      autoRotateRef.current = autoRotate
    }, [autoRotate])

    // Current yaw, pitch, zoom (starts extremely zoomed out to the max)
    const rotRef = useRef({
      yaw: 0.25,
      pitch: 0.15,
      targetYaw: 0.25,
      targetPitch: 0.15,
      distance: 11.0,
      targetDistance: 11.0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
    })

    // Surface camera orientation angles
    const focusSurface = (surfaceId: string) => {
      if (surfaceId === 'back') {
        rotRef.current.targetYaw = Math.PI
        rotRef.current.targetPitch = 0.06
      } else if (surfaceId === 'front') {
        rotRef.current.targetYaw = 0
        rotRef.current.targetPitch = 0.06
      } else if (surfaceId === 'basin' || surfaceId === 'interior' || surfaceId === 'top') {
        rotRef.current.targetYaw = 0
        rotRef.current.targetPitch = Math.PI / 2.3 // Look straight down at plate/bowl basin
      } else if (surfaceId === 'rim') {
        rotRef.current.targetYaw = 0.2
        rotRef.current.targetPitch = Math.PI / 3
      } else if (surfaceId === 'wrap') {
        rotRef.current.targetYaw = 0.4
        rotRef.current.targetPitch = 0.12
      }
    }

    // Auto-focus when activeSurfaceId changes
    useEffect(() => {
      focusSurface(activeSurfaceId)
    }, [activeSurfaceId])

    // Expose imperative methods to parent
    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return ''
        rendererRef.current.render(sceneRef.current, cameraRef.current)
        return rendererRef.current.domElement.toDataURL('image/png')
      },
      resetCamera: () => {
        rotRef.current.targetYaw = 0.25
        rotRef.current.targetPitch = 0.15
        rotRef.current.targetDistance = 11.0
      },
      setPresetAngle: (preset) => {
        switch (preset) {
          case 'front':
            rotRef.current.targetYaw = 0
            rotRef.current.targetPitch = 0.05
            break
          case 'right':
            rotRef.current.targetYaw = Math.PI / 2
            rotRef.current.targetPitch = 0.05
            break
          case 'back':
            rotRef.current.targetYaw = Math.PI
            rotRef.current.targetPitch = 0.05
            break
          case 'left':
            rotRef.current.targetYaw = -Math.PI / 2
            rotRef.current.targetPitch = 0.05
            break
          case 'top':
            rotRef.current.targetYaw = 0
            rotRef.current.targetPitch = Math.PI / 2.3
            break
        }
      },
      focusSurface,
    }))

    // Draw elements helper for canvas
    const drawElementsToContext = (
      ctx: CanvasRenderingContext2D,
      surfaceFilter: (sId: string) => boolean,
      dim: number,
      coordMapper?: (el: DesignElement) => { cx: number; cy: number; w: number; h: number }
    ) => {
      const surfaceElements = elements
        .filter((e) => surfaceFilter(e.surfaceId))
        .sort((a, b) => a.zIndex - b.zIndex)

      for (const el of surfaceElements) {
        ctx.save()

        let cx = (el.x / 100) * dim
        let cy = (el.y / 100) * dim
        let w = (el.width / 100) * dim * el.scale
        let h = (el.height / 100) * dim * el.scale

        if (coordMapper) {
          const mapped = coordMapper(el)
          cx = mapped.cx
          cy = mapped.cy
          w = mapped.w
          h = mapped.h
        }

        ctx.translate(cx, cy)
        if (el.rotation) {
          ctx.rotate((el.rotation * Math.PI) / 180)
        }
        if (el.flipX || el.flipY) {
          ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1)
        }
        ctx.globalAlpha = el.opacity ?? 1

        if (el.type === 'text' && el.text) {
          const fontSizePx = Math.round((el.fontSize || 22) * (dim / 450))
          const fontStyle = el.fontStyle === 'italic' ? 'italic ' : ''
          const fontWeight = el.fontWeight === 'bold' ? 'bold ' : 'normal '
          const fontFamily = el.fontFamily || 'Cormorant Garamond'

          ctx.font = `${fontStyle}${fontWeight}${fontSizePx}px "${fontFamily}", serif`
          ctx.fillStyle = el.fontColor || '#1c2033'
          ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(el.text, 0, 0)
        } else if (el.type === 'graphic' && el.src) {
          const graphic = GRAPHIC_ASSETS.find((g) => g.id === el.src)
          if (graphic) {
            const p = new Path2D(graphic.svgPath)
            const scaleFactor = Math.min(w, h) / 100
            ctx.scale(scaleFactor, scaleFactor)
            ctx.translate(-50, -50)
            ctx.fillStyle = el.tintColor || '#1c2033'
            ctx.fill(p)
          }
        } else if (el.type === 'image' && el.src) {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.src = el.src
          if (img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, -w / 2, -h / 2, w, h)
          } else {
            img.onload = () => updateCanvasTextures()
          }
        }

        ctx.restore()
      }
    }

    // Update offscreen 2D textures
    const updateCanvasTextures = () => {
      // 1. Body texture (Cylinder wrap for Mugs, Carafes, Tumblers, Totes, Bottles)
      let bodyCanvas = textureCanvasRef.current
      if (!bodyCanvas) {
        bodyCanvas = document.createElement('canvas')
        bodyCanvas.width = 1024
        bodyCanvas.height = 1024
        textureCanvasRef.current = bodyCanvas
      }

      const bodyCtx = bodyCanvas.getContext('2d')
      if (bodyCtx) {
        bodyCtx.fillStyle = colors.body || '#f7f6f2'
        bodyCtx.fillRect(0, 0, 1024, 1024)

        // Draw pattern if active
        if (backgroundPattern && backgroundPattern.type !== 'none') {
          bodyCtx.save()
          bodyCtx.globalAlpha = backgroundPattern.opacity ?? 0.6
          const step = Math.max(30, Math.round(50 * (backgroundPattern.scale || 1)))
          bodyCtx.fillStyle = backgroundPattern.color || '#232734'
          for (let x = 10; x < 1024; x += step) {
            for (let y = 10; y < 1024; y += step) {
              const r = ((x * 7 + y * 13) % 4) + 1.2
              bodyCtx.beginPath()
              bodyCtx.arc(x + ((y * 11) % 15), y + ((x * 5) % 15), r, 0, Math.PI * 2)
              bodyCtx.fill()
            }
          }
          bodyCtx.restore()
        }

        // Draw body elements with accurate cylindrical UV mapping
        // In Three.js CylinderGeometry, U=0.5 faces Z+ (Front), U=0.0 / 1.0 faces Z- (Back)
        drawElementsToContext(
          bodyCtx,
          (sId) => ['front', 'back', 'wrap', 'exterior'].includes(sId),
          1024,
          (el) => {
            let uCenter = 0.5 // Default Front
            if (el.surfaceId === 'back') {
              uCenter = 0.0 // Opposite side
            }
            const cx = ((uCenter + (el.x - 50) / 100 * 0.45) % 1.0) * 1024
            const cy = (el.y / 100) * 1024
            const w = (el.width / 100) * 1024 * el.scale * 0.5
            const h = (el.height / 100) * 1024 * el.scale * 0.5
            return { cx: cx < 0 ? cx + 1024 : cx, cy, w, h }
          }
        )

        if (bodyTextureRef.current) {
          bodyTextureRef.current.needsUpdate = true
        }
      }

      // 2. Planar Basin texture for Plates and Bowls
      let basinCanvas = basinCanvasRef.current
      if (!basinCanvas) {
        basinCanvas = document.createElement('canvas')
        basinCanvas.width = 1024
        basinCanvas.height = 1024
        basinCanvasRef.current = basinCanvas
      }

      const basinCtx = basinCanvas.getContext('2d')
      if (basinCtx) {
        basinCtx.fillStyle = colors.body || '#f7f6f2'
        basinCtx.fillRect(0, 0, 1024, 1024)

        // Draw basin elements directly with centered planar coordinates
        drawElementsToContext(
          basinCtx,
          (sId) => ['basin', 'interior', 'top', 'front'].includes(sId),
          1024,
          (el) => {
            const cx = (el.x / 100) * 1024
            const cy = (el.y / 100) * 1024
            const w = (el.width / 100) * 1024 * el.scale * 0.7
            const h = (el.height / 100) * 1024 * el.scale * 0.7
            return { cx, cy, w, h }
          }
        )

        if (basinTextureRef.current) {
          basinTextureRef.current.needsUpdate = true
        }
      }
    }

    const getFinishParams = (f: FinishType) => {
      switch (f) {
        case 'satin':
          return { roughness: 0.4, metalness: 0.05 }
        case 'matte':
          return { roughness: 0.85, metalness: 0.0 }
        case 'gloss':
          return { roughness: 0.1, metalness: 0.12 }
        case 'raw':
          return { roughness: 0.95, metalness: 0.02 }
        case 'metallic':
          return { roughness: 0.22, metalness: 0.8 }
        default:
          return { roughness: 0.4, metalness: 0.05 }
      }
    }

    // Build 3D meshes based on product.modelType
    const buildProductModel = (
      group: THREE.Group,
      bodyTex: THREE.CanvasTexture,
      basinTex: THREE.CanvasTexture
    ) => {
      while (group.children.length > 0) {
        const obj = group.children[0]
        group.remove(obj)
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      }

      const finishParams = getFinishParams(finish)

      // Main body material
      const bodyMat = new THREE.MeshStandardMaterial({
        map: bodyTex,
        roughness: finishParams.roughness,
        metalness: finishParams.metalness,
      })

      // Planar basin material (for plates & bowls)
      const basinMat = new THREE.MeshStandardMaterial({
        map: basinTex,
        roughness: finishParams.roughness,
        metalness: finishParams.metalness,
      })

      // Accent / Handle material
      const accentMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.accent || colors.body),
        roughness: finishParams.roughness,
        metalness: finishParams.metalness,
      })

      // Rim material
      const rimMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.rim || colors.body),
        roughness: finish === 'metallic' ? 0.2 : finishParams.roughness,
        metalness: finish === 'metallic' ? 0.82 : finishParams.metalness,
      })

      // Interior material
      const interiorMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.interior || '#f7f6f2'),
        roughness: 0.25,
        metalness: 0.05,
      })

      materialsRef.current = { bodyMat, basinMat, accentMat, rimMat, interiorMat }

      if (product.modelType === 'mug') {
        // --- CERAMIC MUG ---
        const mugGeo = new THREE.CylinderGeometry(0.85, 0.82, 1.7, 48, 1, true)
        // Rotate cylinder geometry so U=0.5 faces front directly
        mugGeo.rotateY(Math.PI / 2)
        const mugMesh = new THREE.Mesh(mugGeo, bodyMat)
        mugMesh.castShadow = true
        mugMesh.receiveShadow = true
        group.add(mugMesh)

        const innerGeo = new THREE.CylinderGeometry(0.8, 0.77, 1.65, 48, 1, true)
        const innerMesh = new THREE.Mesh(innerGeo, interiorMat)
        innerMesh.position.y = 0.02
        group.add(innerMesh)

        const baseGeo = new THREE.CircleGeometry(0.82, 48)
        baseGeo.rotateX(Math.PI / 2)
        const baseMesh = new THREE.Mesh(baseGeo, accentMat)
        baseMesh.position.y = -0.85
        group.add(baseMesh)

        const innerBaseGeo = new THREE.CircleGeometry(0.77, 48)
        innerBaseGeo.rotateX(-Math.PI / 2)
        const innerBaseMesh = new THREE.Mesh(innerBaseGeo, interiorMat)
        innerBaseMesh.position.y = -0.8
        group.add(innerBaseMesh)

        const rimGeo = new THREE.RingGeometry(0.8, 0.85, 48)
        rimGeo.rotateX(-Math.PI / 2)
        const rimMesh = new THREE.Mesh(rimGeo, rimMat)
        rimMesh.position.y = 0.85
        group.add(rimMesh)

        // Pulled Handle on right side (X+)
        const handleGeo = new THREE.TorusGeometry(0.48, 0.09, 24, 48, Math.PI * 1.05)
        handleGeo.rotateZ(-Math.PI / 2)
        handleGeo.scale(0.8, 1.25, 0.7)
        const handleMesh = new THREE.Mesh(handleGeo, accentMat)
        handleMesh.position.set(0.9, -0.05, 0)
        handleMesh.castShadow = true
        group.add(handleMesh)
      } else if (product.modelType === 'plate') {
        // --- DINNER PLATE ---
        // 1. Stoneware outer bevel & base
        const outerPoints: THREE.Vector2[] = [
          new THREE.Vector2(0, -0.05),
          new THREE.Vector2(1.2, -0.05),
          new THREE.Vector2(1.55, 0.12),
          new THREE.Vector2(1.68, 0.22),
          new THREE.Vector2(1.65, 0.24),
          new THREE.Vector2(1.48, 0.14),
          new THREE.Vector2(1.2, 0.0),
        ]
        const outerPlateGeo = new THREE.LatheGeometry(outerPoints, 64)
        const outerPlateMesh = new THREE.Mesh(outerPlateGeo, rimMat)
        outerPlateMesh.position.y = -0.15
        outerPlateMesh.castShadow = true
        outerPlateMesh.receiveShadow = true
        group.add(outerPlateMesh)

        // 2. Dedicated Flat Planar Basin Mesh for artwork (Zero distortion!)
        const basinGeo = new THREE.CircleGeometry(1.2, 64)
        basinGeo.rotateX(-Math.PI / 2)
        const basinMesh = new THREE.Mesh(basinGeo, basinMat)
        basinMesh.position.y = -0.148
        basinMesh.receiveShadow = true
        group.add(basinMesh)

        // 3. Rim accent ring
        const rimRingGeo = new THREE.RingGeometry(1.48, 1.66, 64)
        rimRingGeo.rotateX(-Math.PI / 2)
        const rimRingMesh = new THREE.Mesh(rimRingGeo, rimMat)
        rimRingMesh.position.y = 0.08
        group.add(rimRingMesh)
      } else if (product.modelType === 'tumbler') {
        // --- VIOLET TUMBLER GLASS ---
        const points: THREE.Vector2[] = [
          new THREE.Vector2(0, -0.9),
          new THREE.Vector2(0.68, -0.9),
          new THREE.Vector2(0.72, -0.7),
          new THREE.Vector2(0.82, 0.8),
          new THREE.Vector2(0.85, 0.95),
          new THREE.Vector2(0.8, 0.95),
          new THREE.Vector2(0.76, 0.8),
          new THREE.Vector2(0.65, -0.75),
          new THREE.Vector2(0, -0.75),
        ]
        const tumblerGeo = new THREE.LatheGeometry(points, 48)
        const tumblerMesh = new THREE.Mesh(tumblerGeo, bodyMat)
        tumblerMesh.castShadow = true
        group.add(tumblerMesh)

        const lipRingGeo = new THREE.RingGeometry(0.8, 0.85, 48)
        lipRingGeo.rotateX(-Math.PI / 2)
        const lipMesh = new THREE.Mesh(lipRingGeo, rimMat)
        lipMesh.position.y = 0.95
        group.add(lipMesh)
      } else if (product.modelType === 'bowl') {
        // --- BASALT BOWL ---
        const points: THREE.Vector2[] = [
          new THREE.Vector2(0, -0.65),
          new THREE.Vector2(0.7, -0.65),
          new THREE.Vector2(1.2, -0.2),
          new THREE.Vector2(1.45, 0.35),
          new THREE.Vector2(1.48, 0.45),
          new THREE.Vector2(1.42, 0.45),
          new THREE.Vector2(1.36, 0.3),
          new THREE.Vector2(1.1, -0.15),
          new THREE.Vector2(0.6, -0.55),
        ]
        const bowlGeo = new THREE.LatheGeometry(points, 64)
        const bowlMesh = new THREE.Mesh(bowlGeo, bodyMat)
        bowlMesh.castShadow = true
        group.add(bowlMesh)

        // Planar interior bottom disc for clear artwork
        const bowlBasinGeo = new THREE.CircleGeometry(0.6, 48)
        bowlBasinGeo.rotateX(-Math.PI / 2)
        const bowlBasinMesh = new THREE.Mesh(bowlBasinGeo, basinMat)
        bowlBasinMesh.position.y = -0.54
        group.add(bowlBasinMesh)

        // Rim accent
        const rimRing = new THREE.RingGeometry(1.42, 1.48, 64)
        rimRing.rotateX(-Math.PI / 2)
        const rimM = new THREE.Mesh(rimRing, rimMat)
        rimM.position.y = 0.45
        group.add(rimM)
      } else if (product.modelType === 'carafe') {
        // --- ARC CARAFE ---
        const points: THREE.Vector2[] = [
          new THREE.Vector2(0, -1.2),
          new THREE.Vector2(0.85, -1.2),
          new THREE.Vector2(0.92, -0.6),
          new THREE.Vector2(0.78, 0.2),
          new THREE.Vector2(0.42, 0.8),
          new THREE.Vector2(0.44, 1.1),
          new THREE.Vector2(0.55, 1.3),
          new THREE.Vector2(0.48, 1.3),
          new THREE.Vector2(0.38, 1.05),
          new THREE.Vector2(0.36, 0.75),
          new THREE.Vector2(0.7, 0.15),
          new THREE.Vector2(0.82, -0.55),
          new THREE.Vector2(0.75, -1.1),
          new THREE.Vector2(0, -1.1),
        ]
        const carafeGeo = new THREE.LatheGeometry(points, 64)
        const carafeMesh = new THREE.Mesh(carafeGeo, bodyMat)
        carafeMesh.castShadow = true
        group.add(carafeMesh)

        const collarGeo = new THREE.CylinderGeometry(0.45, 0.44, 0.2, 48)
        const collarMesh = new THREE.Mesh(collarGeo, accentMat)
        collarMesh.position.y = 0.8
        group.add(collarMesh)
      } else if (product.modelType === 'tote') {
        // --- LINEN TOTE ---
        const toteGeo = new THREE.BoxGeometry(1.6, 1.9, 0.4, 12, 12, 6)
        const toteMesh = new THREE.Mesh(toteGeo, bodyMat)
        toteMesh.castShadow = true
        group.add(toteMesh)

        const strapCurve1 = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.45, 0.95, 0.18),
          new THREE.Vector3(-0.4, 1.6, 0.18),
          new THREE.Vector3(0.4, 1.6, 0.18),
          new THREE.Vector3(0.45, 0.95, 0.18),
        ])
        const strapGeo1 = new THREE.TubeGeometry(strapCurve1, 32, 0.04, 8, false)
        const strap1 = new THREE.Mesh(strapGeo1, accentMat)
        group.add(strap1)

        const strapCurve2 = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.45, 0.95, -0.18),
          new THREE.Vector3(-0.4, 1.6, -0.18),
          new THREE.Vector3(0.4, 1.6, -0.18),
          new THREE.Vector3(0.45, 0.95, -0.18),
        ])
        const strapGeo2 = new THREE.TubeGeometry(strapCurve2, 32, 0.04, 8, false)
        const strap2 = new THREE.Mesh(strapGeo2, accentMat)
        group.add(strap2)
      } else if (product.modelType === 'bottle') {
        // --- THERMAL BOTTLE ---
        const bottleGeo = new THREE.CylinderGeometry(0.65, 0.65, 2.0, 48)
        const bottleMesh = new THREE.Mesh(bottleGeo, bodyMat)
        bottleMesh.castShadow = true
        group.add(bottleMesh)

        const capGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.35, 48)
        const capMesh = new THREE.Mesh(capGeo, accentMat)
        capMesh.position.y = 1.15
        group.add(capMesh)

        const gripGeo = new THREE.CylinderGeometry(0.66, 0.66, 0.1, 48)
        const gripMesh = new THREE.Mesh(gripGeo, rimMat)
        gripMesh.position.y = 0.5
        group.add(gripMesh)
      } else {
        // --- CERAMIC COASTER ---
        const coasterGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.12, 64)
        const coasterMesh = new THREE.Mesh(coasterGeo, bodyMat)
        coasterMesh.castShadow = true
        group.add(coasterMesh)

        const topFaceGeo = new THREE.CircleGeometry(1.15, 64)
        topFaceGeo.rotateX(-Math.PI / 2)
        const topMesh = new THREE.Mesh(topFaceGeo, basinMat)
        topMesh.position.y = 0.062
        group.add(topMesh)

        const edgeRing = new THREE.RingGeometry(1.15, 1.2, 64)
        edgeRing.rotateX(-Math.PI / 2)
        const edgeMesh = new THREE.Mesh(edgeRing, rimMat)
        edgeMesh.position.y = 0.061
        group.add(edgeMesh)
      }
    }

    // Initialize Three.js scene
    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      updateCanvasTextures()
      const bodyCanvas = textureCanvasRef.current!
      const basinCanvas = basinCanvasRef.current!

      const bodyTex = new THREE.CanvasTexture(bodyCanvas)
      bodyTex.wrapS = THREE.RepeatWrapping
      bodyTex.wrapT = THREE.ClampToEdgeWrapping
      bodyTextureRef.current = bodyTex

      const basinTex = new THREE.CanvasTexture(basinCanvas)
      basinTextureRef.current = basinTex

      const scene = new THREE.Scene()
      sceneRef.current = scene

      const aspect = container.clientWidth / (container.clientHeight || 450)
      const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100)
      camera.position.set(0, 0, 11.0)
      cameraRef.current = camera

      let renderer: THREE.WebGLRenderer
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setSize(container.clientWidth, container.clientHeight || 450)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.05
        rendererRef.current = renderer
        container.appendChild(renderer.domElement)
      } catch (err) {
        console.error('WebGL not supported', err)
        setWebGlSupported(false)
        setIsLoading(false)
        return
      }

      // Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.25)
      scene.add(ambientLight)

      const keyLight = new THREE.DirectionalLight(0xfff6ea, 1.8)
      keyLight.position.set(3, 4, 3)
      keyLight.castShadow = true
      keyLight.shadow.mapSize.width = 1024
      keyLight.shadow.mapSize.height = 1024
      scene.add(keyLight)

      const fillLight = new THREE.DirectionalLight(0xe5ecfb, 0.9)
      fillLight.position.set(-3, 2, 2)
      scene.add(fillLight)

      const rimLight = new THREE.DirectionalLight(0xffffff, 1.1)
      rimLight.position.set(0, 3, -3)
      scene.add(rimLight)

      const modelGroup = new THREE.Group()
      scene.add(modelGroup)
      modelGroupRef.current = modelGroup

      buildProductModel(modelGroup, bodyTex, basinTex)
      setIsLoading(false)

      let animId: number
      const animate = () => {
        animId = requestAnimationFrame(animate)

        const rot = rotRef.current
        if (autoRotateRef.current && !rot.isDragging) {
          rot.targetYaw -= 0.007
        }

        rot.yaw += (rot.targetYaw - rot.yaw) * 0.12
        rot.pitch += (rot.targetPitch - rot.pitch) * 0.12
        rot.distance += (rot.targetDistance - rot.distance) * 0.12

        rot.pitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 2.1, rot.pitch))
        rot.distance = Math.max(1.5, Math.min(11.0, rot.distance))

        const r = rot.distance
        const cy = r * Math.sin(rot.pitch)
        const planarR = r * Math.cos(rot.pitch)
        const cx = planarR * Math.sin(rot.yaw)
        const cz = planarR * Math.cos(rot.yaw)

        camera.position.set(cx, cy, cz)
        camera.lookAt(0, 0, 0)

        renderer.render(scene, camera)
      }
      animate()

      const resizeObserver = new ResizeObserver(() => {
        if (!container || !rendererRef.current || !cameraRef.current) return
        const w = container.clientWidth
        const h = container.clientHeight || 450
        cameraRef.current.aspect = w / h
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(w, h)
      })
      resizeObserver.observe(container)

      return () => {
        cancelAnimationFrame(animId)
        resizeObserver.disconnect()
        if (renderer.domElement && renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement)
        }
        renderer.dispose()
      }
    }, [product.modelType])

    // Update models on product / color / finish changes
    useEffect(() => {
      if (!modelGroupRef.current || !bodyTextureRef.current || !basinTextureRef.current) return
      buildProductModel(modelGroupRef.current, bodyTextureRef.current, basinTextureRef.current)
    }, [product, colors, finish])

    // Re-draw textures when elements change
    useEffect(() => {
      updateCanvasTextures()
    }, [elements, colors, finish, backgroundPattern, activeSurfaceId])

    // Mouse handlers for 360° rotation
    const handleMouseDown = (e: React.MouseEvent) => {
      rotRef.current.isDragging = true
      rotRef.current.lastMouseX = e.clientX
      rotRef.current.lastMouseY = e.clientY
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!rotRef.current.isDragging) return
      const deltaX = e.clientX - rotRef.current.lastMouseX
      const deltaY = e.clientY - rotRef.current.lastMouseY
      rotRef.current.lastMouseX = e.clientX
      rotRef.current.lastMouseY = e.clientY

      rotRef.current.targetYaw -= deltaX * 0.008
      rotRef.current.targetPitch += deltaY * 0.008
    }

    const handleMouseUp = () => {
      rotRef.current.isDragging = false
    }

    // Gentle wheel handler that ONLY zooms if user is hovering inside AND does not block natural page scroll
    const handleWheel = (e: React.WheelEvent) => {
      // If user holds Ctrl, zoom in 3D; otherwise allow normal page scrolling!
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        rotRef.current.targetDistance += e.deltaY * 0.003
        rotRef.current.targetDistance = Math.max(1.5, Math.min(11.0, rotRef.current.targetDistance))
      }
    }

    const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        rotRef.current.isDragging = true
        rotRef.current.lastMouseX = e.touches[0].clientX
        rotRef.current.lastMouseY = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 1 && rotRef.current.isDragging) {
        const deltaX = e.touches[0].clientX - rotRef.current.lastMouseX
        const deltaY = e.touches[0].clientY - rotRef.current.lastMouseY
        rotRef.current.lastMouseX = e.touches[0].clientX
        rotRef.current.lastMouseY = e.touches[0].clientY

        rotRef.current.targetYaw -= deltaX * 0.01
        rotRef.current.targetPitch += deltaY * 0.01
      }
    }

    const handleTouchEnd = () => {
      rotRef.current.isDragging = false
    }

    const zoomIn = () => {
      rotRef.current.targetDistance = Math.max(1.5, rotRef.current.targetDistance - 0.8)
    }

    const zoomOut = () => {
      rotRef.current.targetDistance = Math.min(11.0, rotRef.current.targetDistance + 0.8)
    }

    const resetView = () => {
      focusSurface(activeSurfaceId)
    }

    // Active surface elements
    const activeElements = elements.filter((e) => e.surfaceId === activeSurfaceId)

    return (
      <div className={`three-viewer-container relative select-none w-full h-full flex flex-col ${className}`}>
        {/* WebGL Canvas Viewport */}
        <div
          ref={containerRef}
          className="three-canvas-viewport w-full h-full min-h-0 cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#faf9fc]/75 backdrop-blur-md z-20">
            <div className="w-9 h-9 rounded-full border-2 border-[#424a70] border-t-transparent animate-spin mb-3" />
            <span className="text-xs uppercase tracking-wider text-[#424a70] font-medium font-serif">
              Preparing 3D Atelier Preview...
            </span>
          </div>
        )}

        {/* Fallback if WebGL failed */}
        {!webGlSupported && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/90 backdrop-blur-md z-20">
            <p className="text-sm font-semibold text-[#1c2033] mb-1">WebGL 3D Accelerated Preview Unavailable</p>
            <p className="text-xs text-[#687194] max-w-sm">
              Please switch to the 2D Canvas tab in the top toolbar to customize this piece with full precision.
            </p>
          </div>
        )}

        {/* Studio Floor Pedestal Shadow */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 h-8 bg-radial from-[#1c2033]/15 to-transparent rounded-full pointer-events-none blur-md -z-0" />

        {/* Top Left: 360° Studio Pill Badge */}
        <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 flex items-center gap-1.5 sm:gap-2 bg-white/95 backdrop-blur-xl px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[rgba(66,74,112,0.22)] shadow-[0_4px_16px_rgba(28,32,51,0.08)] z-20">
          <Move3d className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#424a70]" />
          <span className="text-[10px] sm:text-[11px] font-bold text-[#1c2033] tracking-wider uppercase font-sans">
            360°<span className="hidden sm:inline"> Atelier</span>
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Top Right: Quick View Angle Presets */}
        <div className="absolute top-2.5 sm:top-4 right-2.5 sm:right-4 flex items-center gap-0.5 sm:gap-1 bg-white/95 backdrop-blur-xl p-0.5 sm:p-1 rounded-lg border border-[rgba(66,74,112,0.25)] shadow-[0_4px_16px_rgba(28,32,51,0.08)] z-20 max-w-[calc(100vw-110px)] overflow-x-auto no-scrollbar">
          {(['front', 'right', 'back', 'left', 'top'] as const).map((angle) => (
            <button
              key={angle}
              onClick={() => {
                switch (angle) {
                  case 'front':
                    rotRef.current.targetYaw = 0
                    rotRef.current.targetPitch = 0.05
                    break
                  case 'right':
                    rotRef.current.targetYaw = Math.PI / 2
                    rotRef.current.targetPitch = 0.05
                    break
                  case 'back':
                    rotRef.current.targetYaw = Math.PI
                    rotRef.current.targetPitch = 0.05
                    break
                  case 'left':
                    rotRef.current.targetYaw = -Math.PI / 2
                    rotRef.current.targetPitch = 0.05
                    break
                  case 'top':
                    rotRef.current.targetYaw = 0
                    rotRef.current.targetPitch = Math.PI / 2.3
                    break
                }
              }}
              className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] uppercase tracking-wider font-bold !text-[#1c2033] bg-white hover:!bg-[#424a70] hover:!text-white rounded-md border border-[rgba(66,74,112,0.25)] transition-all shadow-2xs cursor-pointer shrink-0"
              title={`Inspect ${angle} view`}
            >
              {angle}
            </button>
          ))}
        </div>

        {/* Bottom Floating Toolbar: Zoom, Reset, Auto-rotate with High-Contrast Visibility */}
        <div className="absolute bottom-3.5 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 bg-white/95 backdrop-blur-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg border-2 border-[rgba(66,74,112,0.32)] shadow-[0_12px_32px_rgba(28,32,51,0.22),0_2px_6px_rgba(66,74,112,0.15)] z-20 max-w-[calc(100vw-20px)]">
          <button
            onClick={zoomIn}
            className="p-1 sm:p-1.5 !text-[#1c2033] bg-white hover:!bg-[#424a70] hover:!text-white rounded-md border border-[rgba(66,74,112,0.25)] transition-all shadow-2xs cursor-pointer"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.4]" />
          </button>
          <button
            onClick={zoomOut}
            className="p-1 sm:p-1.5 !text-[#1c2033] bg-white hover:!bg-[#424a70] hover:!text-white rounded-md border border-[rgba(66,74,112,0.25)] transition-all shadow-2xs cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.4]" />
          </button>
          <div className="w-px h-4 sm:h-5 bg-[rgba(66,74,112,0.3)] mx-0.5" />
          <button
            onClick={resetView}
            className="p-1 sm:p-1.5 !text-[#1c2033] bg-white hover:!bg-[#424a70] hover:!text-white rounded-md border border-[rgba(66,74,112,0.25)] transition-all shadow-2xs cursor-pointer"
            title="Focus Active Surface"
            aria-label="Focus active surface"
          >
            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.4]" />
          </button>
          <button
            onClick={toggleAutoRotate}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10.5px] sm:text-xs font-bold rounded-md border transition-all shadow-2xs cursor-pointer whitespace-nowrap ${
              autoRotate
                ? 'tab-active !bg-[#424a70] !text-white border-[#424a70] shadow-xs'
                : 'bg-white !text-[#1c2033] hover:!bg-[#424a70] hover:!text-white border-[rgba(66,74,112,0.25)]'
            }`}
            title={autoRotate ? 'Pause 360° rotation' : 'Auto-rotate product 360° on turntable showcase pedestal'}
          >
            <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? 'Rotating' : 'Auto-Rotate'}</span>
          </button>
        </div>

        {/* Interactive 3D Surface HUD: Clicking & selecting placed elements directly in 3D! */}
        {activeElements.length > 0 && onSelectElement && (
          <div className="absolute bottom-5 left-5 hidden lg:flex flex-col gap-1.5 bg-white/80 backdrop-blur-xl p-2.5 rounded-2xl border border-white/80 shadow-[0_8px_24px_rgba(66,74,112,0.08)] z-10 max-w-[210px]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#687194]">
              Surface Layers
            </span>
            <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
              {activeElements.map((el) => {
                const isSelected = el.id === selectedElementId
                return (
                  <button
                    key={el.id}
                    onClick={() => onSelectElement(el.id)}
                    className={`flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-xs transition-all ${
                      isSelected
                        ? 'tab-active bg-[#424a70] !text-white [&_*]:!text-white font-medium shadow-2xs'
                        : 'text-[#1c2033] hover:bg-slate-100/80'
                    }`}
                  >
                    <span className="truncate max-w-[130px]">
                      {el.type === 'text' ? el.text || 'Text' : el.name || `${el.type} item`}
                    </span>
                    <span className="text-[9px] opacity-75 font-mono capitalize">
                      {el.type}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
)

ThreeProductViewer.displayName = 'ThreeProductViewer'
