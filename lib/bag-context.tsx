'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface Product {
  name: string
  type: string
  price: string
  image: string
  category: string
}

export interface BagItem {
  product: Product
  quantity: number
}

interface BagContextType {
  items: BagItem[]
  isBagOpen: boolean
  setIsBagOpen: (open: boolean) => void
  addToBag: (product: Product, quantity?: number) => void
  removeFromBag: (productName: string) => void
  updateQuantity: (productName: string, delta: number) => void
  setQuantity: (productName: string, quantity: number) => void
  clearBag: () => void
  totalCount: number
  totalPrice: number
  toastMessage: string | null
  setToastMessage: (msg: string | null) => void
}

const BagContext = createContext<BagContextType | undefined>(undefined)

export function parsePrice(priceStr: string): number {
  const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''))
  return isNaN(num) ? 0 : num
}

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([])
  const [isBagOpen, setIsBagOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('unifort_bag_v2') || localStorage.getItem('unifort_bag_v1')
      if (stored) {
        const parsed = JSON.parse(stored)
        const imageMap: Record<string, string> = {
          'No. 01 Obsidian Plate': '/unifort-plate-light.jpg',
          'No. 04 Violet Tumbler': '/unifort-tumbler-light.jpg',
          'No. 07 Arc Carafe': '/unifort-carafe-light.jpg',
          'No. 12 Basalt Bowl': '/unifort-bowl-light.jpg',
        }
        const updated = parsed.map((item: BagItem) => {
          if (imageMap[item.product.name]) {
            return {
              ...item,
              product: {
                ...item.product,
                image: imageMap[item.product.name],
              },
            }
          }
          return item
        })
        setItems(updated)
      }
    } catch (e) {
      console.error('Failed to load bag from localStorage', e)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('unifort_bag_v2', JSON.stringify(items))
      } catch (e) {
        console.error('Failed to save bag to localStorage', e)
      }
    }
  }, [items, isLoaded])

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null)
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const addToBag = (product: Product, quantityToAdd = 1) => {
    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex((i) => i.product.name === product.name)
      if (existingIdx > -1) {
        const next = [...prevItems]
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + quantityToAdd,
        }
        return next
      } else {
        return [...prevItems, { product, quantity: quantityToAdd }]
      }
    })
    setToastMessage(`Added "${product.name}" to your bag`)
  }

  const removeFromBag = (productName: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.product.name !== productName))
  }

  const updateQuantity = (productName: string, delta: number) => {
    setItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.product.name === productName) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as BagItem[]
    )
  }

  const setQuantity = (productName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromBag(productName)
    } else {
      setItems((prevItems) =>
        prevItems.map((item) => (item.product.name === productName ? { ...item, quantity } : item))
      )
    }
  }

  const clearBag = () => {
    setItems([])
  }

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + parsePrice(item.product.price) * item.quantity, 0)

  return (
    <BagContext.Provider
      value={{
        items,
        isBagOpen,
        setIsBagOpen,
        addToBag,
        removeFromBag,
        updateQuantity,
        setQuantity,
        clearBag,
        totalCount,
        totalPrice,
        toastMessage,
        setToastMessage,
      }}
    >
      {children}
    </BagContext.Provider>
  )
}

export function useBag() {
  const context = useContext(BagContext)
  if (!context) {
    throw new Error('useBag must be used within a BagProvider')
  }
  return context
}
