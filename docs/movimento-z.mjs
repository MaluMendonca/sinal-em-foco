export class MovimentoZ {
  constructor() { this.reiniciar(); }
  reiniciar() {
    this.etapa = 0;
    this.anterior = null;
    this.rastro = [];
    this.ultimoTempo = null;
  }
  observar(ponto, escala, tempo) {
    if (this.ultimoTempo !== null && tempo - this.ultimoTempo > 1500) this.reiniciar();
    if (!this.anterior) {
      this.inicio = this.extremo = ponto;
      this.escala = Math.max(10, escala);
    }
    const unidade = this.escala;
    if (this.anterior &&
        Math.hypot(ponto.x-this.anterior.x,ponto.y-this.anterior.y) > 1.25*unidade) {
      this.reiniciar();
      return 'Reposicione a mão e comece o Z novamente.';
    }
    this.ultimoTempo = tempo;
    this.anterior = ponto;
    if (!this.rastro.length || Math.hypot(ponto.x-this.rastro.at(-1).x,ponto.y-this.rastro.at(-1).y) > unidade*0.035) {
      this.rastro.push(ponto);
      if (this.rastro.length > 400) this.rastro.shift();
    }
    if (this.etapa === 1 && this.sentido*(ponto.x-this.extremo.x)>0) this.extremo=ponto;
    if (this.etapa === 2 && this.sentido*(ponto.x-this.extremo.x)<0) this.extremo=ponto;
    const origem = this.etapa === 0 ? this.inicio : this.extremo;
    const dx = (ponto.x-origem.x)/unidade, dy = (ponto.y-origem.y)/unidade;
    let invalido = false;
    if (this.etapa === 0) {
      invalido = Math.abs(dy)>0.35;
      if (!invalido && Math.abs(dx)>=0.68) {
        this.sentido=Math.sign(dx); this.extremo=ponto; this.etapa=1;
      }
    } else if (this.etapa === 1) {
      const retorno = -dx*this.sentido;
      invalido = dy < -0.32 || (retorno>0.5 && dy<0.13) || (dy>0.55 && retorno<0.15);
      if (!invalido && retorno>=0.60 && dy>=0.42 && dy>=0.38*retorno && dy<=2*retorno) {
        this.extremo=ponto; this.etapa=2;
      }
    } else if (this.etapa === 2) {
      invalido = dx*this.sentido>0.2 && Math.abs(dy)>0.32;
      if (!invalido && dx*this.sentido>=0.65) this.etapa=3;
    }
    if (invalido) { this.reiniciar(); return 'Tente novamente. Comece pelo traço horizontal de cima.'; }
    if (this.etapa === 1) return 'Desça na diagonal para a ' + (this.sentido > 0 ? 'direita' : 'esquerda') + ' da tela.';
    if (this.etapa === 2) return 'Termine na horizontal para a ' + (this.sentido > 0 ? 'esquerda' : 'direita') + ' da tela.';
    return this.etapa === 0 ? 'Comece na horizontal, para a direita ou esquerda da tela.' : 'Z reconhecido!';
  }
}

