import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallButton } from './InstallButton';

interface MockNavigator extends Partial<Navigator> {
  standalone?: boolean;
}

function setUserAgent(ua: string): void {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
}

function setStandalone(value: boolean): void {
  Object.defineProperty(window.navigator, 'standalone', {
    value,
    configurable: true,
    writable: true,
  });
}

function mockMatchMedia(standalone: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === '(display-mode: standalone)' ? standalone : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia;
}

describe('<InstallButton>', () => {
  const originalUserAgent = window.navigator.userAgent;
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockMatchMedia(false);
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64)');
    setStandalone(false);
  });

  afterEach(() => {
    setUserAgent(originalUserAgent);
    window.matchMedia = originalMatchMedia;
    delete (window.navigator as MockNavigator).standalone;
    vi.restoreAllMocks();
  });

  it('미지원 환경(Linux desktop)에서는 버튼이 렌더되지 않는다', () => {
    const { container } = render(<InstallButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('이미 설치된 상태(display-mode standalone)면 버튼이 렌더되지 않는다', () => {
    mockMatchMedia(true);
    const { container } = render(<InstallButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('iOS Safari에서는 "앱 설치" 버튼 노출 + 클릭 시 안내 모달 표시', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
    render(<InstallButton />);
    const button = screen.getByRole('button', { name: '앱 설치' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    const dialog = screen.getByRole('dialog', { name: /iPhone에 앱 설치/ });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/공유 버튼/)).toBeInTheDocument();
    expect(screen.getByText(/홈 화면에 추가/)).toBeInTheDocument();
  });

  it('iOS 안내 모달: "닫기" 버튼 클릭 시 모달 닫힘', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
    render(<InstallButton />);
    fireEvent.click(screen.getByRole('button', { name: '앱 설치' }));
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('iOS 안내 모달: ESC 키로 닫힘', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
    render(<InstallButton />);
    fireEvent.click(screen.getByRole('button', { name: '앱 설치' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Android Chrome: beforeinstallprompt 이벤트 후 버튼 노출 + 클릭 시 native prompt 호출', async () => {
    setUserAgent('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0');
    render(<InstallButton />);
    // 초기엔 unsupported → 버튼 없음
    expect(screen.queryByRole('button', { name: '앱 설치' })).not.toBeInTheDocument();

    // beforeinstallprompt 이벤트 디스패치
    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string; platform: string }>;
    };
    event.prompt = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(event, 'userChoice', {
      value: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    });

    await new Promise<void>((resolve) => {
      window.dispatchEvent(event);
      // 비동기 setState 반영 대기
      setTimeout(resolve, 10);
    });

    const button = await screen.findByRole('button', { name: '앱 설치' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    // prompt가 호출되어야 함 (비동기 → 다음 틱에)
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    expect(event.prompt).toHaveBeenCalledOnce();
  });
});
