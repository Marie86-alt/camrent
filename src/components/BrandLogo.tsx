import { Image, View } from 'react-native';

type Props = {
  variant?: 'full' | 'compact' | 'mini' | 'xs';
  dark?: boolean;
};

export function BrandLogo({ variant = 'full' }: Props) {
  const width = variant === 'xs' ? 90 : variant === 'mini' ? 178 : variant === 'compact' ? 142 : 220;
  const height = variant === 'xs' ? 32 : variant === 'mini' ? 54 : variant === 'compact' ? 50 : 78;

  return (
    <View
      className="items-center justify-center"
      style={variant === 'mini' || variant === 'xs' ? { alignSelf: 'flex-start' } : undefined}
    >
      <Image
        resizeMode="contain"
        source={
          variant === 'mini'
            ? require('../../assets/logo-login.png')
            : require('../../assets/logo-transparent.png')
        }
        style={{ width, height }}
      />
    </View>
  );
}
