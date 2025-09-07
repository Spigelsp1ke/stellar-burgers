import { FC, memo } from 'react';

import styles from './modal.module.css';

import { CloseIcon } from '@zlden/react-developer-burger-ui-components';
import { TModalUIProps } from './type';
import { ModalOverlayUI } from '@ui';

export const ModalUI: FC<TModalUIProps> = memo(
  ({
    title,
    onClose,
    children,
    dataCy = 'modal',
    titleDataCy,
    overlayDataCy = 'modal-overlay'
  }) => (
    <>
      <div
        className={styles.modal}
        data-cy={dataCy}
        role='dialog'
        aria-modal='true'
        aria-label={title}
      >
        <div className={styles.header}>
          <h3
            className={`${styles.title} text text_type_main-large`}
            data-cy={titleDataCy}
          >
            {title}
          </h3>
          <button
            className={styles.button}
            type='button'
            data-cy='modal-close'
            onClick={onClose}
          >
            <CloseIcon type='primary' />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
      <div data-cy={overlayDataCy}>
        <ModalOverlayUI onClick={onClose} />
      </div>
    </>
  )
);
