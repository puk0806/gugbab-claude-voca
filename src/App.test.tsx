import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('<App>', () => {
  it('앱 제목 "gugbab-voca"가 렌더링된다', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /gugbab-voca/i })).toBeInTheDocument();
  });

  it('Phase 2-1 부트스트랩 상태 메시지가 표시된다', () => {
    render(<App />);
    expect(screen.getByText(/Phase 2-1 부트스트랩 OK/i)).toBeInTheDocument();
  });

  it('서브타이틀에 PWA 설명이 포함된다', () => {
    render(<App />);
    expect(screen.getByText(/CEFR 영어 회화 단어·문장 학습 PWA/i)).toBeInTheDocument();
  });
});
