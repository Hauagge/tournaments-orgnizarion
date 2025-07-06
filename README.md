# Jiu-Jitsu Tournament Dashboard 🥋

[![Next.js](https://img.shields.io/badge/Next.js-13+-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-blue?logo=tailwindcss)](https://tailwindcss.com)

Aplicativo de gerenciamento de campeonatos de Jiu-Jitsu, com funcionalidades para cadastro de atletas, geração de chaves de lutas, controle de pesagem e resultados finais.

## 🌐 Descrição

Interface moderna para organização de torneios de Jiu-Jitsu, com as seguintes funcionalidades:

* Cadastro de atletas (nome, faixa, idade, peso, academia);
* Categorizacao automática baseada em idade e peso e faixa;
* Geração automática de chaves (brackets) com tratamento de W\.O.;
* Controle de pesagem com status de apto/não apto;
* Registro de lutas e marcação de vencedores;
* Resultados por categoria e ranking final;
* Armazenamento local dos dados (`localStorage`).

## 🚀 Tecnologias Utilizadas

* **Next.js 13+** (com suporte a app router);
* **React 18**;
* **TailwindCSS** para estilização;
* **Componentes customizados** para UI (tabs, cards, tabela, inputs, etc.).

## ⚙️ Instalação

```bash
git clone https://github.com/seuusuario/jiujitsu-dashboard.git
cd jiujitsu-dashboard
npm install
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 🎓 Como Usar

1. Acesse a aba **Atletas** para cadastrar os participantes;
2. A categoria é sugerida automaticamente ao preencher idade e peso;
3. Acesse **Chaves** para gerar lutas filtrando por categoria e faixa;
4. Use a aba **Pesagem** para registrar status de pesagem;
5. Marque vencedores em **Lutas** e visualize ranking final em **Resultados**.

## 🌟 Futuras Melhorias

* Integração com backend para persistência real de dados;
* Cadastro de campeonatos distintos;
* Impressão/exportação de brackets;
* Adição de cronômetro para lutas ao vivo.

## 👨‍💼 Autor

Desenvolvido por Gabirel Hauagge (https://github.com/Hauagge)

---

## 🌐 English Version

**Jiu-Jitsu Tournament Dashboard** is a simple React + Next.js based system for managing small BJJ tournaments. It includes:

* Athlete registration with auto-categorization (age/weight);
* Bracket generation with W\.O. handling;
* Weigh-in tracking and winner marking;
* Result table per category;
* All data is stored in `localStorage`.

### Run locally:

```bash
git clone https://github.com/youruser/jiujitsu-dashboard.git
cd jiujitsu-dashboard
npm install
npm run dev
```

Then go to: [http://localhost:3000](http://localhost:3000)

---

> Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests 🚀
