// 폴더 통째 선택(<input webkitdirectory>)은 표준화되지 않아 React 타입에 없다.
// 크로미움·파이어폭스·사파리 모두 지원한다.
//
// 타입 매개변수 이름(T)은 React 원본 선언과 글자까지 같아야 병합된다 — 이름을 바꾸면
// 병합이 깨져서 onChange 같은 기존 속성이 전부 any로 떨어진다. 그래서 안 쓰는 T를 그대로 둔다.
import "react";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
