module.exports = {
    content: [
      './src/**/*.{js,jsx,ts,tsx}',
    ],
    safelist: [
      // Adicione todas as classes dinâmicas que você está usando
      { pattern: /h-\[.+\]/ },
      { pattern: /w-\[.+\]/ },
      { pattern: /mt-\[.+\]/ },
      { pattern: /mb-\[.+\]/ },
      { pattern: /top-\[.+\]/ },
      { pattern: /bottom-\[.+\]/ },
      { pattern: /right-\[.+\]/ },
      'bg-opacity-60',
      'bg-opacity-20',
      'bg-opacity-70',
      'bg-opacity-10',
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }