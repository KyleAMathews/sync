import { describe, it, expect } from "vitest"
import {
  createChangeProxy,
  createArrayChangeProxy,
  withChangeTracking,
  withArrayChangeTracking,
} from "./proxy"

describe(`Proxy Library`, () => {
  describe(`createChangeProxy`, () => {
    it(`should track changes to an object`, () => {
      const obj = { name: `John`, age: 30 }
      const { proxy, getChanges } = createChangeProxy(obj)

      // Make changes to the proxy
      proxy.name = `Jane`
      proxy.age = 31

      // Check that the changes are tracked
      expect(getChanges()).toEqual({
        name: `Jane`,
        age: 31,
      })

      // Check that the original object is modified
      expect(obj).toEqual({
        name: `Jane`,
        age: 31,
      })
    })

    it(`should only track properties that actually change`, () => {
      const obj = { name: `John`, age: 30 }
      const { proxy, getChanges } = createChangeProxy(obj)

      // Set a property to the same value
      proxy.name = `John`
      // Change another property
      proxy.age = 31

      // Only the changed property should be tracked
      expect(getChanges()).toEqual({
        age: 31,
      })
    })

    it(`should handle nested property access`, () => {
      const obj = { user: { name: `John`, age: 30 } }
      const { proxy, getChanges } = createChangeProxy(obj)

      // Change a nested property
      proxy.user = { name: `Jane`, age: 31 }

      // The entire user object should be tracked as a change
      expect(getChanges()).toEqual({
        user: { name: `Jane`, age: 31 },
      })
    })

    it(`should track when object properties are changed`, () => {
      const obj = { name: `John`, age: 30, active: false }
      const { proxy, getChanges } = createChangeProxy(obj)

      proxy.name = `Jane`
      proxy.active = true

      expect(getChanges()).toEqual({
        name: `Jane`,
        active: true,
      })
      expect(obj.name).toBe(`Jane`)
      expect(obj.active).toBe(true)
    })

    it(`should track changes to properties within nested objects`, () => {
      const obj = {
        user: {
          name: `John`,
          contact: {
            email: `john@example.com`,
            phone: `123-456-7890`,
          },
        },
      }
      const { proxy, getChanges } = createChangeProxy(obj)

      proxy.user.contact = {
        email: `john.doe@example.com`,
        phone: `123-456-7890`,
      }

      expect(getChanges()).toEqual({
        user: {
          name: `John`,
          contact: {
            email: `john.doe@example.com`,
            phone: `123-456-7890`,
          },
        },
      })
    })

    it(`should track when properties are deleted from objects`, () => {
      const obj = { name: `John`, age: 30, role: `admin` }
      const { proxy, getChanges } = createChangeProxy(obj)

      delete proxy.role

      expect(getChanges()).toEqual({
        role: undefined,
      })
      expect(obj).toEqual({
        name: `John`,
        age: 30,
      })
    })

    it(`should not track properties when values remain the same`, () => {
      const obj = { name: `John`, age: 30, active: true }
      const { proxy, getChanges } = createChangeProxy(obj)

      proxy.name = `John`
      proxy.age = 30
      proxy.active = true

      expect(getChanges()).toEqual({})
      expect(obj).toEqual({ name: `John`, age: 30, active: true })
    })

    it(`should properly handle objects with circular references`, () => {
      const obj: unknown = { name: `John`, age: 30 }
      obj.self = obj // Create circular reference

      const { proxy, getChanges } = createChangeProxy(obj)

      proxy.name = `Jane`

      expect(getChanges()).toEqual({
        name: `Jane`,
      })
      expect(obj.name).toBe(`Jane`)
    })

    it(`should properly handle Date object mutations`, () => {
      const obj = {
        name: `John`,
        createdAt: new Date(`2023-01-01`),
      }
      const { proxy, getChanges } = createChangeProxy(obj)

      const newDate = new Date(`2023-02-01`)
      proxy.createdAt = newDate

      expect(getChanges()).toEqual({
        createdAt: newDate,
      })
      expect(obj.createdAt).toEqual(newDate)
    })

    it(`should track changes to custom class properties`, () => {
      class Person {
        name: string
        age: number

        constructor(name: string, age: number) {
          this.name = name
          this.age = age
        }
      }

      const obj = {
        person: new Person(`John`, 30),
      }

      const { proxy, getChanges } = createChangeProxy(obj)

      proxy.person = new Person(`Jane`, 25)

      expect(getChanges()).toEqual({
        person: new Person(`Jane`, 25),
      })
      expect(obj.person).toEqual(new Person(`Jane`, 25))
    })

    it(`should track changes in deeply nested object structures`, () => {
      const obj = {
        company: {
          department: {
            team: {
              lead: {
                name: `John`,
                role: `Team Lead`,
              },
              members: [`Alice`, `Bob`],
            },
          },
        },
      }

      const { proxy, getChanges } = createChangeProxy(obj)

      // Access the nested property through the proxy chain
      const companyProxy = proxy.company
      const departmentProxy = companyProxy.department
      const teamProxy = departmentProxy.team
      const leadProxy = teamProxy.lead
      leadProxy.name = `Jane`

      expect(getChanges()).toEqual({
        company: {
          department: {
            team: {
              lead: {
                name: `Jane`,
                role: `Team Lead`,
              },
              members: [`Alice`, `Bob`],
            },
          },
        },
      })
    })

    it(`should handle regular expression mutations`, () => {
      const obj = {
        pattern: /test/i,
      }

      const { proxy, getChanges } = createChangeProxy(obj)

      proxy.pattern = /new-pattern/g

      expect(getChanges()).toEqual({
        pattern: /new-pattern/g,
      })
      expect(obj.pattern).toEqual(/new-pattern/g)
    })

    it(`should properly track BigInt type values`, () => {
      const obj = {
        id: BigInt(123456789),
      }

      const { proxy, getChanges } = createChangeProxy(obj)

      proxy.id = BigInt(987654321)

      expect(getChanges()).toEqual({
        id: BigInt(987654321),
      })
      expect(obj.id).toBe(BigInt(987654321))
    })

    it(`should handle complex objects with multiple special types`, () => {
      const obj = {
        id: BigInt(123),
        pattern: /test/,
        date: new Date(`2023-01-01`),
      }

      const { proxy, getChanges } = createChangeProxy(obj)

      proxy.id = BigInt(456)
      proxy.pattern = /updated/
      proxy.date = new Date(`2023-06-01`)

      expect(getChanges()).toEqual({
        id: BigInt(456),
        pattern: /updated/,
        date: new Date(`2023-06-01`),
      })
    })
  })

  describe(`createArrayChangeProxy`, () => {
    it(`should track changes to an array of objects`, () => {
      const objs = [
        { id: 1, name: `John` },
        { id: 2, name: `Jane` },
      ]
      const { proxies, getChanges } = createArrayChangeProxy(objs)

      // Make changes to the proxies
      proxies[0].name = `Johnny`
      proxies[1].name = `Janet`

      // Check that the changes are tracked
      expect(getChanges()).toEqual([{ name: `Johnny` }, { name: `Janet` }])

      // Check that the original objects are modified
      expect(objs).toEqual([
        { id: 1, name: `Johnny` },
        { id: 2, name: `Janet` },
      ])
    })

    it(`should track when items are added to arrays`, () => {
      const obj = {
        items: [`apple`, `banana`],
      }
      const { proxy, getChanges } = createChangeProxy(obj)

      proxy.items = [...obj.items, `cherry`]

      expect(getChanges()).toEqual({
        items: [`apple`, `banana`, `cherry`],
      })
      expect(obj.items).toEqual([`apple`, `banana`, `cherry`])
    })

    it(`should track array pop() operations`, () => {
      const objs = [{ items: [`apple`, `banana`, `cherry`] }]
      const { proxies, getChanges } = createArrayChangeProxy(objs)

      // Create a new array without the last element
      proxies[0].items = proxies[0].items.slice(0, -1)

      expect(getChanges()).toEqual([
        {
          items: [`apple`, `banana`],
        },
      ])
      expect(objs[0].items).toEqual([`apple`, `banana`])
    })

    it(`should track array shift() operations`, () => {
      const objs = [{ items: [`apple`, `banana`, `cherry`] }]
      const { proxies, getChanges } = createArrayChangeProxy(objs)

      // Create a new array without the first element
      proxies[0].items = proxies[0].items.slice(1)

      expect(getChanges()).toEqual([
        {
          items: [`banana`, `cherry`],
        },
      ])
      expect(objs[0].items).toEqual([`banana`, `cherry`])
    })

    it(`should track array unshift() operations`, () => {
      const objs = [{ items: [`banana`, `cherry`] }]
      const { proxies, getChanges } = createArrayChangeProxy(objs)

      // Create a new array with an element added at the beginning
      proxies[0].items = [`apple`, ...proxies[0].items]

      expect(getChanges()).toEqual([
        {
          items: [`apple`, `banana`, `cherry`],
        },
      ])
      expect(objs[0].items).toEqual([`apple`, `banana`, `cherry`])
    })

    it(`should track array splice() operations`, () => {
      const objs = [{ items: [`apple`, `banana`, `cherry`, `date`] }]
      const { proxies, getChanges } = createArrayChangeProxy(objs)

      // Create a new array with elements replaced in the middle
      const newItems = [...proxies[0].items]
      newItems.splice(1, 2, `blueberry`, `cranberry`)
      proxies[0].items = newItems

      expect(getChanges()).toEqual([
        {
          items: [`apple`, `blueberry`, `cranberry`, `date`],
        },
      ])
      expect(objs[0].items).toEqual([`apple`, `blueberry`, `cranberry`, `date`])
    })

    it(`should track array sort() operations`, () => {
      const objs = [{ items: [`cherry`, `apple`, `banana`] }]
      const { proxies, getChanges } = createArrayChangeProxy(objs)

      // Create a new sorted array
      proxies[0].items = [...proxies[0].items].sort()

      expect(getChanges()).toEqual([
        {
          items: [`apple`, `banana`, `cherry`],
        },
      ])
      expect(objs[0].items).toEqual([`apple`, `banana`, `cherry`])
    })

    it(`should track changes in multi-dimensional arrays`, () => {
      const objs = [
        {
          matrix: [
            [1, 2],
            [3, 4],
          ],
        },
      ]
      const { proxies, getChanges } = createArrayChangeProxy(objs)

      // Update a nested array
      const newMatrix = [...proxies[0].matrix]
      newMatrix[0] = [5, 6]
      proxies[0].matrix = newMatrix

      expect(getChanges()).toEqual([
        {
          matrix: [
            [5, 6],
            [3, 4],
          ],
        },
      ])
      expect(objs[0].matrix).toEqual([
        [5, 6],
        [3, 4],
      ])
    })

    it(`should handle objects containing arrays as properties`, () => {
      const objs = [
        {
          user: {
            name: `John`,
            hobbies: [`reading`, `swimming`],
          },
        },
      ]
      const { proxies, getChanges } = createArrayChangeProxy(objs)

      // Update the array within the nested object
      const updatedUser = { ...proxies[0].user }
      updatedUser.hobbies = [...updatedUser.hobbies, `cycling`]
      proxies[0].user = updatedUser

      expect(getChanges()).toEqual([
        {
          user: {
            name: `John`,
            hobbies: [`reading`, `swimming`, `cycling`],
          },
        },
      ])
      expect(objs[0].user.hobbies).toEqual([`reading`, `swimming`, `cycling`])
    })

    it(`should handle Set and Map objects`, () => {
      const set = new Set([1, 2, 3])
      const map = new Map([
        [`key1`, `value1`],
        [`key2`, `value2`],
      ])

      const objs = [
        {
          collections: {
            set,
            map,
          },
        },
      ]
      const { proxies, getChanges } = createArrayChangeProxy(objs)

      // Create new collections with modifications
      const newSet = new Set([...set, 4])
      const newMap = new Map([...map, [`key3`, `value3`]])

      proxies[0].collections = {
        set: newSet,
        map: newMap,
      }

      expect(getChanges()).toEqual([
        {
          collections: {
            set: newSet,
            map: newMap,
          },
        },
      ])
      expect(objs[0].collections.set).toEqual(newSet)
      expect(objs[0].collections.map).toEqual(newMap)
    })
  })

  describe(`withChangeTracking`, () => {
    it(`should track changes made in the callback`, () => {
      const obj = { name: `John`, age: 30 }

      const changes = withChangeTracking(obj, (proxy) => {
        proxy.name = `Jane`
        proxy.age = 31
      })

      // Check that the changes are tracked
      expect(changes).toEqual({
        name: `Jane`,
        age: 31,
      })

      // Check that the original object is modified
      expect(obj).toEqual({
        name: `Jane`,
        age: 31,
      })
    })
  })

  describe(`withArrayChangeTracking`, () => {
    it(`should track changes made to multiple objects in the callback`, () => {
      const objs = [
        { id: 1, name: `John` },
        { id: 2, name: `Jane` },
      ]

      const changes = withArrayChangeTracking(objs, (proxies) => {
        proxies[0].name = `Johnny`
        proxies[1].name = `Janet`
      })

      // Check that the changes are tracked
      expect(changes).toEqual([{ name: `Johnny` }, { name: `Janet` }])

      // Check that the original objects are modified
      expect(objs).toEqual([
        { id: 1, name: `Johnny` },
        { id: 2, name: `Janet` },
      ])
    })

    it(`should handle empty changes`, () => {
      const objs = [
        { id: 1, name: `John` },
        { id: 2, name: `Jane` },
      ]

      const changes = withArrayChangeTracking(objs, () => {
        // No changes made
      })

      // No changes should be tracked
      expect(changes).toEqual([{}, {}])

      // Original objects should remain unchanged
      expect(objs).toEqual([
        { id: 1, name: `John` },
        { id: 2, name: `Jane` },
      ])
    })
  })

  describe(`Advanced Proxy Change Detection`, () => {
    describe(`Structural Sharing and Equality Detection`, () => {
      it(`should return the original object when changes are reverted`, () => {
        const obj = { name: `John`, age: 30 }
        const { proxy, getChanges } = createChangeProxy(obj)

        // Make changes
        proxy.name = `Jane`
        // Revert changes
        proxy.name = `John`

        // No changes should be tracked
        expect(getChanges()).toEqual({})
      })

      it(`should handle Maps that have items added and then removed`, () => {
        const map = new Map([[`key1`, `value1`]])
        const obj = { myMap: map }
        const { proxy, getChanges } = createChangeProxy(obj)

        // Create a new map with an added item
        const modifiedMap = new Map(map)
        modifiedMap.set(`key2`, `value2`)
        proxy.myMap = modifiedMap

        // Create a new map that's identical to the original
        const revertedMap = new Map([[`key1`, `value1`]])
        proxy.myMap = revertedMap

        // No changes should be tracked since final state matches initial state
        expect(getChanges()).toEqual({})
      })

      it(`should handle restoring original references to nested objects`, () => {
        const nestedObj = { value: 42 }
        const obj = { nested: nestedObj, other: `data` }
        const { proxy, getChanges } = createChangeProxy(obj)

        // Replace with different object
        proxy.nested = { value: 100 }

        // Restore original reference
        proxy.nested = nestedObj

        // No changes should be tracked for nested
        expect(getChanges()).toEqual({})
      })
    })
  })
})
