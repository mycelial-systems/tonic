export class TonicTemplate {
    rawText:string
    unsafe:boolean
    templateStrings?:string[]|null
    isTonicTemplate:true

    constructor (rawText, templateStrings?:string[]|null, unsafe?:boolean) {
        this.isTonicTemplate = true
        this.unsafe = !!unsafe
        this.rawText = rawText
        this.templateStrings = templateStrings
    }

    valueOf () { return this.rawText }
    toString () { return this.rawText }
}

/**
 * Class Tonic
 *
 * @template {T extends object = Record<string, any>} T Type of the props
 */
export abstract class Tonic<
    T extends object=Record<string, any>
> extends window.HTMLElement {
    private static _tags = ''
    private static _refIds:string[] = []
    private static _data = {}
    private static _states = {}
    private static _children = {}
    private static _reg = {}
    private static _stylesheetRegistry:(()=>string)[] = []
    private static _index = 0
    // @ts-expect-error VERSION is injected during build
    static get version () { return VERSION ?? null }
    static get SPREAD () { return /\.\.\.\s?(__\w+__\w+__)/g }
    static get ESC () { return /["&'<>`/]/g }
    static get AsyncFunctionGenerator ():AsyncGeneratorFunctionConstructor {
        return (async function * () {}.constructor) as AsyncGeneratorFunctionConstructor
    }
    // eslint-disable-next-line
    static get AsyncFunction ():Function {
        return (async function () {}.constructor)
    }

    static get MAP () {
        /* eslint-disable object-property-newline, object-property-newline,
        object-curly-newline */
        return { '"': '&quot;', '&': '&amp;', '\'': '&#x27;', '<': '&lt;',
            '>': '&gt;', '`': '&#x60;', '/': '&#x2F;' }
    }

    static ssr
    static nonce

    private _state:any
    stylesheet?:()=>string
    styles:()=>string
    props:T
    preventRenderOnReconnect:boolean
    private _id:string
    pendingReRender?:Promise<this>|null
    updated?:((props:Record<string, any>)=>any)
    willRender?:(()=>any)
    root?:ShadowRoot|this
    willConnect?:()=>any
    private _source?:string
    connected?:()=>void
    disconnected?:()=>void

    private elements:Element[] & { __children__? }
    private nodes:ChildNode[] & { __children__? }
    private _props = Tonic.getPropertyNames(this)

    constructor () {
        super()
        const state = Tonic._states[super.id]
        delete Tonic._states[super.id]
        this._state = state || {}
        this.preventRenderOnReconnect = false
        this.props = {} as T
        this.elements = [...this.children]
        this.elements.__children__ = true
        this.nodes = [...this.childNodes]
        this.nodes.__children__ = true
        this._events()
    }

    abstract render ():TonicTemplate|Promise<TonicTemplate>

    defaults ():Record<string, any>|undefined {
        return {}
    }

    get isTonicComponent ():true {
        return true
    }

    /**
     * Get a namespaced event name, given a non-namespaced string.
     *
     * @example
     * MyElement.event('example')  // => my-element:example
     *
     * @param {string} type The name of the event
     * @returns {string} The namespaced event name
     */
    static event (type:string):string {
        return `${this.tag}:${type}`
    }

    /**
     * Get the tag name of this component.
     */
    static get tag ():string {
        return Tonic.getTagName(this.name)
    }

    private static _createId () {
        return `tonic${Tonic._index++}`
    }

    private static _normalizeAttrs (o, x = {}) {
        [...o].forEach(o => (x[o.name] = o.value))
        return x
    }

    private _checkId () {
        const _id = super.id
        if (!_id) {
            const html = this.outerHTML.replace(this.innerHTML, '...')
            throw new Error(`Component: ${html} has no id`)
        }
        return _id
    }

    /**
     * Get the component state property.
     */
    get state () {
        return (this._checkId(), this._state)
    }

    set state (newState) {
        this._state = (this._checkId(), newState)
    }

    private _events () {
        const hp = Object.getOwnPropertyNames(window.HTMLElement.prototype)
        for (const p of this._props) {
            if (hp.indexOf('on' + p) === -1) continue
            this.addEventListener(p, this)
        }
    }

    private _prop (o) {
        const id = this._id
        const p = `__${id}__${Tonic._createId()}__`
        Tonic._data[id] = Tonic._data[id] || {}
        Tonic._data[id][p] = o
        return p
    }

    private _placehold (r) {
        const id = this._id
        const ref = `placehold:${id}:${Tonic._createId()}__`
        Tonic._children[id] = Tonic._children[id] || {}
        Tonic._children[id][ref] = r
        return ref
    }

    static match (el:HTMLElement, s:string) {
        if (!el.matches) el = el.parentElement!
        return el.matches(s) ? el : el.closest(s)
    }

    static getTagName (camelName:string) {
        return camelName.match(/[A-Z][a-z0-9]*/g)!.join('-').toLowerCase()
    }

    static getPropertyNames (proto) {
        const props:string[] = []
        while (proto && proto !== Tonic.prototype) {
            props.push(...Object.getOwnPropertyNames(proto))
            proto = Object.getPrototypeOf(proto)
        }
        return props
    }

    /**
     * Add a component. Calls `window.customElements.define` with the
     * component's name.
     *
     * @param {TonicComponent} c
     * @param {string} [htmlName] Name of the element, default to the class name
     * @returns {void}
     */
    static add (c, htmlName?:string) {
        const hasValidName = htmlName || (c.name && c.name.length > 1)
        if (!hasValidName) {
            throw Error('Mangling. https://bit.ly/2TkJ6zP')
        }

        if (!htmlName) htmlName = Tonic.getTagName(c.name)
        if (!Tonic.ssr && window.customElements.get(htmlName)) {
            throw new Error(`Cannot Tonic.add(${c.name}, '${htmlName}') twice`)
        }

        if (!c.prototype || !c.prototype.isTonicComponent) {
            const tmp = { [c.name]: class extends Tonic { render } }[c.name]
            tmp.prototype.render = c
            c = tmp
        }

        c.prototype._props = Tonic.getPropertyNames(c.prototype)

        Tonic._reg[htmlName] = c
        Tonic._tags = Object.keys(Tonic._reg).join()
        window.customElements.define(htmlName, c)

        if (typeof c.stylesheet === 'function') {
            Tonic.registerStyles(c.stylesheet)
        }

        return c
    }

    static registerStyles (stylesheetFn:()=>string) {
        if (Tonic._stylesheetRegistry.includes(stylesheetFn)) return
        Tonic._stylesheetRegistry.push(stylesheetFn)

        const styleNode = document.createElement('style')
        if (Tonic.nonce) styleNode.setAttribute('nonce', Tonic.nonce)
        styleNode.appendChild(document.createTextNode(stylesheetFn()))
        if (document.head) document.head.appendChild(styleNode)
    }

    static escape (s:string):string {
        return s.replace(Tonic.ESC, c => Tonic.MAP[c])
    }

    static unsafeRawString (
        s:string,
        templateStrings:string[]
    ):InstanceType<typeof TonicTemplate> {
        return new TonicTemplate(s, templateStrings, true)
    }

    /**
     * Emit a regular, non-namespaced event.
     *
     * @param {string} eventName Event name as a string.
     * @param {any} detail Any data to go with the event.
     */
    dispatch (eventName:string, detail:any = null):void {
        const opts = { bubbles: true, detail }
        this.dispatchEvent(new window.CustomEvent(eventName, opts))
    }

    /**
     * Emit a namespaced event, using a convention for event names.
     *
     * @example
     * myComponent.emit('test')  // => `my-compnent:test`
     *
     * @param {string} type The event type, comes after `:` in event name.
     * @param {string|object|any[]} detail detail for Event constructor
     * @param {{ bubbles?:boolean, cancelable?:boolean }} opts `Cancelable` and
     * `bubbles`
     * @returns {boolean}
     */
    emit (type:string, detail:string|object|any[] = {}, opts:Partial<{
        bubbles:boolean;
        cancelable:boolean
    }> = {}):boolean {
        const namespace = Tonic.getTagName(this.constructor.name)
        const event = new CustomEvent(`${namespace}:${type}`, {
            bubbles: (opts.bubbles === undefined) ? true : opts.bubbles,
            cancelable: (opts.cancelable === undefined) ? true : opts.cancelable,
            detail
        })

        return this.dispatchEvent(event)
    }

    html (strings:string[], ...values):InstanceType<typeof TonicTemplate> {
        const refs = o => {
            if (o && o.__children__) return this._placehold(o)
            if (o && o.isTonicTemplate) return o.rawText
            switch (Object.prototype.toString.call(o)) {
                case '[object HTMLCollection]':
                case '[object NodeList]': return this._placehold([...o])
                case '[object Array]': {
                    if (o.every(x => x.isTonicTemplate && !x.unsafe)) {
                        return new TonicTemplate(o.join('\n'), null, false)
                    }
                    return this._prop(o)
                }
                case '[object Object]':
                case '[object Function]':
                case '[object AsyncFunction]':
                case '[object Set]':
                case '[object Map]':
                case '[object WeakMap]':
                case '[object File]':
                    return this._prop(o)
                case '[object NamedNodeMap]':
                    return this._prop(Tonic._normalizeAttrs(o))
                case '[object Number]': return `${o}__float`
                case '[object String]': return Tonic.escape(o)
                case '[object Boolean]': return `${o}__boolean`
                case '[object Null]': return `${o}__null`
                case '[object HTMLElement]':
                    return this._placehold([o])
            }
            if (
                typeof o === 'object' && o && o.nodeType === 1 &&
                typeof o.cloneNode === 'function'
            ) {
                return this._placehold([o])
            }
            return o
        }

        const out:string[] = []
        for (let i = 0; i < strings.length - 1; i++) {
            out.push(strings[i], refs(values[i]))
        }
        out.push(strings[strings.length - 1])

        const htmlStr = out.join('').replace(Tonic.SPREAD, (_, p) => {
            const o = Tonic._data[p.split('__')[1]][p]
            return Object.entries(o).map(([key, value]) => {
                const k = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
                if (value === true) return k
                else if (value) return `${k}="${Tonic.escape(String(value))}"`
                else return ''
            }).filter(Boolean).join(' ')
        })

        return new TonicTemplate(htmlStr, strings, false)
    }

    scheduleReRender (oldProps:any):Promise<this> {
        if (this.pendingReRender) return this.pendingReRender

        this.pendingReRender = new Promise(resolve => setTimeout(() => {
            if (!this.isInDocument(this.shadowRoot || this)) return
            const p = this._set(this.shadowRoot || this, this.render)
            this.pendingReRender = null

            if (p && p.then) {
                return p.then(() => {
                    this.updated && this.updated(oldProps)
                    resolve(this)
                })
            }

            this.updated && this.updated(oldProps)
            resolve(this)
        }, 0))

        return this.pendingReRender
    }

    /**
     * Update the view
     */
    reRender (o:T|((props:T)=>T) = this.props):Promise<this> {
        const oldProps = { ...this.props }
        this.props = typeof o === 'function' ? o(oldProps) : o
        return this.scheduleReRender(oldProps)
    }

    /**
     * If there is a method with the same name as the event type,
     * then call the method.
     * @see {@link https://gomakethings.com/the-handleevent-method-is-the-absolute-best-way-to-handle-events-in-web-components/#what-is-the-handleevent-method What is the handleEvent() method?}
     */
    handleEvent (ev:Event):void {
        this[ev.type] && this[ev.type](ev)
    }

    private _drainIterator (target, iterator) {
        return iterator.next().then((result) => {
            this._set(target, null, result.value)
            if (result.done) return
            return this._drainIterator(target, iterator)
        })
    }

    /**
     * _set
     * @param {Element|InstanceType<typeof Tonic>|ShadowRoot} target
     * @param {()=>any} render
     * @param {string} content
     * @returns {Promise<void>|void}
     * @private
     */
    private _set (target, render, content = ''):Promise<void>|void {
        this.willRender && this.willRender()
        for (const node of target.querySelectorAll(Tonic._tags)) {
            if (!node.isTonicComponent) continue

            const id = node.getAttribute('id')
            if (!id || !Tonic._refIds.includes(id)) continue
            Tonic._states[id] = node.state
        }

        if (render instanceof Tonic.AsyncFunction) {
            return ((render as ()=>any)
                .call(this, this.html, this.props)
                .then(content => this._apply(target, content))
            )
        } else if (render instanceof Tonic.AsyncFunctionGenerator) {
            return this._drainIterator(target, (render as AsyncGeneratorFunction).call(this))
        } else if (render === null) {
            this._apply(target, content)
        } else if (render instanceof Function) {
            this._apply(target, render.call(this, this.html, this.props) || '')
        }
    }

    private _apply (target, content) {
        if (content && content.isTonicTemplate) {
            content = content.rawText
        } else if (typeof content === 'string') {
            content = Tonic.escape(content)
        }

        if (typeof content === 'string') {
            if (this.stylesheet) {
                content = `<style nonce=${Tonic.nonce || ''}>${this.stylesheet()}</style>${content}`
            }

            target.innerHTML = content

            if (this.styles) {
                const styles = this.styles()
                for (const node of target.querySelectorAll('[styles]')) {
                    for (const s of node.getAttribute('styles').split(/\s+/)) {
                        Object.assign(node.style, styles[s.trim()])
                    }
                }
            }

            const children = Tonic._children[this._id] || {}

            const walk = (node, fn) => {
                if (node.nodeType === 3) {
                    const id = node.textContent.trim()
                    if (children[id]) fn(node, children[id], id)
                }

                const childNodes = node.childNodes
                if (!childNodes) return

                for (let i = 0; i < childNodes.length; i++) {
                    walk(childNodes[i], fn)
                }
            }

            walk(target, (node, children, id) => {
                for (const child of children) {
                    node.parentNode.insertBefore(child, node)
                }
                delete Tonic._children[this._id][id]
                node.parentNode.removeChild(node)
            })
        } else {
            target.innerHTML = ''
            target.appendChild(content.cloneNode(true))
        }
    }

    connectedCallback () {
        this.root = this.shadowRoot || this // here for back compat

        if (super.id && !Tonic._refIds.includes(super.id)) {
            Tonic._refIds.push(super.id)
        }
        const cc = s => s.replace(/-(.)/g, (_, m) => m.toUpperCase())

        for (const { name: _name, value } of this.attributes) {
            const name = cc(_name)
            const p = this.props[name] = value

            if (/__\w+__\w+__/.test(p)) {
                const { 1: root } = p.split('__')
                this.props[name] = Tonic._data[root][p]
            } else if (/\d+__float/.test(p)) {
                this.props[name] = parseFloat(p)
            } else if (p === 'null__null') {
                this.props[name] = null
            } else if (/\w+__boolean/.test(p)) {
                this.props[name] = p.includes('true')
            } else if (/placehold:\w+:\w+__/.test(p)) {
                const { 1: root } = p.split(':')
                this.props[name] = Tonic._children[root][p][0]
            }
        }

        this.props = Object.assign(
            this.defaults(),
            this.props
        )

        this._id = this._id || Tonic._createId()

        this.willConnect && this.willConnect()

        if (!this.isInDocument(this.root)) return
        if (!this.preventRenderOnReconnect) {
            if (!this._source) {
                this._source = this.innerHTML
            } else {
                this.innerHTML = this._source
            }
            const p = this._set(this.root, this.render)
            if (p && p.then) return p.then(() => this.connected && this.connected())
        }

        this.connected && this.connected()
    }

    isInDocument (target:HTMLElement|ShadowRoot):boolean {
        const root = target.getRootNode()
        return root === document || root.toString() === '[object ShadowRoot]'
    }

    disconnectedCallback ():void {
        this.disconnected && this.disconnected()
        delete Tonic._data[this._id]
        delete Tonic._children[this._id]
    }
}

export default Tonic
