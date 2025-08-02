# 📧 Sistema de Backup Automático por Email

## 🎯 Funcionalidade
- **Agendamento**: Todo domingo às 8h da manhã
- **Condição**: Apenas se houver alterações de dados na semana
- **Destinatário**: Email do usuário root cadastrado no sistema
- **Anexo**: Arquivo .db com backup completo do banco

## ⚙️ Configuração

### 1. **Variável de Ambiente RESEND_API_KEY**

Para funcionar, você precisa configurar a chave da API do Resend:

1. Acesse: https://resend.com (gratuito até 3000 emails/mês)
2. Crie uma conta
3. Gere uma API Key
4. Configure no Render/VPS:

**Render:**
```
Environment Variables:
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
```

**VPS (.env):**
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
```

### 2. **Verificação**

Após deploy, verifique nos logs:
```
📅 Iniciando backup scheduler - Todo domingo às 8h
✅ Backup scheduler iniciado com sucesso!
```

## 🧪 Teste Manual

Para testar o sistema (apenas usuário root):

1. Acesse: `https://seu-dominio.com/api/backup/test`
2. Método: POST
3. Precisa estar logado como root

Ou use fetch no console do navegador:
```javascript
fetch('/api/backup/test', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

## 📊 Logs de Backup

O sistema mantém histórico na tabela `backup_log`:
- Data/hora de cada verificação
- Quantidade de mudanças detectadas
- Status do envio (sent/failed/no_changes)

## 🔧 Como Funciona

1. **Todo domingo 8h**: Sistema verifica automaticamente
2. **Detecta mudanças**: Conta alterações desde último backup
3. **Se houver mudanças**: Gera backup + envia email
4. **Se não houver**: Apenas registra no log "sem alterações"
5. **Email contém**: Resumo semanal + arquivo .db anexado

## ⚠️ Troubleshooting

**Email não chegou?**
1. Verifique se `RESEND_API_KEY` está configurada
2. Confirme que usuário root tem email válido
3. Verifique pasta de spam
4. Consulte logs do sistema

**Scheduler não iniciou?**
1. Confirme que está em produção (`NODE_ENV=production`)
2. Verifique logs na inicialização do banco
3. Restart da aplicação pode ajudar

## 📝 Estrutura do Email

```
Assunto: 📊 Backup Semanal - Sistema Financeiro IAB (DD/MM a DD/MM)

Conteúdo:
- Saudação personalizada
- Resumo de atividades da semana  
- Instruções sobre o arquivo de backup
- Orientações de segurança
```

Anexo: `iab_finance_backup_YYYY-MM-DD.db` (~50KB típico)