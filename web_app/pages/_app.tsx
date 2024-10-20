// pages/_app.tsx
import "../styles/styles.css"; // Make sure your styles are imported here
import type { AppProps } from "next/app";
import Head from "next/head";
import Layout from "./layout"; // Import the Layout component

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>JudicialSense</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
