# 故障排除指南 (Troubleshooting Guide)

## 🚨 常见错误及解决方案

### 1. **Missing entry-point to Worker script**

#### 🔍 **错误症状**
```bash
Error: Missing entry-point to Worker script or to assets directory
```

#### ✅ **解决方案**

**方法一：检查 wrangler.toml 配置**
```toml
name = "mastra-location-agent"
main = "src/index.ts"  # 👈 确保这行存在
compatibility_date = "2024-08-14"
```

**方法二：验证入口文件存在**
```bash
# 检查入口文件是否存在
ls -la src/index.ts

# 如果文件不存在，确认项目结构
tree src/
```

**方法三：重新初始化项目**
```bash
# 1. 克隆项目
git clone https://github.com/ashenghm/mastra-location-agent.git
cd mastra-location-agent

# 2. 安装依赖
npm install

# 3. 验证文件结构
ls -la src/

# 4. 启动开发服务器
npm run dev
```

---

### 2. **Module resolution errors**

#### 🔍 **错误症状**
```bash
Could not resolve "@mastra/core"
Could not resolve "graphql-yoga"
```

#### ✅ **解决方案**
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 检查依赖版本
npm list @mastra/core graphql-yoga

# 如果依赖不存在，手动安装
npm install @mastra/core @mastra/engine graphql-yoga
```

---

### 3. **API Keys not configured**

#### 🔍 **错误症状**
```bash
Error: IP geolocation API key not configured
Error: OpenAI API key not configured
```

#### ✅ **解决方案**

**开发环境：**
```bash
# 检查密钥是否设置
wrangler secret list

# 设置开发环境密钥
wrangler secret put IPGEOLOCATION_API_KEY
wrangler secret put OPENAI_API_KEY

# 或者设置本地环境变量
export IPGEOLOCATION_API_KEY="your_key_here"
export OPENAI_API_KEY="your_key_here"
```

**生产环境：**
```bash
# 设置生产环境密钥
wrangler secret put IPGEOLOCATION_API_KEY --env production
wrangler secret put OPENAI_API_KEY --env production
```

---

### 4. **KV Namespace errors**

#### 🔍 **错误症状**
```bash
Error: KV namespace binding "CACHE" not found
```

#### ✅ **解决方案**
```bash
# 1. 创建 KV 命名空间
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview

# 2. 更新 wrangler.toml
# 将返回的 ID 添加到配置文件中：
# [[kv_namespaces]]
# binding = "CACHE"
# preview_id = "your_preview_id"
# id = "your_production_id"
```

---

### 5. **TypeScript compilation errors**

#### 🔍 **错误症状**
```bash
TypeScript error: Cannot find module '@mastra/core'
```

#### ✅ **解决方案**
```bash
# 1. 检查 TypeScript 配置
cat tsconfig.json

# 2. 运行类型检查
npm run type-check

# 3. 如果有类型错误，修复后重新启动
npm run dev
```

---

### 6. **Network/Deployment errors**

#### 🔍 **错误症状**
```bash
Error: Failed to publish your Function
Network error during deployment
```

#### ✅ **解决方案**
```bash
# 1. 检查网络连接
curl -I https://api.cloudflare.com/

# 2. 重新登录 Cloudflare
wrangler logout
wrangler login

# 3. 检查账户权限
wrangler whoami

# 4. 重试部署
wrangler deploy --compatibility-date=2024-08-14
```

---

## 🔧 **完整的故障排除流程**

### **步骤 1：基础检查**
```bash
# 检查项目结构
tree -I node_modules

# 应该看到：
# ├── src/
# │   ├── index.ts
# │   ├── agents/
# │   ├── graphql/
# │   └── workflows/
# ├── package.json
# ├── wrangler.toml
# └── tsconfig.json
```

### **步骤 2：依赖检查**
```bash
# 检查 Node.js 版本（需要 18+）
node --version

# 检查 npm 依赖
npm list --depth=0

# 重新安装依赖（如果有问题）
rm -rf node_modules package-lock.json
npm install
```

### **步骤 3：配置检查**
```bash
# 检查 wrangler.toml
cat wrangler.toml | grep -E "(name|main|compatibility_date)"

# 检查环境变量
wrangler secret list

# 检查 KV 命名空间
wrangler kv:namespace list
```

### **步骤 4：逐步启动**
```bash
# 1. 类型检查
npm run type-check

# 2. 本地开发模式
npm run dev

# 3. 如果本地失败，尝试远程模式
wrangler dev --remote

# 4. 部署测试
wrangler deploy --dry-run
```

---

## 🚀 **快速修复脚本**

创建一个快速修复脚本 `fix.sh`：

```bash
#!/bin/bash

echo "🔧 开始故障排除..."

# 1. 检查基础环境
echo "📋 检查环境..."
node --version || echo "❌ Node.js 未安装"
npm --version || echo "❌ npm 未安装"
wrangler --version || echo "❌ Wrangler 未安装"

# 2. 检查项目文件
echo "📁 检查项目文件..."
[ -f "src/index.ts" ] && echo "✅ 入口文件存在" || echo "❌ 入口文件缺失"
[ -f "wrangler.toml" ] && echo "✅ 配置文件存在" || echo "❌ 配置文件缺失"
[ -f "package.json" ] && echo "✅ package.json 存在" || echo "❌ package.json 缺失"

# 3. 重新安装依赖
echo "📦 重新安装依赖..."
rm -rf node_modules package-lock.json
npm install

# 4. 类型检查
echo "🔍 类型检查..."
npm run type-check

# 5. 检查密钥
echo "🔑 检查 API 密钥..."
wrangler secret list

echo "✅ 故障排除完成！现在尝试: npm run dev"
```

使用方法：
```bash
chmod +x fix.sh
./fix.sh
```

---

## 📞 **获取帮助**

如果问题仍然存在：

1. **查看详细日志**：
   ```bash
   wrangler dev --verbose
   wrangler deploy --verbose
   ```

2. **检查 Cloudflare 状态**：
   - 访问：https://www.cloudflarestatus.com/

3. **社区支持**：
   - Cloudflare Discord: https://discord.gg/cloudflaredev
   - GitHub Issues: https://github.com/ashenghm/mastra-location-agent/issues

4. **官方文档**：
   - Wrangler 文档: https://developers.cloudflare.com/workers/wrangler/
   - Workers 文档: https://developers.cloudflare.com/workers/
