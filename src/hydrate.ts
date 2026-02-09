import { Tonic } from './index.js'

/**
 * Hydrate server-rendered Tonic components.
 *
 * Call this to wrap component registration so that existing
 * server-rendered DOM is preserved instead of being re-rendered.
 * Event handlers are still attached, props are parsed from
 * attributes, and lifecycle hooks (`willConnect`, `connected`)
 * are called.
 *
 * If a `<script type="application/json" data-tonic-ssr>` tag
 * exists in the document, its JSON content is parsed and used
 * to restore complex props (objects, arrays) for components
 * with matching `id` attributes.
 *
 * @param callback Register your components inside this callback
 * @returns The parsed SSR state, or null if none was embedded
 *
 * @example
 * ```ts
 * import { hydrate } from '@substrate-system/tonic/hydrate'
 * import { Tonic } from '@substrate-system/tonic'
 * import { MyApp } from './components.js'
 *
 * const state = hydrate(() => {
 *     Tonic.add(MyApp)
 * })
 * ```
 */
export function hydrate (
    callback:() => void
):Record<string, any>|null {
    const script = document.querySelector(
        'script[data-tonic-ssr]'
    )

    const state:Record<string, any>|null = script ?
        JSON.parse(script.textContent || '{}') :
        null

    Tonic._ssrState = state
    Tonic._hydrating = true

    callback()

    Tonic._hydrating = false
    Tonic._ssrState = null

    return state
}
