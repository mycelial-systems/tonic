import { Tonic } from '../src/index.js'
import { hydrate } from '../src/hydrate.js'
import { AppCounter } from './counter.js'
import { AppButton } from './button.js'
import './button.css'

const state = hydrate(() => {
    Tonic.add(AppButton)
    Tonic.add(AppCounter)
})

console.log('Hydrated with state:', state)
