import { buildApp } from '@~test/mock/github-api/server';

const port = process.env.PORT ?? 3001;

const app = buildApp();
app.listen(port, (err) => {
  if (err !== undefined) {
    console.error('Error starting mock server:', err);
    process.exit(1);
  }

  console.log(`Mock server is running on http://localhost:${port}`);
});
