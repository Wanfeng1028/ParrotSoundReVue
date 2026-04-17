const { app } = require("./app");
const { env } = require("./config/env");
const { initCache, getCacheMode } = require("./services/cache");
const { initMysql, getMysqlMode } = require("./services/mysql");

const start = async () => {
  await initCache();
  await initMysql();
  app.listen(env.port, () => {
    console.log(`Parrot backend running at http://localhost:${env.port}`);
    console.log(`Cache mode: ${getCacheMode()}`);
    console.log(`MySQL mode: ${getMysqlMode()}`);
  });
};

start();
