import prettier from 'prettier/standalone'
import babelParser from 'prettier/parser-babel'
import graphqlParser from 'prettier/parser-graphql'
import htmlParser from 'prettier/parser-html'
import cssParser from 'prettier/parser-postcss'

// all available parsers here: https://prettier.io/docs/en/options.html#parser
export default function formatCode(codeString) {
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
