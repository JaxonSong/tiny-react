# Tiny-React
这个项目是我在阅读 "[Build your own React](https://pomb.us/build-your-own-react)" 后所做的阅读笔记。  

# 安装
```sh
pnpm install
```  

# 运行
```sh
pnpm dev
```
运行此命令会简单构建 src 目录下的源码到 dist 目录，并且对 dist 目录开启本地服务，当修改 src 目录下的任意文件后，会触发自动构建，但是需要手动刷新浏览器才能看到变化。  

# 目录结构
| 目录 | 描述 |
| :----:| :----:|
| src/ | 包含 Tiny-React 的最终实现，借助 Babel 实现对 JSX 语法的支持 |
| stepByStep/ | 详细记录 Tiny-React 每一步的实现过程和笔记，可直接打开该目录下的 index.html 运行 |  

# 说明
再次说明，Tiny-React 的实现并非我原创，这里只是做个笔记记录一下，感兴趣的话可以去看原文 "[Build your own React](https://pomb.us/build-your-own-react)"。
