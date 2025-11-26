import * as parse5 from 'parse5'
import type { Tonic, TonicTemplate } from './index.js'

// Set up minimal globals needed for Tonic SSR in Node.js
// Only set these up if we're in a Node.js environment (no window)
if (typeof window === 'undefined') {
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

/**
 * Recursively visit nodes in the parse5 AST and render any Tonic components
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
