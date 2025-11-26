import { test } from '@substrate-system/tapzero'
import { render as renderToString } from '../src/render-to-string.js'
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
