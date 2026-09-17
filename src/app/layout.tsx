import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "텍스트 비교 도구",
  description: "참조 텍스트와 인식 텍스트를 비교해 CER(문자 오류율) 리포트를 받는다.",
};

// 서버 컴포넌트 — <html>/<body> 뼈대만 만든다(정적 export 호환).
// 상태를 들고 있을 곳이 없다: 화면은 페이지 하나뿐이고 결과는 zip 파일로 바로 내려간다.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-surface font-sans text-ink antialiased">
        <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
      </body>
    </html>
  );
}
