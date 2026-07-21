/**
 * 앱 전역 라우터 정의 (React Router v7 Data Mode).
 *
 * createBrowserRouter는 `App.tsx`의 RouterProvider에 주입.
 * 테스트는 `routes` 배열을 createMemoryRouter로 사용 가능.
 *
 * 흐름: 홈(대화/단어/문장) → /cards/:cardType (난이도) → /cards/:cardType/:cefr (모드)
 *       → /learn/... 학습. 대화는 /conversation 으로 바로 진입.
 */
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import {
  CardTypeHome,
  Conversation,
  cardTypeHomeLoader,
  Home,
  homeLoader,
  Learn,
  learnLoader,
  Mode,
  modeLoader,
  NotFound,
  Root,
  RouteError,
  Vocabulary,
  vocabularyLoader,
} from '@/routes';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: Root,
    ErrorBoundary: RouteError,
    children: [
      { index: true, Component: Home, loader: homeLoader },
      { path: 'conversation', Component: Conversation },
      { path: 'cards/:cardType', Component: CardTypeHome, loader: cardTypeHomeLoader },
      { path: 'cards/:cardType/:cefr', Component: Mode, loader: modeLoader },
      {
        path: 'learn/:cefr/:cardType/:studyMode',
        Component: Learn,
        loader: learnLoader,
      },
      {
        path: 'vocabulary/:cefr/:cardType',
        Component: Vocabulary,
        loader: vocabularyLoader,
      },
      { path: '*', Component: NotFound },
    ],
  },
];

export const router = createBrowserRouter(routes);
