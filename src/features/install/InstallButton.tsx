import { useCallback, useState } from 'react';
import { IosInstallGuide } from './IosInstallGuide';
import { useInstallPrompt } from './useInstallPrompt';
import styles from './InstallButton.module.css';

/**
 * 헤더용 PWA install 버튼.
 *
 * - native 모드(Chrome/Edge/Android): 클릭 시 브라우저 install 다이얼로그
 * - ios-guide 모드(iOS Safari): 클릭 시 IosInstallGuide 모달
 * - installed / unsupported: 버튼 자체 미렌더
 */
export function InstallButton() {
  const { mode, canInstall, promptInstall } = useInstallPrompt();
  const [showGuide, setShowGuide] = useState(false);

  const handleClick = useCallback(async () => {
    if (mode === 'native') {
      await promptInstall();
    } else if (mode === 'ios-guide') {
      setShowGuide(true);
    }
  }, [mode, promptInstall]);

  const handleClose = useCallback(() => setShowGuide(false), []);

  if (!canInstall) return null;

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={handleClick}
        aria-label="앱 설치"
      >
        <span className={styles.icon} aria-hidden="true">
          📱
        </span>
        앱 설치
      </button>
      {showGuide && <IosInstallGuide onClose={handleClose} />}
    </>
  );
}
