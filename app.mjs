import { HandLandmarker, FilesetResolver } from './vendor/vision_bundle.mjs';
import { evaluate, lessons } from './pose.mjs';

import { MovimentoZ } from './movimento-z.mjs';

import { MovimentoGuiado, medirMao, guias } from './movimentos.mjs';
const guiado = new MovimentoGuiado();
const movimentoZ = new MovimentoZ();
const $ = id => document.getElementById(id);
const video = $('video'), canvas = $('overlay'), ctx = canvas.getContext('2d');
const letters = Object.keys(lessons);
const buttons = letters.map(value => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.letter = value;
  button.textContent = value;
  $('letters').append(button);
  return button;
});
const completed = new Set();
let letter = 'L', stream, detector, loading, frame, advance, lastVideo = -1;
let holding = null, lastSample = null, confirmed = false, active = false, attempt = 0;
const paths = [[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];

function hint(message) {
  if ($('hint').textContent !== message) $('hint').textContent = message;
}
function select(value) {
  guiado.reiniciar();
  movimentoZ.reiniciar();
  $('hold').setAttribute('aria-label', (value === 'Z' || guias[value]) ? 'Etapas concluídas' : 'Tempo com a pose reconhecida');
  clearTimeout(advance);
  confirmed = false;
  $('review').hidden = true;
  holding = null;
  lastSample = null;
  $('hold').value = 0;
  letter = value;
  $('big').textContent = value;
  $('target').textContent = 'Letra ' + value;
  $('instruction').textContent = lessons[value].instruction;
  $('photo').dataset.pose = value;
  $('photo').setAttribute('aria-label',value === 'Ç' ? 'Posição inicial do Ç: mão em C' : 'Mão formando a letra ' + value + ' no alfabeto do INES');
  buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.letter === value)));
  $('next').hidden = true;
  hint(active ? 'Mostre a mão na orientação da referência.' : 'Ative a câmera para começar.');
}
buttons.forEach(b => b.onclick = () => select(b.dataset.letter));
function updateCount() {
  $('count').textContent = completed.size + ' de ' + letters.length + ' concluídas';
  buttons.forEach(b => b.textContent = b.dataset.letter + (completed.has(b.dataset.letter) ? ' ✓' : ''));
}
$('next').onclick = () => { completed.clear(); updateCount(); select(letters[0]); };
function draw(points, good) {
  const w = canvas.width, h = canvas.height;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = good ? '#c5ff85' : '#6ef3dd';
  ctx.lineWidth = Math.max(2,w/320);
  for (const path of paths) {
    if (precisaConferirPolegar() && (path.includes(4) || path.includes(8))) continue;
    ctx.beginPath();
    path.forEach((id,i) => { const p = points[id]; if(i) ctx.lineTo(p.x*w,p.y*h); else ctx.moveTo(p.x*w,p.y*h); });
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  for (const [id,p] of points.entries()) {
    if (precisaConferirPolegar() && id >= 1 && id <= 8) continue;
    ctx.beginPath(); ctx.arc(p.x*w,p.y*h,w/200,0,2*Math.PI); ctx.fill(); }
}
function precisaConferirPolegar() {
  return letter === 'F' || letter === 'T';
}
function atualizarTentativa(issue, now) {
  if (issue || (lastSample !== null && now-lastSample > 450)) holding = null;
  if (!issue && holding === null) holding = now;
  const progress = holding === null ? 0 : Math.min(1,(now-holding)/850);
  $('hold').value = progress;
  const conferir = progress === 1 && precisaConferirPolegar();
  $('review').hidden = !conferir;
  if (conferir) {
    hint(letter === 'F'
      ? 'Confira na foto do F se o polegar está por fora do indicador. Se estiver, confirme.'
      : 'Confira na foto do T se o polegar está por dentro do indicador. Se estiver, confirme.');
  } else {
    hint(issue || 'Isso! Mantenha a posição por um instante.');
    if (progress === 1) confirmPose();
  }
}
$('review').onclick = () => {
  if (active && !confirmed && precisaConferirPolegar() && !$('review').hidden &&
      lastSample !== null && performance.now() - lastSample <= 450) confirmPose();
};
function confirmPose() {
  $('review').hidden = true;
  confirmed = true;
  completed.add(letter);
  updateCount();
  const next = Object.keys(lessons).find(key => !completed.has(key));
  if (next) {
    hint(letter + (precisaConferirPolegar() ? ' conferido!' : ' reconhecido!') + ' A próxima letra é ' + next + '.');
    advance = setTimeout(() => select(next), 1800);
  } else {
    hint('Você concluiu todos os exercícios.');
    $('next').textContent = 'Praticar novamente';
    $('next').hidden = false;
  }
}
function praticarZ(issue, hand, now) {
  if (issue) {
    if (movimentoZ.ultimoTempo !== null && now - movimentoZ.ultimoTempo > 1500) movimentoZ.reiniciar();
    $('hold').value = movimentoZ.etapa/3;
    hint(issue);
    return;
  }
  const ponto = id => ({x: hand[id].x*canvas.width, y: hand[id].y*canvas.height});
  const punho = ponto(0), base = ponto(9), indicador = ponto(5), minimo = ponto(17);
  const escala = Math.max(Math.hypot(punho.x-base.x,punho.y-base.y),
                          Math.hypot(indicador.x-minimo.x,indicador.y-minimo.y));
  const dica = movimentoZ.observar(ponto(8), escala, now);
  ctx.beginPath();
  movimentoZ.rastro.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y));
  ctx.strokeStyle = '#ffcf61';
  ctx.lineWidth = Math.max(3,canvas.width/160);
  ctx.stroke();
  $('hold').value = movimentoZ.etapa/3;
  if (movimentoZ.etapa === 3) confirmPose();
  else hint(dica);
}
function praticarMovimento(issue, hand, world, now) {
  if (issue) {
    guiado.estavel = null;
    if (letter === 'X') guiado.reiniciar();
    if (guiado.ultimo !== null && now - guiado.ultimo > 1500) guiado.reiniciar();
    $('hold').value = guiado.etapa / guias[letter].length;
    hint(issue);
    return;
  }
  const medidas = medirMao(hand, world, canvas.width, canvas.height);
  const progresso = guiado.observar(letter, medidas, now);
  $('hold').value = progresso;
  if (progresso >= 1) confirmPose();
  else hint(guiado.dica(letter));
}
function processFrame(now) {
  if (!active) return;
  if (video.readyState >= 2 && lastVideo !== video.currentTime) {
    lastVideo = video.currentTime;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    try {
      const result = detector.detectForVideo(video, now);
      const hand = result.landmarks[0], world = result.worldLandmarks[0];
      const issue = hand && world ? evaluate(letter,world,hand,result.handedness[0]?.[0]?.categoryName,canvas.width/canvas.height) : 'Mostre uma mão inteira dentro do quadro.';
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if (hand) draw(hand,!issue);
      if (!confirmed) {
        if (letter === 'Z') praticarZ(issue, hand, now);
        else if (guias[letter]) praticarMovimento(issue, hand, world, now);
        else atualizarTentativa(issue, now);
      }
      lastSample = now;
    } catch (error) { console.error(error); stop('O rastreamento foi interrompido. Ative a câmera novamente.'); return; }
  }
  frame = requestAnimationFrame(processFrame);
}
function stop(message) {
  attempt++;
  active = false;
  cancelAnimationFrame(frame);
  clearTimeout(advance);
  if (stream) for (const track of stream.getTracks()) { track.onended = null; track.stop(); }
  video.srcObject = null;
  stream = null;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  $('stage').classList.remove('live');
  $('start').disabled = false;
  $('empty').hidden = false;
  $('stop').hidden = true;
  $('status').textContent = 'Desligada';
  select(letter);
  if (message) hint(message);
}
async function loadModel() {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) throw new Error('webgl');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  const files = await FilesetResolver.forVisionTasks('./vendor/wasm');
  return HandLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'./vendor/hand_landmarker.task'},runningMode:'VIDEO',numHands:1});
}
async function start() {
  const token = ++attempt;
  $('start').disabled = true;
  $('status').textContent = 'Iniciando';
  hint('Permita o acesso à webcam no navegador.');
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
    const local = await navigator.mediaDevices.getUserMedia({audio:false,video:{width:{ideal:640},height:{ideal:480},facingMode:'user'}});
    if (token !== attempt) { local.getTracks().forEach(t=>t.stop()); return; }
    stream = local;
    stream.getVideoTracks()[0].onended = () => stop('A câmera foi desconectada. Reconecte-a e tente novamente.');
    video.srcObject = stream;
    await video.play();
    if (token !== attempt) return;
    hint('Carregando o reconhecimento no dispositivo…');
    loading ??= loadModel().catch(e => { loading = null; throw e; });
    detector = await loading;
    if (token !== attempt) return;
    active = true;
    lastVideo = -1;
    $('empty').hidden = true;
    $('stop').hidden = false;
    $('stage').classList.add('live');
    $('status').textContent = 'Ao vivo';
    select(letter);
    frame = requestAnimationFrame(processFrame);
  } catch (error) {
    if (token !== attempt) return;
    const messages = {NotAllowedError:'O navegador bloqueou a câmera. Permita o acesso nas configurações deste site e tente novamente.',NotFoundError:'Nenhuma webcam encontrada. Conecte a câmera e tente novamente.',NotReadableError:'A webcam está indisponível. Feche outro aplicativo que esteja usando a câmera e tente novamente.'};
    console.error(error);
    if (error.message === 'webgl') {
      stop('O navegador precisa de WebGL 2. Ative a aceleração gráfica no Chrome ou Edge e reabra o navegador.');
      return;
    }
    stop(messages[error.name] || 'Não foi possível iniciar. Abra no Chrome ou Edge pela opção INICIAR_WINDOWS ou pelo link HTTPS do projeto.');
  }
}
$('start').onclick = start;
$('stop').onclick = () => stop();
window.addEventListener('pagehide', () => stop());
document.addEventListener('visibilitychange', () => { if(document.hidden){guiado.reiniciar();movimentoZ.reiniciar();holding = null;lastSample = null;$('review').hidden = true;} });


updateCount();
select(letter);



