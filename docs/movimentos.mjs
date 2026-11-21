export const guias = {
  H: ['Agora gire o punho para fora, como na referência.'],
  J: ['Desça com a ponta do mínimo.', 'Faça a curva para a esquerda ou direita da tela, subindo um pouco.'],
  K: ['Agora eleve a mão mantendo a configuração.'],
  X: ['1/2 · Faça o gancho e mantenha a mão parada.', '2/2 · Gancho confirmado. Puxe em linha reta para o peito, como ao abrir uma gaveta.'],
  Y: ['Agora vire a mão com o punho, mantendo o mínimo e o polegar abertos.'],
  Ç: ['Desloque o C um pouco à direita ou à esquerda da tela.', 'Volte para o outro lado.', 'Oscile de volta, mantendo o C.']
};
const vetor = (a,b) => [a.x-b.x,a.y-b.y,a.z-b.z];
function unitario(v) {
  const norma = Math.hypot(...v);
  return v.map(x=>x/(norma || 1));
}
const produto = (a,b) => a.reduce((s,x,i)=>s+x*b[i],0);
export function medirMao(hand,world,w,h) {
  const ponto = id => ({x:hand[id].x*w,y:hand[id].y*h});
  const a=vetor(world[5],world[0]), b=vetor(world[17],world[0]);
  const normal=unitario([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]);
  const mao=ponto(9), punho=ponto(0), indicador=ponto(5), minimo=ponto(17);
  const escala=Math.max(1, Math.hypot(mao.x-punho.x,mao.y-punho.y), Math.hypot(indicador.x-minimo.x,indicador.y-minimo.y));
  const comprimentos = [5,9,13,17].map(id => {
    const base = ponto(id);
    return Math.hypot(base.x-punho.x,base.y-punho.y);
  });
  return {comprimentos, mao, ponta:ponto(20), escala, normal, eixo:unitario(vetor(world[9],world[0]))};
}
export class MovimentoGuiado {
  reiniciar() { this.inicio=null; this.etapa=0; this.ultimo=null; this.estavel=null; this.marcasX=[]; }
  constructor(){ this.reiniciar(); }
  dica(letra) {
    if (letra === 'Ç' && this.etapa > 0) {
      const sentido = this.etapa === 1 ? -this.sentido : this.sentido;
      return 'Mova o C para a ' + (sentido > 0 ? 'esquerda' : 'direita') + ' da tela.';
    }
    return guias[letra][this.etapa];
  }
  observar(letra, amostra, tempo) {
    if (this.etapa >= guias[letra].length) return 1;
    if(this.ultimo!==null && tempo-this.ultimo>1500) this.reiniciar();
    this.ultimo=tempo;
    if(!this.inicio) {
      this.inicio=amostra;
      this.inicioTempo=tempo;
      this.extremo=letra==='J'?amostra.ponta:amostra.mao;
      this.sentido=0;
    }
    const origem=this.inicio, escala=origem.escala, ponto=letra==='J'?amostra.ponta:amostra.mao;
    const dx=(ponto.x-this.extremo.x)/escala, dy=(ponto.y-this.extremo.y)/escala;
    let passou=false;
    switch(letra) {
      case 'H':
        passou=produto(origem.normal,amostra.normal)<0.61 && produto(origem.eixo,amostra.eixo)>0.42;
        break;
      case 'Y':
        passou=Math.min(produto(origem.eixo,amostra.eixo),produto(origem.normal,amostra.normal))<0.77;
        break;
      case 'K':
        passou=dy < -0.52 && Math.abs(dx)<1.25*Math.abs(dy);
        break;
      case 'X': {
        const razoes = amostra.comprimentos.map((n,i)=>n/Math.max(1,origem.comprimentos[i])).sort((a,b)=>a-b);
        const recuo = 1-(razoes[1]+razoes[2])/2;
        const alinhada = produto(origem.normal,amostra.normal)>0.80 && produto(origem.eixo,amostra.eixo)>0.82;
        if (this.etapa===0) {
          if (!alinhada || Math.hypot(dx,dy)>0.13 || Math.abs(recuo)>0.045) {
            this.inicio=this.extremo=null;
            return 0;
          }
          if (tempo-this.inicioTempo<650) return 0;
          this.etapa=1;
          this.inicio=amostra;
          this.extremo=amostra.mao;
          return 0.5;
        }
        const limites=[0.04,0.085,0.14];
        const n=this.marcasX.length;
        if (!alinhada || Math.hypot(dx,dy)>0.85 || (n && recuo<limites[n-1]-0.045)) {
          this.reiniciar();
          return 0;
        }
        if (n<2 && recuo>=limites[n+1]) { this.reiniciar(); return 0; }
        if (recuo>=limites[n]) {
          this.marcasX.push({dx,dy,recuo,tempo});
          if (n===2) {
            const reta=this.marcasX.every(m=>Math.hypot(m.dx-dx*m.recuo/recuo,m.dy-dy*m.recuo/recuo)<0.25);
            if (!reta || tempo-this.marcasX[0].tempo<120) { this.reiniciar(); return 0; }
            this.etapa=2;
            return 1;
          }
        }
        return 0.5+this.marcasX.length/6;
      }
      case 'J':
        if(this.etapa===0) passou=dy>0.45 && Math.abs(dx)<0.50;
        else if(dy>0) this.extremo=ponto;
        else passou=Math.abs(dx)>0.30 && dy < -0.12;
        break;
      case 'Ç':
        if(this.etapa===0) {
          passou=Math.abs(dx)>0.14 && Math.abs(dy)<0.28;
          if(passou) this.sentido=Math.sign(dx);
        } else {
          const direcao=this.etapa===1?-this.sentido:this.sentido;
          if(dx*direcao<0) this.extremo=ponto;
          passou=dx*direcao>0.22 && Math.abs(dy)<0.30;
        }
        break;
    }
    if(passou) {
      if(this.estavel===null) this.estavel=tempo;
      else if(tempo-this.estavel>=65) {
        this.etapa++;
        this.extremo=ponto;
        this.estavel=null;
      }
    } else this.estavel=null;
    return this.etapa/guias[letra].length;
  }
}


