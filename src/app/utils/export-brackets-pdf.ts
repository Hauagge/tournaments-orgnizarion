/* eslint-disable @typescript-eslint/no-explicit-any */
import pdfMake from 'pdfmake/build/pdfmake';
import 'pdfmake/build/vfs_fonts';
import { Category } from '@/app/types';

type TableColumns = 'idx' | 'name' | 'academy' | 'age' | 'weight' | 'belt';
type Options = { landscape?: boolean; columns?: TableColumns[] };

function getBracketNames(category: Category): string[] {
  const names = (category.athletes ?? []).map((a) => a.name);
  while (names.length < 4) names.push('W.O.');
  return names.slice(0, 4);
}

function tableBody(category: Category, columns: TableColumns[]) {
  const headerRow = columns.map((c) => {
    switch (c) {
      case 'idx':
        return { text: '#', style: 'th' };
      case 'name':
        return { text: 'Nome', style: 'th' };
      case 'academy':
        return { text: 'Academia', style: 'th' };
      case 'age':
        return { text: 'Idade', style: 'th' };
      case 'weight':
        return { text: 'Peso (kg)', style: 'th' };
      case 'belt':
        return { text: 'Faixa', style: 'th' };
    }
  });

  const rows = (category.athletes ?? []).map((a, i) =>
    columns.map((c) => {
      switch (c) {
        case 'idx':
          return i + 1;
        case 'name':
          return a.name ?? '';
        case 'academy':
          return a.academy ?? '';
        case 'age':
          return a.age ?? '';
        case 'weight':
          return (a.weight ?? 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        case 'belt':
          return a.belt ?? '';
      }
    }),
  );

  return [headerRow, ...rows];
}

/** —— NOVO BLOCO “tipo HTML” (opção 2) —— */
function buildSemifinalsLikeHtmlBlock(category: Category) {
  const [a1, a2, a3, a4] = getBracketNames(category);

  const semiBox = (t1: string, t2: string, index: number) => ({
    stack: [
      {
        text: `Luta ${index}`,
        style: 'fightTitle',
        alignment: 'center',
        margin: [0, 0, 0, 4],
      },
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: t1,
                style: t1 === 'W.O.' ? 'wo' : 'team',
                alignment: 'center',
              },
            ],
            [{ text: 'VS', style: 'vs', alignment: 'center' }],
            [
              {
                text: t2,
                style: t2 === 'W.O.' ? 'wo' : 'team',
                alignment: 'center',
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) =>
            i === 0 || i === node.table.body.length ? 1 : 0.5,
          vLineWidth: () => 1,
          hLineColor: () => '#000',
          vLineColor: () => '#000',
          paddingTop: () => 8,
          paddingBottom: () => 8,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
      },
    ],
  });

  const finalBox = {
    stack: [
      {
        text: 'FINAL',
        style: 'finalTitle',
        alignment: 'center',
        margin: [0, 0, 0, 4],
      },
      {
        table: {
          widths: ['*'],
          body: [
            [{ text: 'Vencedor Luta 1', style: 'team', alignment: 'start' }],
            [{ text: 'VS', style: 'vs', alignment: 'center' }],
            [{ text: 'Vencedor Luta 2', style: 'team', alignment: 'start' }],
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) =>
            i === 0 || i === node.table.body.length ? 1.2 : 0.6,
          vLineWidth: () => 1.2,
          hLineColor: () => '#000',
          vLineColor: () => '#000',
          paddingTop: () => 10,
          paddingBottom: () => 10,
          paddingLeft: () => 12,
          paddingRight: () => 12,
        },
      },
    ],
    margin: [0, 16, 0, 0],
  };

  const thirdPlaceBox = {
    stack: [
      {
        text: 'Disputa do 3º lugar',
        style: 'finalTitle',
        alignment: 'center',
        margin: [0, 12, 0, 4],
      },
      {
        table: {
          widths: ['*'],
          body: [
            [{ text: 'Eliminado Luta 1', style: 'team', alignment: 'start' }],
            [{ text: 'VS', style: 'vs', alignment: 'center' }],
            [{ text: 'Eliminado Luta 2', style: 'team', alignment: 'start' }],
          ],
        },
        layout: {
          hLineWidth: (i: number, node: any) =>
            i === 0 || i === node.table.body.length ? 1.2 : 0.6,
          vLineWidth: () => 1.2,
          hLineColor: () => '#000',
          vLineColor: () => '#000',
          paddingTop: () => 10,
          paddingBottom: () => 10,
          paddingLeft: () => 12,
          paddingRight: () => 12,
        },
      },
    ],
  };

  const podium = {
    stack: [
      {
        text: '1: _________________________________',
        alignment: 'center',
        margin: [0, 4, 0, 4],
      },
      {
        text: '2: _________________________________',
        alignment: 'center',
        margin: [0, 4, 0, 4],
      },
      {
        text: '3: _________________________________',
        alignment: 'center',
        margin: [0, 4, 0, 4],
      },
      {
        text: '4: _________________________________',
        alignment: 'center',
        margin: [0, 4, 0, 4],
      },
    ],
    // columnGap: 16,
    margin: [0, 18, 0, 0],
    style: 'podium',
  };

  return [
    {
      text: 'SEMIFINAIS',
      style: 'sectionTitle',
      alignment: 'center',
      margin: [0, 8, 0, 10],
    },
    {
      columns: [
        { width: '48%', ...semiBox(a1, a2, 1) },
        { width: '48%', ...semiBox(a3, a4, 2) },
      ],
      columnGap: 18,
    },
    finalBox,
    thirdPlaceBox,
    podium,
  ];
}

export function exportAllBracketsPdf(
  categories: Category[],
  opts: Options = {},
) {
  if (!categories?.length) return;
  const columns = opts.columns ?? [
    'idx',
    'name',
    'academy',
    'age',
    'weight',
    'belt',
  ];

  const content: any[] = [];

  categories.forEach((category, pageIdx) => {
    // Cabeçalho da categoria
    content.push(
      { text: `${category.name}`, style: 'categoryTitle' },
      {
        text: `ID: ${category.id ?? '-'}  •  Idade: ${
          category.ageDivision?.min ?? ''
        }–${category.ageDivision?.max ?? ''}  •  Peso: ${
          category.minWeight ?? ''
        }–${category.maxWeight ?? ''} kg`,
        style: 'categoryMeta',
        margin: [0, 0, 0, 10],
      },
    );

    // Tabela de atletas
    content.push(
      { text: 'Atletas', style: 'sectionTitle', margin: [0, 0, 0, 6] },
      {
        table: {
          headerRows: 1,
          widths: columns.map((c) =>
            c === 'name' || c === 'academy' ? '*' : 'auto',
          ),
          body: tableBody(category, columns),
        },
        layout: {
          hLineWidth: (i: number, node: any) =>
            i === 0 || i === node.table.body.length ? 0.6 : 0.4,
          vLineWidth: () => 0.4,
          hLineColor: () => '#DDD',
          vLineColor: () => '#EEE',
          paddingTop: () => 4,
          paddingBottom: () => 4,
          paddingLeft: () => 6,
          paddingRight: () => 6,
        },
        margin: [0, 0, 0, 12],
      },
    );

    // —— AQUI entram os blocos “tipo HTML” (opção 2) ——
    content.push(...buildSemifinalsLikeHtmlBlock(category));

    // Rodapé e quebra de página
    content.push(
      {
        text: `Total de atletas: ${category.athletes?.length ?? 0}`,
        style: 'footerText',
        margin: [0, 14, 0, 0],
      },
      pageIdx < categories.length - 1 ? { text: '', pageBreak: 'after' } : {},
    );
  });

  const docDefinition: any = {
    pageSize: 'A4',
    pageOrientation: opts.landscape ? 'landscape' : 'portrait',
    pageMargins: [28, 28, 28, 34],
    content,
    styles: {
      th: { bold: true, fontSize: 10, fillColor: '#F6F6F6' },
      categoryTitle: { fontSize: 16, bold: true },
      categoryMeta: { fontSize: 9, color: '#555' },
      sectionTitle: { fontSize: 11, bold: true },
      team: { fontSize: 11 },
      wo: { fontSize: 11, color: '#999', italics: true },
      vs: { fontSize: 11, bold: true },
      finalTitle: { fontSize: 12, bold: true },
      podium: { fontSize: 10 },
      footerText: { fontSize: 8, color: '#777' },
    },
    defaultStyle: { fontSize: 10 },
  };

  pdfMake.createPdf(docDefinition).download('categorias_semis_final.pdf');
}
