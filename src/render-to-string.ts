import * as parse5 from 'parse5'
import type { Tonic, TonicTemplate } from './index.js'

// Set up minimal globals needed for Tonic SSR in Node.js
// Only set these up if we're in a Node.js environment (no window)
if (typeof window === 'undefined') {
    // @ts-expect-error its ok
    (global as any).window = {
        HTMLElement: class HTMLElement {
            children:any[] = []
            childNodes:any[] = []
            attributes:any[] = []

            getRootNode () {
                return this
            }

            addEventListener () {}
            dispatchEvent () {}
        },
        customElements: {
            define: () => {},
            get: () => null
        },
        CustomEvent: class CustomEvent {}
    }
}

/**
 * Render a Tonic component instance to an HTML string.
 *
 * This function takes a Tonic component instance, calls its render method,
 * and recursively processes any nested Tonic components to produce a complete
 * HTML string suitable for server-side rendering.
 *
 * @param component - A Tonic component instance to render
 * @returns A promise that resolves to an HTML string
 *
 * @example
 * ```ts
 * import { render } from '@substrate-system/tonic/render-to-string'
 * import { MyComponent } from './components'
 *
 * const component = new MyComponent()
 * const html = await render(component)
 * console.log(html) // <div>...</div>
 * ```
 */
export async function render (
    component:InstanceType<typeof Tonic>
):Promise<string> {
    // Get the registry of all registered Tonic components
    // @ts-expect-error _reg is private but we need it for SSR
    const registry = component.constructor._reg || {}

    // Initialize props with defaults if not already set
    if (!component.props || Object.keys(component.props).length === 0) {
        component.props = component.defaults?.() || {}
    } else {
        // Merge defaults with existing props
        component.props = Object.assign(component.defaults?.() || {}, component.props)
    }

    // Call the component's render method to get the template
    const template:TonicTemplate|Promise<TonicTemplate> = component.render()
    const resolvedTemplate = await Promise.resolve(template)

    // Extract the raw HTML string from the TonicTemplate
    const htmlString = resolvedTemplate.rawText

    // Parse the HTML string into a parse5 document fragment
    const fragment = parse5.parseFragment(htmlString)

    // Recursively visit and render nested Tonic components
    await visitNode(fragment, registry)

    // Serialize the document fragment back to an HTML string
    return parse5.serialize(fragment)
}

function escapeAttr (s:string):string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function getTagName (name:string):string {
    return name.match(/[A-Z][a-z0-9]*/g)!
        .join('-').toLowerCase()
}

/**
 * Encode component props as HTML attribute string.
 *
 * Simple types (string, number, boolean, null) are encoded
 * using Tonic's type marker conventions. Complex types
 * (objects, arrays, functions) are skipped -- put those in
 * the `state` JSON instead.
 */
function propsToAttrs (
    props:Record<string, any>,
    id?:string
):string {
    const parts:string[] = []

    if (id) parts.push(`id="${escapeAttr(id)}"`)

    for (const [key, value] of Object.entries(props)) {
        const attr = key
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase()

        if (value === null) {
            parts.push(`${attr}="null__null"`)
        } else if (typeof value === 'boolean') {
            parts.push(`${attr}="${value}__boolean"`)
        } else if (typeof value === 'number') {
            parts.push(`${attr}="${value}__float"`)
        } else if (typeof value === 'string') {
            parts.push(`${attr}="${escapeAttr(value)}"`)
        }
        // Complex types (objects, arrays, functions) are
        // skipped -- they belong in the state JSON.
    }

    return parts.length ? ' ' + parts.join(' ') : ''
}

/**
 * Generate a `<script>` tag containing serialized hydration
 * state.
 *
 * Embed this in your HTML page so the client-side `hydrate`
 * function can read it. The state object keys should be
 * component `id` attributes, mapping to the props for that
 * component.
 *
 * @example
 * ```ts
 * const script = getHydrationScript({
 *     app: { title: 'Hello', items: [1, 2, 3] }
 * })
 * // <script type="application/json" data-tonic-ssr>
 * //   {"app":{"title":"Hello","items":[1,2,3]}}
 * // </script>
 * ```
 */
export function getHydrationScript (
    state:Record<string, any>
):string {
    const json = JSON.stringify(state)
    return '<script type="application/json" ' +
        'data-tonic-ssr>' + json + '</script>'
}

/**
 * Wrap rendered component content in its custom element tag,
 * with props encoded as attributes.
 *
 * Use this to build a hydratable HTML page from
 * server-rendered content.
 *
 * @param component  The component instance that was rendered
 * @param content    The HTML string from `render(component)`
 * @param opts.id    Element `id` attribute (required for
 *                   state transfer via hydration)
 * @param opts.tagName  Override the tag name (defaults to
 *                      the class name converted to kebab-case)
 * @param opts.state    Hydration state -- if provided, a
 *                      `<script data-tonic-ssr>` tag is
 *                      appended with the serialized JSON
 *
 * @example
 * ```ts
 * import { render, toHtml } from
 *     '@substrate-system/tonic/render-to-string'
 *
 * const app = new MyApp()
 * app.props = { title: 'Hello', items: [1, 2, 3] }
 * const content = await render(app)
 *
 * const html = toHtml(app, content, {
 *     id: 'app',
 *     state: {
 *         app: { title: 'Hello', items: [1, 2, 3] }
 *     }
 * })
 * ```
 */
export function toHtml (
    component:InstanceType<typeof Tonic>,
    content:string,
    opts?:{
        id?:string;
        tagName?:string;
        state?:Record<string, any>;
    }
):string {
    const tag = opts?.tagName ||
        getTagName(component.constructor.name)

    const attrs = propsToAttrs(component.props, opts?.id)

    let html = `<${tag}${attrs}>${content}</${tag}>`

    if (opts?.state) {
        html += '\n' + getHydrationScript(opts.state)
    }

    return html
}

/**
 * Recursively visit nodes in the parse5 AST
 * and render any Tonic components.
 */
async function visitNode (node:any, registry:Record<string, any>):Promise<void> {
    // Check if this node is a registered Tonic component
    if (node.tagName && registry[node.tagName]) {
        const ComponentClass = registry[node.tagName]

        // Create an instance of the component
        const instance = new ComponentClass()

        // Set up the component's attributes/props from the node
        if (node.attrs && node.attrs.length > 0) {
            const props = {}
            for (const attr of node.attrs) {
                // Convert kebab-case attribute names to camelCase prop names
                const propName = attr.name.replace(/-(.)/g, (_, char) => char.toUpperCase())
                props[propName] = attr.value
            }
            instance.props = Object.assign(instance.defaults?.() || {}, props)
        } else {
            instance.props = instance.defaults?.() || {}
        }

        // Render the component
        const template = await Promise.resolve(instance.render())
        const childHtml = template.rawText

        // Parse the rendered HTML
        const childFragment = parse5.parseFragment(childHtml)

        // Recursively visit children of the rendered component
        for (const child of childFragment.childNodes) {
            if ('childNodes' in child && child.childNodes) {
                await visitNode(child, registry)
            }
        }

        // Replace the component tag with its rendered content
        node.childNodes = childFragment.childNodes
    }

    // Visit all child nodes
    if ('childNodes' in node && node.childNodes) {
        for (const child of node.childNodes) {
            await visitNode(child, registry)
        }
    }
}
