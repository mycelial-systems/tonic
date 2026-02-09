import { test } from '@substrate-system/tapzero'
import {
    render as renderToString,
    toHtml,
    getHydrationScript
} from '../src/render-to-string.js'
// Import Tonic after render-to-string sets up globals
import { Tonic } from '../src/index.js'
import { SsrExample } from './fixture.js'

test('external example file', async (t) => {
    Tonic.add(SsrExample)
    const c = new SsrExample()
    const html = await renderToString(c)
    t.ok(html.includes('hello world'))
})

test('SSR in Node.js: simple component', async t => {
    class SimpleSSR extends Tonic {
        render () {
            return this.html`<div class="simple">Hello SSR</div>`
        }
    }

    Tonic.add(SimpleSSR)

    const component = new SimpleSSR()
    const html = await renderToString(component)

    t.ok(html.includes('<div class="simple">Hello SSR</div>'),
        'should render simple component to HTML string in Node.js')
})

test('SSR in Node.js: component with props', async t => {
    class PropsSSR extends Tonic {
        defaults () {
            return {
                message: 'default'
            }
        }

        render () {
            return this.html`<div class="msg">${this.props.message}</div>`
        }
    }

    Tonic.add(PropsSSR)

    const component = new PropsSSR()
    component.props = { message: 'Node.js SSR!' }
    const html = await renderToString(component)

    t.ok(html.includes('Node.js SSR!'),
        'should render component with props in Node.js')
})

test('SSR in Node.js: nested components', async t => {
    class InnerSSR extends Tonic {
        render () {
            return this.html`<span class="inner">${this.props.text}</span>`
        }
    }

    class OuterSSR extends Tonic {
        render () {
            return this.html`<div class="outer">
                <inner-s-s-r text="Nested in Node"></inner-s-s-r>
            </div>`
        }
    }

    Tonic.add(InnerSSR)
    Tonic.add(OuterSSR)

    const component = new OuterSSR()
    const html = await renderToString(component)

    t.ok(html.includes('<span class="inner">Nested in Node</span>'),
        'should render nested components in Node.js')
    t.ok(html.includes('<div class="outer">'),
        'should render outer wrapper in Node.js')
})

test('SSR in Node.js: deeply nested components', async t => {
    class L3 extends Tonic {
        render () {
            return this.html`<div class="l3">L3: ${this.props.val}</div>`
        }
    }

    class L2 extends Tonic {
        render () {
            return this.html`<div class="l2">
                L2
                <l3 val="deep"></l3>
            </div>`
        }
    }

    class L1 extends Tonic {
        render () {
            return this.html`<div class="l1">
                L1
                <l2></l2>
            </div>`
        }
    }

    Tonic.add(L3)
    Tonic.add(L2)
    Tonic.add(L1)

    const component = new L1()
    const html = await renderToString(component)

    t.ok(html.includes('L1'), 'should include L1 content')
    t.ok(html.includes('L2'), 'should include L2 content')
    t.ok(html.includes('L3: deep'), 'should include L3 content with props')
})

test('SSR in Node.js: async component', async t => {
    class AsyncSSR extends Tonic {
        async render () {
            await new Promise(resolve => setTimeout(resolve, 10))
            return this.html`<div class="async">Async Node SSR</div>`
        }
    }

    Tonic.add(AsyncSSR)

    const component = new AsyncSSR()
    const html = await renderToString(component)

    t.ok(html.includes('Async Node SSR'),
        'should render async component in Node.js')
})

test('SSR in Node.js: component with multiple children', async t => {
    class ItemSSR extends Tonic {
        render () {
            return this.html`<li>${this.props.item}</li>`
        }
    }

    class ListSSR extends Tonic {
        render () {
            return this.html`<ul>
                <item-s-s-r item="One"></item-s-s-r>
                <item-s-s-r item="Two"></item-s-s-r>
                <item-s-s-r item="Three"></item-s-s-r>
            </ul>`
        }
    }

    Tonic.add(ItemSSR)
    Tonic.add(ListSSR)

    const component = new ListSSR()
    const html = await renderToString(component)

    t.ok(html.includes('<li>One</li>'), 'should render first item')
    t.ok(html.includes('<li>Two</li>'), 'should render second item')
    t.ok(html.includes('<li>Three</li>'), 'should render third item')
})

test('SSR in Node.js: real-world example with page layout', async t => {
    class Header extends Tonic {
        render () {
            return this.html`<header>
                <h1>${this.props.title}</h1>
                <nav>
                    <a href="/">Home</a>
                    <a href="/about">About</a>
                </nav>
            </header>`
        }
    }

    class Footer extends Tonic {
        render () {
            return this.html`<footer>
                <p>&copy; 2024 ${this.props.company}</p>
            </footer>`
        }
    }

    class Page extends Tonic {
        render () {
            return this.html`<div class="page">
                <header-component title="${this.props.title}"></header-component>
                <main>${this.props.content}</main>
                <footer-component company="${this.props.company}"></footer-component>
            </div>`
        }
    }

    Tonic.add(Header, 'header-component')
    Tonic.add(Footer, 'footer-component')
    Tonic.add(Page)

    const page = new Page()
    page.props = {
        title: 'My Page',
        content: 'Page content here',
        company: 'Acme Inc'
    }

    const html = await renderToString(page)

    t.ok(html.includes('<h1>My Page</h1>'), 'should render page title')
    t.ok(html.includes('Page content here'), 'should render main content')
    t.ok(html.includes('© 2024 Acme Inc') || html.includes('&copy; 2024 Acme Inc'), 'should render footer')
    t.ok(html.includes('<nav>'), 'should render navigation')
})

// -- Hydration helpers (server side) --

test('getHydrationScript generates a script tag', t => {
    const state = { app: { title: 'Hello', items: [1, 2] } }
    const script = getHydrationScript(state)

    t.ok(
        script.includes('data-tonic-ssr'),
        'has the data-tonic-ssr attribute'
    )
    t.ok(
        script.includes('application/json'),
        'has application/json type'
    )
    t.ok(
        script.includes('"title":"Hello"'),
        'contains serialized state'
    )
    t.ok(
        script.includes('[1,2]'),
        'contains serialized array'
    )
})

test('toHtml wraps content in component tag', async t => {
    class WrapTest extends Tonic {
        render () {
            return this.html`<div>wrapped</div>`
        }
    }

    Tonic.add(WrapTest)

    const component = new WrapTest()
    component.props = { greeting: 'hi' }
    const content = await renderToString(component)
    const html = toHtml(component, content)

    t.ok(
        html.startsWith('<wrap-test'),
        'starts with the component tag'
    )
    t.ok(
        html.includes('greeting="hi"'),
        'has props as attributes'
    )
    t.ok(
        html.includes('<div>wrapped</div>'),
        'contains the rendered content'
    )
    t.ok(
        html.includes('</wrap-test>'),
        'closes the component tag'
    )
})

test('toHtml encodes number and boolean props', async t => {
    class TypeTest extends Tonic {
        render () {
            return this.html`<div>types</div>`
        }
    }

    Tonic.add(TypeTest)

    const component = new TypeTest()
    component.props = {
        count: 42,
        rate: 3.14,
        active: true,
        hidden: false,
        empty: null,
        label: 'hello'
    }
    const content = await renderToString(component)
    const html = toHtml(component, content)

    t.ok(
        html.includes('count="42__float"'),
        'encodes integer as float marker'
    )
    t.ok(
        html.includes('rate="3.14__float"'),
        'encodes decimal as float marker'
    )
    t.ok(
        html.includes('active="true__boolean"'),
        'encodes true boolean'
    )
    t.ok(
        html.includes('hidden="false__boolean"'),
        'encodes false boolean'
    )
    t.ok(
        html.includes('empty="null__null"'),
        'encodes null'
    )
    t.ok(
        html.includes('label="hello"'),
        'preserves string values'
    )
})

test('toHtml with id and state', async t => {
    class StateTest extends Tonic {
        render () {
            return this.html`<p>${this.props.msg}</p>`
        }
    }

    Tonic.add(StateTest)

    const component = new StateTest()
    component.props = { msg: 'hi' }
    const content = await renderToString(component)
    const html = toHtml(component, content, {
        id: 'my-app',
        state: {
            'my-app': {
                msg: 'hi',
                items: ['a', 'b']
            }
        }
    })

    t.ok(
        html.includes('id="my-app"'),
        'has the id attribute'
    )
    t.ok(
        html.includes('data-tonic-ssr'),
        'includes hydration script tag'
    )
    t.ok(
        html.includes('"items":["a","b"]'),
        'script tag has serialized complex props'
    )
})

test('toHtml skips complex props in attributes', async t => {
    class ComplexTest extends Tonic {
        render () {
            return this.html`<div>complex</div>`
        }
    }

    Tonic.add(ComplexTest)

    const component = new ComplexTest()
    component.props = {
        title: 'ok',
        items: [1, 2, 3],
        config: { a: 1 },
        handler: () => {}
    }
    const content = await renderToString(component)
    const html = toHtml(component, content)

    t.ok(
        html.includes('title="ok"'),
        'includes simple string prop'
    )
    t.ok(
        !html.includes('items='),
        'does not include array prop as attribute'
    )
    t.ok(
        !html.includes('config='),
        'does not include object prop as attribute'
    )
    t.ok(
        !html.includes('handler='),
        'does not include function prop as attribute'
    )
})
