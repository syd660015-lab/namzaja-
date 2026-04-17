import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    files: ['**/*.rules'],
    languageOptions: {
      parser: firebaseRulesPlugin.parser,
    },
    plugins: {
      'firebase-rules': firebaseRulesPlugin,
    },
    rules: {
      ...firebaseRulesPlugin.configs.recommended.rules,
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'firebase-applet-config.json'],
  }
];
