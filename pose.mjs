const minus = (a, b) => [a.x - b.x, a.y - b.y, a.z - b.z];
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const length = v => Math.hypot(...v);
const distance = (a, b) => length(minus(a, b));
function angle(a, b, c) {
  const u = minus(a, b), v = minus(c, b);
  return Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (length(u) * length(v) || 1)))) * 180 / Math.PI;
}

const reto = 'estendido', fechado = 'dobrado', curva = 'curvo', livre = 'livre';
function lesson(instruction, dedos, orientation = 'frente') {
  return { instruction, dedos, orientation };
}
export const lessons = {
  A: lesson('Feche a mão e mantenha o polegar ao lado do indicador.', [fechado, fechado, fechado, fechado]),
  B: lesson('Estenda e una os quatro dedos. Dobre o polegar sobre a palma.', [reto, reto, reto, reto]),
  C: lesson('Vire a mão de lado e curve os dedos. Deixe espaço entre as pontas e o polegar.', [curva, curva, curva, curva], 'perfil'),
  Ç: lesson('Forme um C e faça um pequeno tremor lateral, mantendo a abertura.', [curva, curva, curva, curva], 'movimento'),
  D: lesson('Erga o indicador. Una o polegar às pontas dos outros dedos, formando um círculo.', [reto, livre, livre, livre], 'oblíqua'),
  E: lesson('Dobre os quatro dedos e aproxime as pontas do polegar recolhido.', [fechado, fechado, fechado, fechado]),
  F: lesson('Levante médio, anelar e mínimo. Flexione o indicador e deixe o polegar por fora dele, como na foto.', [livre, reto, reto, reto]),
  G: lesson('Aponte o indicador para cima e mantenha o polegar junto dele. Dobre os outros dedos.', [reto, fechado, fechado, fechado]),
  H: lesson('Separe indicador e médio, encoste o polegar entre eles e gire o punho para fora.', [reto, livre, fechado, fechado], 'movimento'),
  I: lesson('Levante apenas o mínimo e apoie o polegar sobre os dedos dobrados.', [fechado, fechado, fechado, reto]),
  J: lesson('Erga o mínimo, desça com a ponta e faça a curva do J.', [fechado, fechado, fechado, reto], 'movimento'),
  K: lesson('Separe indicador e médio, aproxime o polegar entre eles e eleve a mão.', [reto, livre, fechado, fechado], 'movimento'),
  L: lesson('Estenda o indicador para cima e abra o polegar para o lado. Dobre os outros três dedos.', [reto, fechado, fechado, fechado]),
  M: lesson('Aponte indicador, médio e anelar juntos para baixo. Recolha o mínimo e o polegar.', [livre, livre, livre, fechado], 'baixo'),
  N: lesson('Aponte indicador e médio juntos para baixo. Recolha os demais dedos.', [livre, livre, fechado, fechado], 'baixo'),
  O: lesson('Curve os dedos e encontre a ponta do indicador com o polegar, fechando a abertura do O.', [curva, curva, curva, curva], 'oblíqua'),
  P: lesson('Oriente a mão de lado. Separe indicador e médio, com o médio mais baixo, e coloque o polegar entre eles.', [livre, livre, fechado, fechado], 'lado'),
  Q: lesson('Aponte o indicador para baixo e mantenha o polegar junto dele. Recolha os outros três dedos.', [livre, fechado, fechado, fechado], 'baixo'),
  R: lesson('Erga indicador e médio e cruze-os. Recolha os demais dedos.', [reto, reto, fechado, fechado]),
  S: lesson('Feche a mão e apoie o polegar sobre os dedos dobrados.', [fechado, fechado, fechado, fechado]),
  T: lesson('Levante médio, anelar e mínimo. Flexione o indicador e posicione o polegar por dentro dele, como na foto.', [livre, reto, reto, reto]),
  U: lesson('Erga indicador e médio, juntos e sem cruzar. Recolha os demais dedos.', [reto, reto, fechado, fechado]),
  V: lesson('Estenda o indicador e o médio e separe as pontas. Dobre os outros dedos e apoie o polegar sobre eles.', [reto, reto, fechado, fechado]),
  W: lesson('Estenda e separe indicador, médio e anelar. Recolha o mínimo com o polegar.', [reto, reto, reto, fechado]),
  X: lesson('Comece com a mão à frente do peito, mais perto da câmera. Curve o indicador em gancho. Mantenha o gancho parado até a confirmação. Depois puxe em linha reta para o peito, como ao abrir uma gaveta.', [curva, fechado, fechado, fechado], 'movimento'),
  Y: lesson('Estenda polegar e mínimo. Vire a mão com o punho seguindo a seta da referência.', [fechado, fechado, fechado, reto], 'movimento'),
  Z: lesson('Com o indicador, desenhe um Z no ar. Acompanhe as dicas de cada traço.', [reto, fechado, fechado, fechado], 'movimento')
};

const bases = [5, 9, 13, 17];
const nomes = ['indicador', 'médio', 'anelar', 'mínimo'];

export function evaluate(letter, p, image, handedness, aspecto = 1) {
  const target = lessons[letter];
  if (!target) return 'Escolha uma letra disponível.';
  if (p?.length !== 21 || image?.length !== 21 ||
      !p.every(v => v && [v.x,v.y,v.z].every(Number.isFinite)) ||
      !image.every(v => v && Number.isFinite(v.y))) return 'Mostre uma mão inteira dentro do quadro.';
  const palm = distance(p[5], p[17]);
  if (!(palm > 0.015)) return 'Mostre a mão inteira à câmera.';
  const axis = minus(p[5], p[17]).map(n => n / palm);
  const gap = (a,b) => distance(p[a],p[b]) / palm;
  const lateral = (a,b) => dot(minus(p[a],p[b]),axis) / palm;
  const outward = lateral(4,5);
  const a = minus(p[5], p[0]), b = minus(p[17], p[0]);
  const normalZ = a[0] * b[1] - a[1] * b[0];
  const facing = (handedness === 'Right' ? -1 : 1) * normalZ / (length(a) * length(b) || 1);
  if (target.orientation === 'frente' && facing < 0.19) return 'Vire a palma para a câmera, como na referência.';
  if (target.orientation === 'perfil' && Math.abs(facing) > 0.53) return 'Gire um pouco a mão para mostrar a abertura de lado.';
  if (['frente','perfil','oblíqua'].includes(target.orientation) &&
     (image[9].y >= image[0].y || Math.abs(p[9].x-p[0].x) > (target.orientation === 'frente' ? 0.92 : 1.6)*Math.abs(p[9].y-p[0].y)))
    return 'Mantenha o punho embaixo e os dedos voltados para cima.';

  for (const [i,base] of bases.entries()) {
    const bend = angle(p[base], p[base+1], p[base+3]);
    const wanted = target.dedos[i];
    if (wanted === reto && bend < 145) return 'Estenda o dedo ' + nomes[i] + '.';
    if (wanted === fechado && bend > 125) return 'Dobre o dedo ' + nomes[i] + '.';
    if (letter === 'X' && i === 0) {
      const dobra = Math.min(bend, angle(p[6],p[7],p[8]));
      if (dobra > 160 || gap(8,0) < 0.72)
        return 'Recolha os outros três dedos e deixe o indicador em gancho, um pouco acima deles.';
      continue;
    }
    if (wanted === curva && (bend < 45 || bend > 165)) return 'Curve suavemente o dedo ' + nomes[i] + '.';
  }

  const crossed = lateral(8,12) < -0.015;
  const thumbRecolhido = 'Recolha o polegar sobre os dedos dobrados.';
  switch (letter) {
    case 'A':
      if (outward < -0.12) return 'Apoie o polegar ao lado do indicador.';
      if (outward > 0.58 || gap(4,6) > 0.76) return 'Aproxime o polegar da lateral do indicador.';
      if (p[4].y > p[3].y + 0.05*palm) return 'Aponte o polegar para cima.';
      break;
    case 'B':
      for (const [a,b] of [[8,12],[12,16],[16,20]]) {
        if (Math.abs(lateral(a,b)) > 0.45) return 'Aproxime os dedos vizinhos, mantendo os quatro estendidos.';
      }
      if (outward > -0.08 || gap(4,9) > 0.90) return 'Dobre o polegar sobre a palma.';
      break;
    case 'Ç':
    case 'C':
      if (gap(4,8) < 0.46) return 'Abra espaço entre o polegar e o indicador para formar o C.';
      if (gap(4,8) > 1.45) return 'Curve os dedos um pouco mais.';
      break;
    case 'D': {
      const pontas = [12,16,20];
      const naTela = (i,j) => Math.hypot((image[i].x-image[j].x)*aspecto,image[i].y-image[j].y);
      const escala = Math.max(naTela(0,9),naTela(5,17));
      const contato3D = pontas.every(i => gap(4,i) <= 0.62);
      const contatoVisivel = escala > 0 && pontas.every(i => naTela(4,i) <= 0.27*escala) &&
        image[4].y-image[8].y > 0.45*escala &&
        pontas.every(i => naTela(i-2,4) > 0.30*escala);
      if (!contato3D && !contatoVisivel) return 'Mantenha o indicador para cima e aproxime as pontas dos outros dedos do polegar.';
      if (gap(4,8) < 0.65) return 'Mantenha o indicador erguido acima do círculo.';
      break;
    }
    case 'E':
      if (Math.max(gap(4,8),gap(4,12),gap(4,16)) > 0.68 ||
          p[4].y < p[8].y - 0.05*palm) return 'Aproxime o polegar das pontas dobradas, por baixo delas.';
      break;
    case 'F':
    case 'T':
      break;
    case 'H':
    case 'K':
      if (gap(8,12)<0.40 || gap(12,9)<0.65) return 'Separe e alongue o indicador e o médio.';
      if (Math.min(gap(4,6),gap(4,10))>0.65) return 'Aproxime o polegar dos dois dedos.';
      break;
    case 'Y':
      if (outward<0.24) return 'Abra o polegar mantendo o mínimo estendido.';
      break;
    case 'J':
    case 'I':
      if (outward > 0.08) return thumbRecolhido;
      break;
    case 'L':
      if (outward < 0.39 || angle(p[8],p[5],p[4]) < 53) return 'Abra o polegar para o lado, formando um L.';
      break;
    case 'M':
    case 'N': {
      const active = letter === 'M' ? [5,9,13] : [5,9];
      for (const base of active) {
        if (p[base+3].y-p[base+1].y < 0.20*palm || p[base+3].y-p[base].y < 0.15*palm)
          return 'Aponte o ' + nomes[bases.indexOf(base)] + ' para baixo, como na referência.';
      }
      if (letter === 'N' && p[16].y-p[13].y >= 0.15*palm) return 'Recolha o anelar, deixando só dois dedos para baixo.';
      if (Math.abs(lateral(8,12)) > 0.48 || (letter === 'M' && Math.abs(lateral(12,16)) > 0.48))
        return 'Aproxime os dedos que apontam para baixo.';
      if (outward > 0.30) return 'Recolha o polegar junto à mão.';
      break;
    }
    case 'O': {
      const naTela = (i,j) => Math.hypot((image[i].x-image[j].x)*aspecto,image[i].y-image[j].y);
      const referencia = Math.max(naTela(0,9),naTela(5,17));
      const contatoVisivel = referencia > 0 && naTela(4,8) <= 0.25*referencia &&
                             naTela(4,12) <= 0.40*referencia &&
                             naTela(6,4) > 0.36*referencia;
      const contato3D = gap(4,8) <= 0.38 && gap(4,12) <= 0.62;
      if (!contato3D && !contatoVisivel)
        return 'Aproxime as pontas do indicador e do polegar até fechar o O.';
      break;
    }
    case 'P':
      if (Math.abs(p[8].x-p[5].x) < 0.43*palm ||
          Math.abs(p[8].y-p[5].y) > Math.abs(p[8].x-p[5].x))
        return 'Aponte o indicador na horizontal, para a esquerda ou direita da tela.';
      if (p[12].y-p[8].y < 0.23*palm || gap(8,12) < 0.45)
        return 'Separe o indicador e o médio, deixando o médio mais baixo.';
      if (Math.min(gap(4,6),gap(4,10)) > 0.75) return 'Aproxime o polegar do espaço entre os dois dedos.';
      break;
    case 'R':
      if (!crossed) return 'Cruze o indicador e o médio até inverter a ordem das pontas.';
      if (outward > 0.08) return thumbRecolhido;
      break;
    case 'S':
      if (outward >= -0.12 || gap(4,10) > 0.85 || p[4].y >= p[8].y - 0.05*palm)
        return 'Apoie o polegar por cima dos dedos fechados.';
      break;
    case 'U':
      if (crossed || lateral(8,12) > 0.34) return 'Mantenha indicador e médio juntos, sem cruzá-los.';
      if (outward > 0.08) return thumbRecolhido;
      break;
    case 'V':
      if (crossed || gap(8,12) < 0.43 || lateral(8,12) <= 0.34) return 'Separe mais as pontas do indicador e do médio.';
      if (outward > 0.08) return thumbRecolhido;
      break;
    case 'W':
      if (lateral(8,12) < 0.26 || lateral(12,16) < 0.26) return 'Separe um pouco os três dedos estendidos.';
      if (gap(4,20) > 0.70) return 'Apoie o polegar sobre o mínimo dobrado.';
      break;
  }
  return null;
}



