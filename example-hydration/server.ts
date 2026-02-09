/**
 * SSR build script.
 *
 * Renders the AppCounter component on the server with an
 * initial count, then writes a complete HTML page to
 * `example-hydration/index.html`.
 *
 * Run via:
 *   npm run build:hydration
 */
import * as fs from 'node:fs'
import {
    render,
    toHtml,
} from '../src/render-to-string.js'

// render-to-string polyfills `window` for Node,
// so Tonic can be imported after it.
import { Tonic } from '../src/index.js'
import { AppCounter } from './counter.js'
import { AppButton } from './button.js'

const INITIAL_COUNT = 5

async function main () {
    Tonic.add(AppButton)
    Tonic.add(AppCounter)

    const counter = new AppCounter()
    counter.props = { count: INITIAL_COUNT }

    const content = await render(counter)

    const id = 'app'
    const state = {
        [id]: { count: INITIAL_COUNT }
    }

    const body = toHtml(counter, content, {
        id,
        state,
    })

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
        content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="/button.css">
    <title>Hydration Example</title>
</head>
<body>
    <div class="container">
        <h1>Tonic SSR + Hydration</h1>
        <p class="description">
            This counter was rendered on the server
            with an initial count of
            <strong>${INITIAL_COUNT}</strong>.
            The client hydrates it, making the button
            interactive.
        </p>

        ${body}
    </div>

    <script type="module" src="./client.ts"></script>
</body>
</html>
`

    // Script runs from project root via npm
    const outPath = 'example-hydration/index.html'
    fs.writeFileSync(outPath, html, 'utf-8')
    console.log('Wrote', outPath)
}

main()
