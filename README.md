Media Peer
==========

用peerjs实现客户端之间互传文本、图片、视频

Usage
-----

安装依赖

```
$ npm install
```

开发（代码修改后自动重启）

```
$ npm run dev
```

部署

```
$ npm start
```

访问

```
http://${SERVER_NAME}:9000/
```

穿越NAT需要在同一台服务器运行[TURN server](http://turnserver.sourceforge.net/)，UDP端口`12583`、用户名`yuan`、密码`yuan`
