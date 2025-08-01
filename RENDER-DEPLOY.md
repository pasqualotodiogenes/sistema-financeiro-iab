# 🚀 Deploy no Render - Sistema Financeiro IAB

## 📋 Configuração Corrigida

O erro de build foi corrigido movendo o Next.js de `devDependencies` para `dependencies`.

### ✅ Mudanças Realizadas

1. **package.json**: Next.js, TypeScript, PostCSS e TailwindCSS movidos para `dependencies`
2. **render.yaml**: Arquivo de configuração criado
3. **Script de build**: Adicionado `build:render` específico para o Render

## 🔧 Configuração no Render

### 1. Conecte o Repositório
- Acesse [render.com](https://render.com)
- Conecte seu repositório GitHub
- Selecione o repositório `sistema-financeiro-iab`

### 2. Configure o Serviço
- **Tipo**: Web Service
- **Nome**: sistema-financeiro-iab
- **Runtime**: Node
- **Build Command**: `npm run build:render`
- **Start Command**: `npm start`

### 3. Variáveis de Ambiente
```
NODE_ENV=production
DEFAULT_ROOT_USERNAME=admin
DEFAULT_ROOT_PASSWORD=SuaSenhaSegura123!
RENDER_DISK_MOUNT_PATH=/data
```

### 4. Disco Persistente
- **Nome**: data
- **Mount Path**: /data
- **Tamanho**: 1GB

## 🎯 Comandos para Executar

```bash
# 1. Commit das correções
git add .
git commit -m "Fix: Move Next.js to dependencies for Render deploy"
git push origin main

# 2. Deploy automático no Render
# O Render detectará as mudanças e fará o deploy automaticamente
```

## ✅ Verificação

Após o deploy:
1. Aguarde 2-3 minutos para o build completar
2. Acesse a URL fornecida pelo Render
3. Teste o login com as credenciais configuradas
4. Verifique se o banco SQLite está funcionando

## 🔍 Troubleshooting

Se ainda houver problemas:
1. Verifique os logs do build no Render
2. Confirme que todas as dependências estão em `dependencies`
3. Verifique se o arquivo `render.yaml` está no repositório
4. Teste localmente com `npm run build`

## 📞 Suporte

O sistema está configurado para funcionar perfeitamente no Render com:
- ✅ Next.js em dependencies
- ✅ Configuração de disco persistente
- ✅ Variáveis de ambiente configuradas
- ✅ Script de build otimizado 