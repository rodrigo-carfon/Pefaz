# Criar nova Landing Page — Allaser

Você vai criar uma landing page completa para um curso da Allaser.

## Antes de começar, pergunte ao usuário:

1. **Nome do curso** (ex: "Laserterapia em Feridas")
2. **Slug da LP** (nome do arquivo, ex: `feridas` → `/lps/feridas.html`)
3. **URL do produto no Odoo** (ex: `https://allasercursos.odoo.com/shop/nome-do-produto`)
4. **Status na Kommo** onde os leads devem entrar (o pipeline é sempre **ROBO**, ID `13501624`) — perguntar qual status usar ou se cria um novo
5. **Conteúdo da LP**: headline, subtítulo, módulos do programa, diferenciais, professoras, benefícios
6. **Imagens de fundo** da hero: desktop e mobile (se o usuário ainda não tiver, informar que deve salvar como `hero-[slug]-desktop.png` e `hero-[slug]-mobile.png` em `/assets/images/`)

---

## Arquitetura obrigatória

- Arquivo em `/lps/[slug].html`
- **LP autônoma**: sem `components.js`, `shared.css`, `shared.js`. Sem `#site-header` / `#site-footer`
- Todo CSS interno no `<style>` do próprio arquivo
- PHP de captura de lead em `/lps/submit-[slug].php` (um por LP, para ter tags e redirecionamentos independentes)

---

## Design system — seguir SEMPRE

### Paleta
```css
--lime:        #aebf3c;   /* acento principal — único acento, sem pink/roxo */
--lime-bright: #c8d84a;
--lime-dim:    #8a9a20;
--lime-glow:   rgba(174,191,60,0.22);
--lime-subtle: rgba(174,191,60,0.07);
--lime-border: rgba(174,191,60,0.18);
--bg:          #050507;   /* fundo principal */
--bg-mid:      #080809;   /* fundo seções alternadas */
--text:        #f4f3ee;
--text-muted:  rgba(244,243,238,0.55);
--text-dim:    rgba(244,243,238,0.32);
```

### Tipografia
- Headlines: **Playfair Display** (serif, editorial)
- Corpo e UI: **Plus Jakarta Sans**
- Botões: **Outfit** (weight 800)
- Google Fonts: incluir as 3 no `<head>`

### Botão CTA
- Fundo lime (`#aebf3c`), texto `#0a0a0a`, border-radius 99px
- Hover: lime-bright, translateY(-2px)
- **Todos os CTAs abrem o modal** — nunca linkar direto para o Odoo

### Cards / glassmorphism
- `background: rgba(255,255,255,0.03)`
- `border: 1px solid rgba(174,191,60,0.18)`
- `backdrop-filter: blur(14px)`
- Linha decorativa no topo: `linear-gradient(90deg, transparent, rgba(174,191,60,0.5), transparent)`

---

## Estrutura de seções

1. **Hero** — headline forte, subtítulo com keywords em lime, CTA, card "O que está incluído" (desktop)
2. **Dor / Problema** — cenário clínico, grid de condições, bridge de consequências
3. **Programa** — 3 módulos com checklist
4. **Diferenciais** — lado esquerdo: texto + pills; lado direito: cards com ícones
5. **Professoras** — fotos com aspect-ratio 4/5, nome, cargo em lime, bio, credenciais
6. **Benefícios** — grid de cards com ícones lime
7. **CTA Final** — glow central lime, headline editorial, trust items
8. **Sticky CTA** — barra fixa no mobile (display:none no desktop)
9. **Modal de lead** — veja seção abaixo

---

## Hero section

```css
.hero {
  height: 800px;          /* desktop fixo */
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background:
    linear-gradient(100deg,
      rgba(5,5,7,0.97) 0%, rgba(5,5,7,0.93) 30%,
      rgba(5,5,7,0.60) 50%, rgba(5,5,7,0.22) 72%,
      rgba(5,5,7,0.10) 100%),
    linear-gradient(180deg, rgba(5,5,7,0.10) 0%, transparent 25%, transparent 55%, rgba(5,5,7,0.80) 100%),
    url('/assets/images/hero-[SLUG]-desktop.png') center center / cover no-repeat;
}
```

Grid interno: `grid-template-columns: 1fr 460px` — esquerda centra o texto, direita ancora o card no fundo.

**Mobile (≤960px):** `height: auto; min-height: 100svh;` — card-col oculto, imagem mobile.  
**Mobile (≤640px):** padding `70px 20px 48px`, título ~2.1rem — tudo deve caber na primeira dobra.

---

## Modal de lead — fluxo obrigatório

**Campos:** Nome, E-mail, WhatsApp (DDD + 9 dígitos)  
**Máscara:** `19 99999-9999` (sem parênteses)  
**Validação:** 11 dígitos após strip de não-numéricos  
**Envio:** POST para `/lps/submit-[slug].php`  
**Sucesso:** tela de confirmação por 1,8s → redirect para Odoo  
**Erro de rede:** redirect direto para Odoo (não bloqueia o usuário)

Estética do modal: dark premium, borda lime, linha decorativa lime no topo, mesmo visual da hero.

---

## PHP de captura — `/lps/submit-[slug].php`

```php
define('KOMMO_TOKEN',       'SEU_TOKEN_AQUI'); // preenchido manualmente no servidor via cPanel
define('KOMMO_SUBDOMAIN',   'allasercursos');
define('KOMMO_PIPELINE_ID', 13501624);         // pipeline ROBO — fixo
define('KOMMO_STATUS_ID',   XXXXXX);           // status específico da LP
define('KOMMO_USER_ID',     14365171);         // responsável padrão
```

- Endpoint Kommo: `POST /api/v4/leads/complex` (cria lead + contato em uma chamada)
- Telefone enviado no formato `+55XXXXXXXXXXX` (E.164)
- Tag: nome do curso (ex: `'Laserterapia na Saúde da Mulher'`)
- **O token NÃO vai para o git** — arquivo é commitado com `SEU_TOKEN_AQUI`, usuário preenche manualmente no servidor via cPanel após o deploy

### Importante: após cada push que altere o submit-[slug].php
Avisar o usuário para **re-inserir o token** no servidor via cPanel, pois o push sobrescreve o arquivo.

---

## Imagens

| Arquivo | Uso |
|---|---|
| `assets/images/hero-[slug]-desktop.png` | Fundo hero desktop |
| `assets/images/hero-[slug]-mobile.png` | Fundo hero mobile (≤640px) |
| `assets/images/prof-[nome].webp` | Foto da professora (aspect-ratio 4/5) |

Naming obrigatório para evitar conflito com o FTP sync state.

---

## Responsivo — breakpoints

| Breakpoint | Comportamento |
|---|---|
| > 960px | Layout full desktop, hero 800px, card visível |
| ≤ 960px | Hero `min-height:100svh`, card-col oculto, single column |
| ≤ 640px | Imagem mobile, padding compacto, sticky CTA visível |

---

## Checklist antes de commitar

- [ ] Todos os CTAs usam `onclick="abrirModal(event)"` — nenhum linka direto para Odoo
- [ ] `submit-[slug].php` tem `SEU_TOKEN_AQUI` como placeholder (token nunca vai ao git)
- [ ] Imagens nomeadas como `hero-[slug]-desktop.png` / `hero-[slug]-mobile.png`
- [ ] LP não importa `shared.css`, `components.js` nem `shared.js`
- [ ] Todo conteúdo da hero cabe na primeira dobra no mobile
- [ ] Tag da Kommo reflete o nome correto do curso

---

## Kommo — referência rápida

| Campo | Valor |
|---|---|
| Subdomain | `allasercursos` |
| Pipeline | ROBO — ID `13501624` |
| Responsável padrão | ID `14365171` |
| Status disponíveis | ver pipeline ROBO na Kommo |
| Formato telefone | `+5511999999999` (E.164) |
| Endpoint leads | `POST /api/v4/leads/complex` |
| Auth | `Authorization: Bearer {token}` |
