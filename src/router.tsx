/**
 * 앱 전역 라우터 정의 (React Router v7 Data Mode).
 *
 * createBrowserRouter는 `App.tsx`의 RouterProvider에 주입.
 * 테스트는 `routes` 배열을 createMemoryRouter로 사용 가능.
 */
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import {
  Home,
  homeLoader,
  Learn,
  Level,
  learnLoader,
  levelLoader,
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
      { path: 'level/:cefr', Component: Level, loader: levelLoader },
      { path: 'level/:cefr/:cardType', Component: Mode, loader: modeLoader },
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
