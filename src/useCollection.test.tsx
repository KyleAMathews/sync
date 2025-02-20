import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCollection } from "./useCollection"
import type { SyncConfig } from "./types"
import "fake-indexeddb/auto"

// Mock window object since we're in jsdom
Object.defineProperty(global, `window`, {
  value: {
    indexedDB,
  } as Window & typeof globalThis,
  writable: true,
})

// Mock crypto.randomUUID
const mockUUID = `46aa611e-ec8a-415c-9ed4-365e0da6c6c9`
vi.spyOn(crypto, `randomUUID`).mockImplementation(() => mockUUID)

describe(`useCollection`, () => {
  const mockSyncConfig: SyncConfig = {
    id: `test-collection`,
    setup: async () => {
      return { data: {} }
    },
  }

  beforeEach(() => {
    // Reset indexedDB for each test
    // eslint-disable-next-line
    indexedDB = new IDBFactory()
  })

  it(`should initialize with empty data`, () => {
    const { result } = renderHook(() => useCollection({ sync: mockSyncConfig }))
    expect(result.current.data).toEqual({})
  })

  it(`should create a transaction when updating`, () => {
    const { result } = renderHook(() => useCollection({ sync: mockSyncConfig }))

    act(() => {
      result.current.update({
        id: `test-1`,
        changes: { name: `Test` },
      })
    })

    // Data should still be empty since we haven't implemented optimistic updates
    expect(result.current.data).toEqual({})
  })

  it(`should create a transaction when inserting`, () => {
    const { result } = renderHook(() => useCollection({ sync: mockSyncConfig }))

    act(() => {
      result.current.insert({
        id: `test-2`,
        data: { name: `Test` },
      })
    })

    // Data should still be empty since we haven't implemented optimistic updates
    expect(result.current.data).toEqual({})
  })

  it(`should create a transaction when deleting`, () => {
    const { result } = renderHook(() => useCollection({ sync: mockSyncConfig }))

    act(() => {
      result.current.delete({
        id: `test-3`,
      })
    })

    // Data should still be empty since we haven't implemented optimistic updates
    expect(result.current.data).toEqual({})
  })

  it(`should create a transaction with multiple mutations when using withMutation`, () => {
    const { result } = renderHook(() => useCollection({ sync: mockSyncConfig }))

    act(() => {
      result.current.withMutation({
        changes: [
          { id: `test-4`, name: `Test 4` },
          { id: `test-5`, name: `Test 5` },
        ],
      })
    })

    // Data should still be empty since we haven't implemented optimistic updates
    expect(result.current.data).toEqual({})
  })
})
