import { Tonic } from '../src/index.js'

export class SsrExample extends Tonic {
    defaults () {
        return { world: 'world' }
    }

    render () {
        return this.html`<div class="hello">
            hello ${this.props.world}
        </div>`
    }
}
