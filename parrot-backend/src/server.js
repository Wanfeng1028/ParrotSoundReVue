const { app } = require("./app");
const { env } = require("./config/env");
const { initCache, getCacheMode } = require("./services/cache");
const { initMysql, getMysqlMode } = require("./services/mysql");
const repository = require("./services/repository");

const start = async () => {
  await initCache();
  await initMysql();
  const createdAdmin = await repository.ensureDefaultAdmin({
    username: env.admin.username,
    password: env.admin.password,
  });
  app.listen(env.port, () => {
    console.log(`Parrot backend running at http://localhost:${env.port}`);
    console.log(`Cache mode: ${getCacheMode()}`);
    console.log(`MySQL mode: ${getMysqlMode()}`);
    if (createdAdmin) {
      console.log(`Default admin created: username="${createdAdmin.username}" (change password ASAP)`);
    } else {
      console.log(`Admin accounts: ${repository.getAdminStats().overview.adminCount}`);
    }
  });
};

start();
