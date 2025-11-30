import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // 确保代码中的 process.env.API_KEY 在构建时被替换为环境变量的值
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // 防止其他 process.env 引用报错（如果是纯前端构建）
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    }
  };
});