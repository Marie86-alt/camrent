import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  onSignature: (base64: string) => void;
  onClear: () => void;
  onEmpty: () => void;
};

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-user-select:none;user-select:none}
body{background:#fff;font-family:-apple-system,system-ui,sans-serif;overflow:hidden}
.wrapper{position:relative;margin:10px 10px 6px;border:1.5px dashed #cbd5e1;border-radius:12px;overflow:hidden;background:#fafafa}
canvas{display:block;width:100%;height:170px;touch-action:none;cursor:crosshair}
.hint{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#cbd5e1;font-size:13px;pointer-events:none;white-space:nowrap}
.line{position:absolute;bottom:32px;left:12%;right:12%;height:1px;background:#e2e8f0;pointer-events:none}
.row{display:flex;gap:8px;padding:6px 10px 10px}
button{flex:1;padding:9px 0;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer}
.btn-clear{background:#f1f5f9;color:#64748b}
.btn-ok{background:#3B63D4;color:#fff}
</style>
</head>
<body>
<div class="wrapper">
  <canvas id="c"></canvas>
  <div class="hint" id="hint">Signez ici avec votre doigt</div>
  <div class="line"></div>
</div>
<div class="row">
  <button class="btn-clear" onclick="clearSig()">Effacer</button>
  <button class="btn-ok" onclick="confirmSig()">Valider la signature</button>
</div>
<script>
const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
const hint=document.getElementById('hint');
let drawing=false,empty=true;

function setup(){
  const ratio=window.devicePixelRatio||1;
  canvas.width=canvas.offsetWidth*ratio;
  canvas.height=canvas.offsetHeight*ratio;
  ctx.scale(ratio,ratio);
  ctx.strokeStyle='#0f172a';
  ctx.lineWidth=2.5;
  ctx.lineCap='round';
  ctx.lineJoin='round';
}
setup();
window.addEventListener('resize',setup);

function pos(e){
  const r=canvas.getBoundingClientRect();
  const t=e.touches?e.touches[0]:e;
  return[t.clientX-r.left,t.clientY-r.top];
}

canvas.addEventListener('touchstart',e=>{
  e.preventDefault();drawing=true;empty=false;
  hint.style.display='none';
  const[x,y]=pos(e);ctx.beginPath();ctx.moveTo(x,y);
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  e.preventDefault();if(!drawing)return;
  const[x,y]=pos(e);ctx.lineTo(x,y);ctx.stroke();
},{passive:false});
canvas.addEventListener('touchend',()=>{drawing=false;});
canvas.addEventListener('mousedown',e=>{
  drawing=true;empty=false;hint.style.display='none';
  const[x,y]=pos(e);ctx.beginPath();ctx.moveTo(x,y);
});
canvas.addEventListener('mousemove',e=>{
  if(!drawing)return;const[x,y]=pos(e);ctx.lineTo(x,y);ctx.stroke();
});
canvas.addEventListener('mouseup',()=>{drawing=false;});

function clearSig(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  empty=true;hint.style.display='';
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'clear'}));
}

function confirmSig(){
  if(empty){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'empty'}));
    return;
  }
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'signature',data:canvas.toDataURL('image/png')}));
}
</script>
</body>
</html>`;

export function SignaturePad({ onSignature, onClear, onEmpty }: Props) {
  const webViewRef = useRef<WebView>(null);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: HTML }}
        scrollEnabled={false}
        style={styles.webview}
        originWhitelist={['*']}
        onMessage={(event: { nativeEvent: { data: string } }) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data) as {
              type: 'signature' | 'clear' | 'empty';
              data?: string;
            };
            if (msg.type === 'signature' && msg.data) onSignature(msg.data);
            else if (msg.type === 'clear') onClear();
            else if (msg.type === 'empty') onEmpty();
          } catch {
            // ignore parse errors
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
