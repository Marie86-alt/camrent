import { Image, View } from 'react-native';

type Props = {
  variant?: 'full' | 'compact' | 'mini';
  dark?: boolean;
};

export function BrandLogo({ variant = 'full', dark = false }: Props) {
  const width = variant === 'mini' ? 178 : variant === 'compact' ? 142 : 220;
  const height = variant === 'mini' ? 54 : variant === 'compact' ? 50 : 78;

  const containerStyle = dark
    ? variant === 'mini'
      ? { alignSelf: 'flex-start' as const }
      : {
          backgroundColor: 'rgba(255,255,255,0.94)',
          borderRadius: 12,
          paddingHorizontal: 10,
        }
    : undefined;

  return (
    <View
      className="items-center justify-center"
      style={containerStyle}
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
