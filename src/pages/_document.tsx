import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <link rel="icon" href="/loosyChatBoxIcon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/loosyChatBoxIcon.svg" />
        <link rel="shortcut icon" href="/loosyChatBoxIcon.svg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
