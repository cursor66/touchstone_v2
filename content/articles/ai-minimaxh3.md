---
title: "minimax h3 实战"
type: "article"
series: "ai"
date: 2026-09-28
summary: "minimax h3 实战。"
cover: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20neural%20network%20visualization%20glowing%20blue%20nodes%2C%20futuristic%20technology%20art&image_size=landscape_16_9"
tags:
  - 随笔
status: "published"
likes: 192
comments: 27
views: 2150
---

# minimax h3 实战

## 模型目录
- transformer：模型的核心扩散变换器（DiT），责在去噪过程中处理视频和音频的潜在表示。
- transformer_ref：模型的核心扩散变换器（DiT），专用于参考图/视频路径（Ref2VA）的版本。
- text_encoder：负责把输入的提示词（Prompt）编码成模型能理解的特征。MiniMax-H3 使用的是 Qwen3-VL-32B 作为文本编码器。
- vae：视频 VAE。负责把视频在像素和潜在空间之间进行转换，用于生成和重建视频画面。
- audio_vae：音频 VAE。因为模型需要生成音频，所以有一个独立的音频 VAE 来处理 32kHz 立体声的编码和解码。
- scheduler/audio_scheduler：调度器。控制去噪过程，决定每一步如何从噪声中恢复出数据。音频有独立的调度器，因为音频和视频的扩散节奏（Sigma Shift）不同。

### 任务变体

- FL2VA：首尾帧生视频+音频（First/Last frame to Video+Audio）。如果你给定首帧或首尾帧图片，模型可以生成中间的视频和声音。
- Ref2VA：参考输入生视频+音频（Reference to Video+Audio）。可以接受参考图像、视频或音频片段，用来保持角色、产品的一致性，或者进行动作迁移。

注： 两个变体（FL2VA 和 Ref2VA）是独立的模型。它们各自有完整的编码器、Transformer 和 VAE，所以体积很大（每个约 144GB），不能简单地通过一个开关切换，需要分别下载和加载。

### 疑问：HuggingFace Diffusers 格式（文件夹）和ComfyUI 单文件格式（单文件）区别
- HuggingFace Diffusers 格式（文件夹）：这是一个“零件库”。它把模型拆分成 transformer/、text_encoder/、vae/ 等独立文件夹，并用 model_index.json 来索引。这种设计方便开发者单独加载或替换某个组件，节省内存，也方便在 Python 代码里灵活调用。
- ComfyUI 单文件格式（单文件）：这是一个“整机”。它把模型需要的所有关键权重（UNet、CLIP、VAE）全部打包进一个 .safetensors 文件里，并按照 ComfyUI 的命名规则重新映射了内部的键名。这样 ComfyUI 的加载器就能一次性读取所有组件，使用起来最方便。

processor/tokenizer：负责对输入内容进行预处理和分词，把原始素材转换成模型能输入的格式。

----
![公众号](https://child-1323116912.cos.ap-guangzhou.myqcloud.com/picture_book_library_test/images/wechat.png)
