const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/src/app.module.js');

(async () => {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  const router = app.getHttpAdapter().getInstance().router;
  const routes = [];
  for (const layer of router.stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods)
        .filter((m) => m !== '_all')
        .map((m) => m.toUpperCase());
      const path = layer.route.path.replace(/\\\\/g, '/');
      routes.push(methods.map((m) => m + ' ' + path).join(' '));
    }
  }
  routes.sort().forEach((r) => console.log(r));
  await app.close();
})().catch((e) => {
  console.error('BOOT_FAIL', e.message);
  process.exit(1);
});