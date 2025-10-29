export function buildBracket(athletes: string[]) {
  // acha slots como potência de 2
  const slots = Math.pow(2, Math.ceil(Math.log2(athletes.length)));

  // normaliza primeira fase
  const normalized = [...athletes];
  while (normalized.length < slots) {
    normalized.push('W.O.');
  }

  // gera lutas da primeira fase
  const firstPhase: [string, string][] = [];
  for (let i = 0; i < normalized.length; i += 2) {
    firstPhase.push([normalized[i], normalized[i + 1]]);
  }

  // gera lutas das fases seguintes (em branco)
  const rounds: [string, string][][] = [firstPhase];
  let fights = firstPhase.length;
  while (fights > 1) {
    fights = fights / 2;
    const emptyFights: [string, string][] = Array.from(
      { length: fights },
      () => ['_____', '_____'],
    );
    rounds.push(emptyFights);
  }

  return rounds;
}
