declare module 'react-native-webview' {
  import type { StyleProp, ViewStyle } from 'react-native';
  import type { Component, Ref } from 'react';

  export interface WebViewMessageEvent {
    nativeEvent: { data: string };
  }

  export interface WebViewProps {
    source?: { html?: string; uri?: string };
    scrollEnabled?: boolean;
    style?: StyleProp<ViewStyle>;
    originWhitelist?: string[];
    onMessage?: (event: WebViewMessageEvent) => void;
    ref?: Ref<WebView>;
  }

  export class WebView extends Component<WebViewProps> {
    render(): JSX.Element;
  }
}
