import { useEffect, useRef } from 'react';
import styles from './FlowersModal.module.scss';

interface FlowersModalProps {
  onClose: () => void;
}

export function FlowersModal({ onClose }: FlowersModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Kwiaty dla Ali"
        onClick={(event) => event.stopPropagation()}
      >
        <button ref={closeButtonRef} type="button" className={styles.close} onClick={onClose} aria-label="Zamknij">
          ✕
        </button>

        <img src="/images/flowers-bouquet.svg" alt="Bukiet kwiatów" className={styles.image} width={400} height={400} />

        <p className={styles.caption}>Dla Ali 🌸</p>
      </div>
    </div>
  );
}
