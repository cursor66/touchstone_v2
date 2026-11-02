---
title: "ComfyUI linux conda 部署"
type: "article"
series: "ai"
date: 2026-10-02
summary: "ComfyUI 部署。"
cover: "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20typewriter%20with%20scattered%20papers%20and%20warm%20lamp%20light%2C%20cozy%20writing%20corner%2C%20film%20style&image_size=landscape_16_9"
tags:
  - 随笔
status: "published"
likes: 64
comments: 15
views: 500
---

# ComfyUI linux conda 部署

```
conda create -n comfyui python=3.13
conda activate comfyui
git clone https://github.com/Comfy-Org/ComfyUI.git
cd ComfyUI
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu130
pip install -r requirements.txt
pip install -r manager_requirements.txt

```
## 修改安全策略
```
vim ComfyUI/user/__manager/config.ini
# 修改下值为
security_level = normal
network_mode = personal_cloud
```

## 启动
```
python main.py --enable-manager --listen
```

