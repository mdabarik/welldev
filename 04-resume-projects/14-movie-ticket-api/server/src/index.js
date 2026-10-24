import { app } from './app.js';

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Movie ticket API চলছে: http://localhost:${PORT}/api`);
  console.log('Demo login -> admin@demo.com / admin123   |   user@demo.com / user123');
});
