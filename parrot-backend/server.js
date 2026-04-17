// 1. 引入你刚才安装的“工具箱”
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // 使用 promise 版本，方便用 async/await
const { createClient } = require('redis');



// 2. 初始化 Express 应用
const app = express();

// 3. 配置“中间件” (Middleware)
app.use(cors());         // 允许跨域，这样 5173 端口的 Vue 才能访问 3000 端口的 Node
app.use(express.json()); // 自动解析前端发来的 JSON 数据包

// 4. 配置 MySQL 连接池 (Pool)
// 为什么要用 Pool 而不是单一连接？因为 Pool 可以复用连接，效率更高，像排队办事一样。
const pool = mysql.createPool({
  host: '127.0.0.1:3306', // 本地数据库地址和端口
  user: 'root',           // 默认通常是 root
  password: '123456', // ⚠️ 这里请换成你真实的 MySQL 密码
  database: 'parrot_sound', // 我们之前在 MySQL 里创建的数据库名
  waitForConnections: true,
  connectionLimit: 10
});

// 5. 配置并连接 Redis
const redisClient = createClient();
redisClient.on('error', (err) => console.log('❌ Redis 连接出错:', err));

// 注意：新版 Redis 库必须手动调用 .connect()
async function connectDB() {
  await redisClient.connect();
  console.log('✅ Redis 已连接成功');
}
connectDB();


// 6. 测试接口
app.get('/api/ping', (req, res) => {
  res.json({
    code: 200,
    msg: '服务器跑得很欢快！🚀',
    time: new Date().toLocaleString()
  });
});

// 7. 启动服务器并监听 3000 端口
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`--------------------------------------`);
  console.log(`✨ 后端服务已启动: http://localhost:${PORT}`);
  console.log(`--------------------------------------`);
});

const nodemailer = require('nodemailer');

// 创建邮件传输对象 (Transporter)
// 这就像是设置快递公司的发货渠道
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // ⚠️ 如果你用的是 Outlook 邮箱，请保持这个
  port: 587,                   // 587 是常用的安全传输端口
  secure: false,               // true 代表 465 端口，false 代表其他端口
  auth: {
    user: 'service.ai@outlook.com', // 你的邮箱地址 📧
    pass: 'jdpntfaqxhzxgacm'             // ⚠️ 注意：这里填的是“应用专用密码”，不是登录密码！
  }
});

// 编写发送验证码接口
app.post('/api/send-code', async (req, res) => {
  // 1. 拿到前端传来的邮箱地址
  const { email } = req.body;
  if (!email) return res.json({ code: 400, msg: '邮箱不能为空' });

  // 2. 生成一个 6 位随机数验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 3. 核心步骤：把验证码存入 Redis 💾
    // 设置过期时间为 300 秒（5分钟），到期后 Redis 会自动删掉它
    await redisClient.set(`code:${email}`, code, { EX: 300 });

    // 4. 配置邮件内容
    const mailOptions = {
      from: '"Parrot Sound AI" <service.ai@outlook.com>', // 发件人
      to: email,                                          // 收件人
      subject: '您的注册验证码',                           // 邮件主题
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h3>欢迎加入 Parrot Sound！</h3>
          <p>您的验证码是：<strong style="color: #409eff; font-size: 20px;">${code}</strong></p>
          <p>有效期为 5 分钟，请不要把验证码告诉别人哦。</p>
        </div>
      `
    };

    // 5. 正式发送邮件
    await transporter.sendMail(mailOptions);

    // 6. 给前端一个肯定的答复
    res.json({ code: 200, msg: '验证码已发送，请查收邮箱' });

  } catch (err) {
    console.error('发送失败:', err);
    res.json({ code: 500, msg: '邮件发送失败，请稍后重试' });
  }
});