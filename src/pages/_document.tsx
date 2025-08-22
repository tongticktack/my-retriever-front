import { Html, Head, Main, NextScript } from "next/document";
import Script from 'next/script';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&autoload=false&libraries=services,clusterer`}
          strategy="beforeInteractive"
        />
      </Head>
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
