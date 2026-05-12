import { describe, expect, it } from 'vitest';
import App from './App';

describe('<App>', () => {
  it('함수 컴포넌트로 export된다', () => {
    expect(typeof App).toBe('function');
    expect(App.length).toBe(0); // no props
  });
});
