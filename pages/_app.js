import '../styles/globals.css'
import SecureWrapper from '../components/SecureWrapper'

function MyApp({ Component, pageProps }) {
    return (
        <SecureWrapper>
            <Component {...pageProps} />
        </SecureWrapper>
    )
}

export default MyApp
