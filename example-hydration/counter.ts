import { Tonic } from '../src/index.js'

export class AppCounter extends Tonic<{ count:number }> {
    defaults () {
        return { count: 0 }
    }

    handle_click (ev:MouseEvent) {
        ev.preventDefault()
        if (Tonic.match(ev.target as HTMLElement, 'button')) {
            this.reRender({
                count: this.props.count + 1
            })
        }
    }

    render () {
        return this.html`
            <div class="counter">
                <p>
                    <strong>Count:</strong>
                    ${this.props.count}
                </p>
                <app-button>Increment</app-button>
            </div>
        `
    }
}
