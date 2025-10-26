import Button from '@tailus-ui/Button';
import type { ReactNode } from 'react';
import Tooltip from '@tailus-ui/Tooltip';

export const IconLink = ({ isActive = false, children, label, link }: { isActive?: boolean; children?: ReactNode; label?: string; link: string }) => {
  return (
    <Tooltip.Provider>
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger asChild>
          <Button.Root
            href={link}
            variant={isActive ? 'outlined' : 'ghost'}
            intent="gray"
            className={isActive ? 'dark:bg-gray-500/10 dark:[--btn-border-color:theme(colors.transparent)]' : ''}
            aria-label={label}
            size="md"
          >
            <Button.Icon type="only">{children}</Button.Icon>
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Content className="z-50" sideOffset={8} align="start" side="right" fancy={false} inverted>
          {label}
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
