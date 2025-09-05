import Debug from '@substrate-system/debug'
import { Tonic } from '../src/index.js'
import './style.css'

const debug = Debug('example')

localStorage.setItem('DEBUG', '*')

class DomStateDemo extends Tonic {
    id = 'demo'

    constructor () {
        super()
        // Initialize state using Tonic's built-in state management
        this.state = {
            count: 0,
            lastRender: (new Date().toLocaleTimeString())
        }

        setInterval(() => {
            this.state = {
                ...this.state,
                lastRender: new Date().toLocaleTimeString()
            }
            debug('rerendering...')
            this.reRender()
        }, 2000)
    }

    increment () {
        this.state = {
            count: this.state.count + 1,
            lastRender: new Date().toLocaleTimeString()
        }
        this.reRender()
    }

    input (ev) {
        debug('Input value changed:', ev.target.value)
    }

    submit (ev) {
        ev.preventDefault()
        debug('Form submitted')
    }

    render () {
        return this.html`
            <div class="demo-container">
                <h1>DOM State Preservation Demo</h1>
                <p class="demo-description">
                    This demo shows that focus and input values 
                    are preserved when the component re-renders.
                </p>

                <div class="status-panel">
                    <p><strong>Count:</strong> ${this.state.count}</p>
                    <p>
                        <strong>Last render:</strong>
                        ${this.state.lastRender}
                    </p>
                </div>

                <form>
                    <div class="form-group">
                        <label class="form-label">
                            <strong>
                                Text Input
                            </strong>
                        </label>
                        <input 
                            type="text" 
                            placeholder="Type something here..." 
                            class="form-input"
                        />
                    </div>
                </form>
            </div>
        `
    }
}

// Register the component first
Tonic.add(DomStateDemo, 'dom-state-demo')

// Wait for DOM to be ready, then create the component
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root')
    if (root) {
        root.innerHTML = `<${DomStateDemo.tag}></${DomStateDemo.tag}>`
    }
})
