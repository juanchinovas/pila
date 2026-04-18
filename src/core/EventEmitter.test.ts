import { describe, it, expect } from 'vitest'
import { EventEmitter } from './EventEmitter'

interface TestEvents {
  greet: { name: string }
  count: number
}

describe('EventEmitter', () => {
  it('calls a registered listener with the correct payload', () => {
    const ee = new EventEmitter<TestEvents>()
    const received: string[] = []
    ee.on('greet', ({ name }) => received.push(name))
    ee.emit('greet', { name: 'Alice' })
    expect(received).toEqual(['Alice'])
  })

  it('calls multiple listeners for the same event', () => {
    const ee = new EventEmitter<TestEvents>()
    const log: number[] = []
    ee.on('count', (n) => log.push(n))
    ee.on('count', (n) => log.push(n * 2))
    ee.emit('count', 5)
    expect(log).toEqual([5, 10])
  })

  it('off() removes a listener', () => {
    const ee = new EventEmitter<TestEvents>()
    const log: string[] = []
    const listener = ({ name }: { name: string }) => log.push(name)
    ee.on('greet', listener)
    ee.off('greet', listener)
    ee.emit('greet', { name: 'Bob' })
    expect(log).toHaveLength(0)
  })

  it('on() returns an unsubscribe function', () => {
    const ee = new EventEmitter<TestEvents>()
    const log: string[] = []
    const unsub = ee.on('greet', ({ name }) => log.push(name))
    unsub()
    ee.emit('greet', { name: 'Carol' })
    expect(log).toHaveLength(0)
  })

  it('removeAllListeners() clears all events', () => {
    const ee = new EventEmitter<TestEvents>()
    const log: number[] = []
    ee.on('count', (n) => log.push(n))
    ee.removeAllListeners()
    ee.emit('count', 1)
    expect(log).toHaveLength(0)
  })

  it('emitting an event with no listeners does not throw', () => {
    const ee = new EventEmitter<TestEvents>()
    expect(() => ee.emit('count', 42)).not.toThrow()
  })
})
