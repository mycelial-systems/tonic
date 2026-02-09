[![tests](https://img.shields.io/github/actions/workflow/status/substrate-system/tonic/nodejs.yml?style=flat-square)](https://github.com/substrate-system/tonic/actions/workflows/nodejs.yml)
[![GZip size](https://img.shields.io/bundlephobia/minzip/@substrate-system/tonic?style=flat-square&label=GZip%20size)](https://bundlephobia.com/result?p=@substrate-system/tonic)
[![install size](https://flat.badgen.net/packagephobia/install/@substrate-system/tonic?)](https://packagephobia.com/result?p=@substrate-system/tonic)
[![module](https://img.shields.io/badge/module-ESM%2FCJS-blue?style=flat-square)](README.md)
[![semantic versioning](https://img.shields.io/badge/semver-2.0.0-blue?logo=semver&style=flat-square)](https://semver.org/)
[![Common Changelog](https://nichoth.github.io/badge/common-changelog.svg)](./CHANGELOG.md)
[![license](https://img.shields.io/badge/license-Big_Time-blue?style=flat-square)](LICENSE)

# Tonic

Tonic is a low profile component framework for the web. 
It's designed to be used with contemporary Javascript and is compatible
with all modern browsers. It's built on top of
[Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components).

[See the API docs](https://substrate-system.github.io/tonic/index.html)

<details><summary><h2>Contents</h2></summary>

<!-- toc -->

- [Install](#install)
- [tl;dr](#tldr)
- [Use](#use)
  * [Bundler](#bundler)
  * [Pre-bundled](#pre-bundled)
- [Get Started](#get-started)
  * [Register](#register)
  * [HTML](#html-1)
  * [Render](#render)
  * [Rerender](#rerender)
  * [Events](#events)
  * [State](#state)
- [Server-Side Rendering](#server-side-rendering)
  * [SSR Example](#ssr-example)
  * [Async Components](#async-components)
- [docs](#docs)
- [types](#types)
- [API](#api)
  * [Event listeners](#event-listeners)
  * [`tag`](#tag)
  * [`emit`](#emit)
  * [`static event`](#static-event)
  * [`dispatch`](#dispatch)
- [Develop](#develop)
  * [build ESM](#build-esm)
  * [build Common JS](#build-common-js)
  * [build UMD modules](#build-umd-modules)
- [Useful links](#useful-links)

<!-- tocstop -->

</details>

## Install

```sh
npm i -S @substrate-system/tonic
```

## tl;dr

This is a front-end view library, like React, but using web components.

> [!TIP]
> DOM state, such as element focus and input values, is preserved
> across multiple calls to `reRender`.


-------


## Use

### Bundler

```js
import Tonic from '@substrate-system/tonic'
```

### Pre-bundled
This package exposes minified JS files too. Copy them so they are accessible
to your web server, then link to them in HTML.

#### Copy

```sh
cp ./node_modules/@substrate-system/tonic/dist/index.min.js ./public/tonic.min.js
```

#### HTML

```html
<script type="module" src="./tonic.min.js"></script>
```

-----------------------------------

## Get Started

Building a component with Tonic starts by creating a function or a
[class](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes).
The class should have at least one method named *render* which returns
a [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
of HTML.

```js
import Tonic from '@substrate-system/tonic'

class MyGreeting extends Tonic {
  render () {
    return this.html`<div>Hello, World.</div>`
  }
}
```

or

```js
function MyGreeting () {
  return this.html`
    <div>Hello, World.</div>
  `
}
```

---

The HTML tag for your component will match the class or function name.

> [!NOTE]  
> Tonic is a thin wrapper around `web components`. Web
> components require a name with two or more parts. So your class name should
> be `CamelCased` (starting with an uppercase letter). For example, `MyGreeting`
> becomes `<my-greeting></my-greeting>`.
> 


---

### Register

Next, register your component with `Tonic.add(ClassName)`.

```js
Tonic.add(MyGreeting)
```

---

### HTML

After adding your Javascript to your HTML, you can use your component anywhere.

```html
<html>
  <body>
    <my-greeting></my-greeting>

    <script src="index.js"></script>
  </body>
</html>
```

>
> [!NOTE]  
> Custom tags (in all browsers) require a closing tag even if
> they have no children. Tonic doesn't add any "magic" to change how this works.
> 

---

### Render

When the component is rendered by the browser, the result of your render
function will be inserted into the component tag.

```html
<html>
  <head>
    <script src="index.js"></script>
  </head>

  <body>
    <my-greeting>
      <div>Hello, World.</div>
    </my-greeting>
  </body>
</html>
```

A component (or its render function) may be an `async` or an `async generator`.

```js
class GithubUrls extends Tonic {
  async * render () {
    yield this.html`<p>Loading...</p>`

    const res = await fetch('https://api.github.com/')
    const urls = await res.json()

    return this.html`
      <pre>
        ${JSON.stringify(urls, 2, 2)}
      </pre>
    `
  }
}
```

### Rerender

Call `tonicInstance.reRender()` to render your component again with updated
state. This is totally decoupled from any kind of state machine, so you can
choose how to batch state updates, and just re-render when necessary.

> [!TIP]
> DOM state, such as focus and input values, is preserved
> across multiple calls to `reRender`.

### Events

There is a convention for event handler method names. Name a method like
`handle_example`, and the method will be called with any `example` type
event.

#### Events Example

```js
import { Tonic } from '@substrate-system/tonic'

class ButtonExample extends Tonic {
  handle_click (ev) {
    ev.preventDefault()
    if (Tonic.match(ev.target as HTMLButtonElement, 'button')) {
      // button clicks only
      this.increment()
    }
    this.props.onbtnclick('hello')
  }

  render () {
    return this.html`<div id="test">
      example
      <button id="btn">clicker</button>
    </div>`
  }
}
```

### State

`this.state` is a plain-old javascript object. Its value will be persisted if
the component is re-rendered. **Any component with state must have an**
**id property**.

Setting the state will not cause a component to re-render. This way you can
make incremental updates. Components can be updated independently, and
rendering only happens only when necessary.

Remember to clean up! States are just a set of key-value pairs on the Tonic
object. So if you create temporary components that use state,
clean up their state after you delete them. For example,
if I have a component with thousands of temporary child elements that
all use state, I should delete their state after they get destroyed.
Delete `Tonic._states[someRandomId]`


## Server-Side Rendering

Tonic includes a `renderToString` function that converts component instances
to static HTML strings, making it easy to implement server-side rendering.

The `renderToString` function will process nested Tonic components recursively.

### SSR Example

#### The Component

```js
// my-component.js
import Tonic from '@substrate-system/tonic'

export class MyComponent extends Tonic {
  render () {
    return this.html`<div class="greeting">
      Hello, ${this.props.name}!
    </div>`
  }
}
```

#### Render

Need to import `Tonic` after `render`, because it will polyfill some globals.

```js
// this runs in node
import {
  render as renderToString
} from '@substrate-system/tonic/render-to-string'
// Import Tonic after render-to-string
import { Tonic } from '@substrate-system/tonic'
import { MyComponent } from './my-component.js'

// Create a component instance
const component = new MyComponent()
component.props = { name: 'World' }

// Render to HTML string
const html = await renderToString(component)
console.log(html)

// => '<div class="greeting">Hello, World!</div>'
```

#### Nested Components

```js
class InnerComponent extends Tonic {
  render () {
    return this.html`<span>${this.props.text}</span>`
  }
}

class OuterComponent extends Tonic {
  render () {
    return this.html`
      <div class="outer">
        <inner-component text="Nested content"></inner-component>
      </div>
    `
  }
}

Tonic.add(InnerComponent)
Tonic.add(OuterComponent)

const component = new OuterComponent()
const html = await renderToString(component)
// Nested components are rendered correctly
```

### Async Components

The `renderToString` function works with async component render methods:

```js
class AsyncComponent extends Tonic {
  async render () {
    const data = await fetchData()
    return this.html`<div>${data}</div>`
  }
}

Tonic.add(AsyncComponent)

const component = new AsyncComponent()
const html = await renderToString(component)
// Waits for async render to complete
```

### Hydration

Add interactivity to server-rendered HTML without re-rendering.
The server attaches serialized state to the page,
and the client initializes components with that state.

#### Server

`render` returns the inner HTML of a component. `toHtml`
wraps that in the custom element tag (e.g.
`<my-app>...content...</my-app>`), with props encoded as
attributes. Pass a `state` option to embed complex props
as JSON.

```js
import {
    render,
    toHtml
} from '@substrate-system/tonic/render-to-string'

class MyApp extends Tonic {
    render () {
        return this.html`<div>
            <h1>${this.props.title}</h1>
            <ul>
                ${this.props.items.map(item =>
                    this.html`<li>${item}</li>`
                )}
            </ul>
            <button>Click me</button>
        </div>`
    }
}

Tonic.add(MyApp)

const props = { title: 'Hello', items: ['a', 'b', 'c'] }
const app = new MyApp()
app.props = props
const content = await render(app)

// Wrap in component tag + embed state for hydration
const html = toHtml(app, content, {
    id: 'app',
    state: { app: props }
})

// html =>
//   <my-app id="app" title="Hello">
//     <div><h1>Hello</h1>...</div>
//   </my-app>
//   <script type="application/json" data-tonic-ssr>
//     {"app":{"title":"Hello","items":["a","b","c"]}}
//   </script>
```

Simple props (strings, numbers, booleans, null) are encoded
as HTML attributes automatically. Complex props (objects,
arrays) are transferred via the JSON `<script>` tag, keyed
by the component's `id`.

#### Client

Use `hydrate` to register components without re-rendering.
The existing server-rendered DOM is preserved, event handlers
are attached, and lifecycle hooks run normally.

```js
import { Tonic } from '@substrate-system/tonic'
import { hydrate } from '@substrate-system/tonic/hydrate'
import { MyApp } from './components.js'

// Register components inside the callback --
// the DOM is preserved, not re-rendered.
const state = hydrate(() => {
    Tonic.add(MyApp)
})

// state => { app: { title: 'Hello', items: ['a', 'b', 'c'] } }
// Event handlers (handle_click, etc.) are active.
// Calling reRender() works normally after hydration.
```

## Docs

See [API docs](https://substrate-system.github.io/tonic/).

---

## API

### Event listeners

Add a method with an event name, and it will be called with any matching events.

#### Event Listener Example

```js
import { Tonic } from '@substrate-system/tonic'

class MyClicker extends Tonic {
  click (ev:MouseEvent) {
    // automatically called on any click
    ev.preventDefault()
    console.log('click')
  }

  render () {
    return this.html`<div>
      <button>click the button</button>
    </div>`
  }
}

Tonic.add(MyClicker)
```

-------

### `tag`

Get the HTML tag name given a Tonic class.

```ts
class Tonic {
  static get tag():string;
}
```

```js
class ExampleTwo extends Tonic {
    render () {
        return this.html`<div>example two</div>`
    }
}

ExampleTwo.tag
// => 'example-two'
```

### `emit`
Emit namespaced events, following a naming convention. The return value is the
call to
[element.dispatchEvent()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent).

Given an event name, the dispatched event will be prefixed with the element
name, for example, `my-element:event-name`.

```ts
{
  emit (type:string, detail:string|object|any[] = {}, opts:Partial<{
      bubbles:boolean;
      cancelable:boolean
  }> = {}):boolean
}
```

#### emit example

```js
class EventsExample extends Tonic {
  // ...
}

// EventsExample.event('name') will return the namespace event name
const evName = EventsExample.event('testing')

document.body.addEventListener(evName, ev => {
  // events bubble by default
  console.log(ev.type)  // => 'events-example:testing'
  console.log(ev.detail)  // => 'some data'
})

const el = document.querySelector('events-example')
// use default values for `bubbles = true` and `cancelable = true`
el.emit('testing', 'some data')

// override default values, `bubbles` and `cancelable`
el.emit('more testing', 'some data', {
  bubbles: false
  cancelable: false
})
```

### `static event`
Return the namespaced event name given a string.

```ts
class {
  static event (type:string):string {
      return `${this.TAG}:${type}`
  }
}
```

#### example
```js
class EventsExample extends Tonic {
  // ...
}

EventsExample.event('testing')
//  => 'events-example:testing'
```

### `dispatch`
Emit a regular, non-namespaced event.

```ts
{
  dispatch (eventName:string, detail = null):void
}
```

#### `dispatch` example

```js
class EventsExample extends Tonic {
  // ...
}

document.body.addEventListener('testing', ev => {
  // events bubble by default
  console.log(ev.type)  // => 'testing'
  console.log(ev.detail)  // => 'some data'
})

const el = document.querySelector('events-example')
el.dispatch('testing', 'some data')

// override default values
el.dispatch('more testing', 'some data', {
  bubbles: false
  cancelable: false
})
```

## Develop

On any version bump, we run `npm run build`, which calls all the other
build scripts.

### build ESM

```sh
npm run build-esm
```

```sh
npm run build-esm:min
```

### build Common JS

```sh
npm run build-cjs
```

```sh
npm run build-cjs:min
```

### build UMD modules

```sh
npm run build:main
```

```sh
npm run build:minify
```


## Useful links
- [API](./API.md)
- [Troubleshooting](./HELP.md)
- [Web Component lifecycle methods](https://gomakethings.com/the-web-component-lifecycle-methods/)
- [How to detect when attributes change on a Web Component](https://gomakethings.com/how-to-detect-when-attributes-change-on-a-web-component/)
- [API docs generated from typescript](https://substrate-system.github.io/tonic/classes/Tonic.html)
