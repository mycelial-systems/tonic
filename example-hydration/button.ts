import { Tonic } from '../src/index.js'

export class AppButton extends Tonic<{
    disabled?:boolean;
}> {
    async handleAsync (fn:()=>Promise<void>) {
        this.state.spinning = true
        this.reRender()
        try {
            await fn()
        } finally {
            this.state.spinning = false
            this.reRender()
        }
    }

    render () {
        let spinning = false
        try {
            spinning = !!this.state?.spinning
        } catch (_e) {
            // state requires an id; during SSR it may
            // not be available yet.
        }
        const classes = [
            'btn',
            spinning ? 'spinning' : ''
        ].filter(Boolean).join(' ')

        const isDisabled = spinning || this.props.disabled

        return this.html`<button
            class="${classes}"
            ${isDisabled ? 'disabled' : ''}
        >
            <span class="btn-content">
                ${this.childNodes}
            </span>
        </button>`
    }
}
