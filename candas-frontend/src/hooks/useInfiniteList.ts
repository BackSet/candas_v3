import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInfiniteListOptions {
  initialItems?: number
  itemsPerBatch?: number
}

export function useInfiniteList<T>(items: T[], options: UseInfiniteListOptions = {}) {
  const { initialItems = 50, itemsPerBatch = 50 } = options
  const [visibleItemsCount, setVisibleItemsCount] = useState(initialItems)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Reset when items change (e.g. filtering)
  useEffect(() => {
    setVisibleItemsCount(initialItems)
  }, [items, initialItems])

  const showMoreItems = useCallback(() => {
    setVisibleItemsCount(prev => {
      if (prev >= items.length) return prev
      return prev + itemsPerBatch
    })
  }, [items.length, itemsPerBatch])

  useEffect(() => {
    const element = observerTarget.current
    if (!element) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleItemsCount < items.length) {
          showMoreItems()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [visibleItemsCount, items.length, showMoreItems])

  const visibleItems = items.slice(0, visibleItemsCount)

  return {
    visibleItems,
    observerTarget,
    hasMore: visibleItemsCount < items.length
  }
}
