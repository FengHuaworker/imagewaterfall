# ImageWaterfall|瀑布流展示图片（Cloudflare Worker）

部署：

1.Fork本仓库

2.打开dash.cloudflare.com，计算（Workers），Workers和Pages

3.创建，Workers

4.导入存储库

*连接你的Github仓库

5.点击imagewaterfall

6.完成部署后，回到dash.cloudflare.com

7.存储与数据库，KV，Create Instance（创建KV命名空间）

8.（空间可以任意命名）回到dash.cloudflare.com，计算（Workers），Workers和Pages，imagewaterfall

9.点击绑定，添加绑定，KV命名空间，添加绑定，选择你刚刚创建的KV命名空间，变量名填入IMAGES，添加绑定

10.点击设置，变量和机密，添加，类型文本，变量名称ADMIN_USER，填入你的管理员用户名，变量名称ADMIN_PASS，填入你的管理员密码。

11.（因为.workers.dev在中国被ban，所以推荐绑定域名）点击域和路由，添加，自定义域

使用：

1.打开网站，右上角管理后台（或者直接在域名后方添加/admin），登录

2.输入你的图片URL（图床托管），点击添加图片即可
