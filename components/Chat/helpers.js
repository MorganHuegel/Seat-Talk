import prettier from 'prettier/standalone'
import babelParser from 'prettier/parser-babel'
import graphqlParser from 'prettier/parser-graphql'
import htmlParser from 'prettier/parser-html'
import cssParser from 'prettier/parser-postcss'

// all available parsers here: https://prettier.io/docs/en/options.html#parser
export function formatCode(codeString) {
    let parsers = ['json', 'json5', 'babel', 'css', 'sass', 'graphql', 'markdown', 'html']
    for (let i = 0; i < parsers.length; i++) {
        try {
            codeString = prettier.format(codeString, {
                parser: parsers[i],
                plugins: [babelParser, graphqlParser, htmlParser, cssParser],
            })
            break
        } catch (e) {
            continue
        }
    }

    return codeString
}

export function formatInput(text) {
    // if it's html, don't try to hyperlink it.
    // This has it's loopholes, but nothing malicious can pass through
    // because of the xss backend package.
    if (text.includes('</a>') || text.includes('</script>')) {
        return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    const urlRegex = /(https?:\/\/[^\s,]+)/g
    const urls = text.match(urlRegex) || []
    urls.forEach((url) => {
        const hyperlink = `<a href="${url}" target="_blank" rel="noreferrer" style="word-break: break-all;">${url}</a>`
        text = text.replace(url, hyperlink)
    })
    return text
}
