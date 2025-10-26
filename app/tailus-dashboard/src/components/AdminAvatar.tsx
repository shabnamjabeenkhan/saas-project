import { MESCHAC_AVATAR } from './../const';
import Avatar from '@tailus-ui/Avatar';
import { type AvatarRootProps, type AvatarFallbackProps } from '@tailus/themer';

const intents: AvatarFallbackProps['intent'][] = ['primary', 'success', 'warning', 'danger', 'warning', 'info', 'gray', 'accent', 'secondary'];

export const AdminAvatar = ({
  src = MESCHAC_AVATAR,
  size = 'xxs',
  initial = 'MI',
}: {
  src?: string;
  size?: AvatarRootProps['size'];
  initial?: string;
}) => {
  const randomIntent = intents[Math.floor(Math.random() * intents.length)];

  return (
    <Avatar.Root size={size}>
      <Avatar.Image src={src} loading="lazy" alt="User Avatar" width={120} height={120} />
      <Avatar.Fallback intent={randomIntent} children={initial} />
    </Avatar.Root>
  );
};
