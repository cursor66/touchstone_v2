---
title: "LLM大模型智能引擎实战：SpringAI+RAG+MCP+实时搜索"
type: "resource"
series: "project"
date: 2026-10-17
summary: "SpringAI+RAG+MCP+实时搜索。"
cover: "https://child-1323116912.cos.ap-guangzhou.myqcloud.com/picture_book_library_test/images/LLM%E5%A4%A7%E6%A8%A1%E5%9E%8B%E6%99%BA%E8%83%BD%E5%BC%95%E6%93%8E%E5%AE%9E%E6%88%98%E5%B0%81%E9%9D%A2.png"
tags:
  - 随笔
status: "published"
likes: 56
comments: 9
views: 890
# downloadUrl: "https://example.com/dl/yolo26-onnx.zip"
# githubUrl: "https://github.com/example/yolo26-onnx"
---

## 目录树

```text
├── 第1章 LLM大模型智能引擎实战--课程导学
│   └── 1-1 LLM大模型智能引擎实战--课程导学
├── 第2章 初识SpringAI 项目功能与架构全解析
│   ├── 2-1 SpringAI 项目功能介绍与演示
│   └── 2-2 项目架构与SpringAI技术介绍
├── 第3章 配置高效开发环境
│   ├── 3-1 OpenJDK21与maven环境介绍
│   ├── 3-2 使用IDEA配置基础项目环境
│   ├── 3-3 数据库选型对比抉择
│   ├── 3-4 Docker安装MySql8数据库
│   ├── 3-5 数据库可视化Navicat 建库建表
│   ├── 3-6 通义灵码AI编程助手集成
│   └── 3-7 内网互通原则（私有专有网络）
├── 第4章 SpringBoot3 快速入门与配置管理
│   ├── 4-1 SpringBoot3 快速入门
│   ├── 4-2 使用Maven搭建SpringBoot3基础架构
│   ├── 4-3 SpringBoot配置文件yml的妙用
│   └── 4-4 SpringBoot多环境配置文件解耦与搭配
├── 第5章 大模型集成与高阶功能开发
│   ├── 5-1 SpringAI集成DeepSeek同步调用与系统提示词设定
│   ├── 5-2 SpringAI集成DeepSeek使用Flux流式输出
│   ├── 5-3 使用AOP切面化统计大模型调用执行时间
│   ├── 5-4 StopWatch秒表时间的优雅统计
│   ├── 5-5 使用隐藏文件.env进行大模型配置
│   └── 5-6 .env加载并集成通义千问大模型
├── 第6章 SSE实时通信与前端联调实战
│   ├── 6-1 SSE服务端推送事件原理机制剖析
│   ├── 6-2 手把手构建基于Spring的SSE服务器
│   ├── 6-3 使用H5客户端连接SSE服务端
│   ├── 6-4 连接SSE服务并发送单条消息
│   ├── 6-5 解决SSE服务调用的跨域问题
│   ├── 6-6 SSE服务群发消息给所有客户端
│   ├── 6-7 前后端SpringAI联调实现大模型流式交互
│   └── 6-8 MD转HTML优化大模型输出格式
├── 第7章 构建高效的RAG知识库系统功能
│   ├── 7-1 RAG知识库原理
│   ├── 7-2 使用Docker安装Redis作为向量库
│   ├── 7-3 在项目中配置Redis与嵌入式模型
│   ├── 7-4 上传并读取知识文档
│   ├── 7-5 自定义文本切分与向量库存储
│   ├── 7-6 根据用户提问搜索知识库
│   └── 7-7 结合大模型优化知识库内容输出
├── 第8章 SearXNG 联网搜索集成实战
│   ├── 8-1 联网搜索的基本流程以及原理
│   ├── 8-2 使用Docker安装SearXNG
│   ├── 8-3 在项目中集成SearXNG
│   ├── 8-4 构建SeraXNG的URL请求地址
│   ├── 8-5 实现OKHttp基于SearXNG的实时搜索
│   ├── 8-6 限制SearXNG搜索结果集的列表长度
│   └── 8-7 结合大模型优化实时联网搜索
├── 第9章 深入理解与实践MCP服务
│   ├── 9-1 初识MCP
│   ├── 9-2 MCP的使用场景
│   ├── 9-3 MCP 的通信机制
│   ├── 9-4 MCP服务平台的使用
│   ├── 9-5 Cursor 集成MCP工具 - 本地
│   ├── 9-6 Cursor 集成MCP服务 - 远程
│   ├── 9-7 SpringAI 集成sdtio与SSE类型MCP
│   ├── 9-8 使用SpringAI开发第一个MCP工具
│   ├── 9-9 大模型的MCP工具自动编排能力
│   ├── 9-10 开发邮件MCP工具 - 配置邮箱
│   ├── 9-11 开发邮件MCP工具 - 工具开发
│   ├── 9-12 开发邮件MCP工具 - Markdown转HTML
│   ├── 9-13 开发邮件MCP工具 - 实现大模型记忆功能
│   └── 9-14 开发邮件MCP工具 - 大模型自动匹配数据类型
├── 第10章 基于MCP的大模型与数据库交互开发
│   ├── 10-1 SpringBoot3集成MyBatisPlus
│   ├── 10-2 数据库MCP工具 - 创建商品信息
│   ├── 10-3 数据库MCP工具 - 删除商品信息
│   ├── 10-4 数据库MCP工具 - 枚举映射参数
│   ├── 10-5 数据库MCP工具 - 查询商品数据
│   └── 10-6 数据库MCP工具 - 修改商品数据
├── 第11章 云服务器部署与项目上线全流程指南
│   ├── 11-1 云服务器的采购推荐
│   ├── 11-2 安全组配置与SSH工具使用
│   ├── 11-3 云服务器配置安装OpenJDK21
│   ├── 11-4 云服务器安装Docker容器
│   ├── 11-5 Docker安装MySql8与数据表迁移
│   ├── 11-6 Docker安装Redis Stack
│   ├── 11-7 Docker安装SearXNG
│   ├── 11-8 发布项目 - 生产环境参数配置
│   ├── 11-9 发布项目 - SpringBoot3 项目打包发布
│   ├── 11-10 发布项目 - 安装配置Nginx
│   └── 11-11 发布项目 - Nginx发布前端项目
├── 第12章 多平台集成MCP服务与智能体应用
│   ├── 12-1 Cursor 集成自己的MCP服务
│   ├── 12-2 CherryStudio 集成自己的MCP服务
│   ├── 12-3 MacOS私有化部署Dify引擎
│   ├── 12-4 Windows本地私有部署Dify引擎
│   └── 12-5 Dify 工作流集成MCP服务
└── 第13章 LLM大模型智能引擎实战--课程总结
    └── 13-1 课程总结
```
关注公众号回复获取关键词：LLM大模型
![公众号](https://child-1323116912.cos.ap-guangzhou.myqcloud.com/picture_book_library_test/images/resource.png)