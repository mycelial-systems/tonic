import Debug from '@substrate-system/debug'
import { Tonic } from '../src/index.js'
import './style.css'

const debug = Debug('example')

localStorage.setItem('DEBUG', '*')

// @ts-expect-error dev
window.Tonic = Tonic

class DomStateDemo extends Tonic {
    constructor () {
        super()
        this.state = {
            count: 0,
            lastRender: (new Date().toLocaleTimeString())
        }

        const interval = setInterval(() => {
            this.state = {
                ...this.state,
                lastRender: new Date().toLocaleTimeString()
            }
            debug('rerendering...')
            this.reRender()
        }, 2000)

        window.stop = () => { clearInterval(interval) }
    }

    increment () {
        this.state = {
            count: this.state.count + 1,
            lastRender: new Date().toLocaleTimeString()
        }
        this.reRender()
    }

    input (ev:InputEvent) {
        debug('Input value changed:', (ev.target as HTMLInputElement).value)
    }

    handle_click (ev:MouseEvent) {
        ev.preventDefault()
        if (Tonic.match(ev.target as HTMLButtonElement, 'button')) {
            // button clicks only
            this.increment()
        }
    }

    render () {
        return this.html`
            <div class="demo-container">
                <h1>Tonic</h1>
                <p class="demo-description">
                    This component will re-render every 2 seconds.
                    Notice that the input will keep it's value and focus state.
                </p>

                <div class="status-panel">
                    <div class="state">
                        <p><strong>Count:</strong> ${this.state.count}</p>
                        <p>
                            <strong>Last render:</strong>
                            ${this.state.lastRender}
                        </p>
                    </div>

                    <div class="controls">
                        <button>Increment</button>
                    </div>
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
        root.innerHTML = `<${DomStateDemo.TAG} id="demo"></${DomStateDemo.TAG}>`
    }
})
