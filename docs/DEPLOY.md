# Deploy `gnv-saa` lên Vercel

Hướng dẫn này mô tả cách deploy `gnv-saa` (Sun\* Annual Awards 2025) lên Vercel
với Supabase managed làm backend database + auth.

Audience: dev/devops triển khai lần đầu hoặc khi cần chuẩn bị production env.

---

## TL;DR

```bash
# 1. Supabase production
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push                       # apply migrations

# 2. Cấu hình Google OAuth trong Supabase Dashboard (xem mục 2)

# 3. Vercel
npm i -g vercel
vercel link                            # link repo vào project
# → set env vars trong Vercel Dashboard (xem mục 4)
vercel --prod                          # deploy production
```

---

## 1. Chuẩn bị Supabase production

Local Supabase (CLI + Docker) **không** deploy được — phải có project hosted riêng.

### 1.1 Tạo project

1. Vào https://supabase.com/dashboard → **New project**
2. Đặt name (vd `gnv-saa-prod`), region gần VN nhất (Singapore `ap-southeast-1`)
3. Ghi nhớ ngay sau khi tạo:
   - **Project Ref** (chuỗi dạng `xxxxxxxxxxxx` trong URL `https://xxxxxxxxxxxx.supabase.co`)
   - **anon (publishable) key** — `Project Settings → API`
   - **service_role key** — server-only, **không bao giờ** expose ra client bundle

### 1.2 Apply migrations

```bash
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

`supabase db push` sẽ apply tất cả migrations trong `supabase/migrations/*.sql` lên
remote DB. Sau khi xong, kiểm tra trong Supabase Studio (**Database → Tables**) có
đầy đủ:

- `auth_allowed_domains`, `users`
- `kudos`, `kudo_images`, `kudo_hashtags`, `kudo_likes`
- `special_days`, `secret_boxes`
- Views: `kudo_with_aggregates`, `user_kudo_stats`, `kudo_spotlight`

> **Seed data**: file seed local (`20260520000006_kudos_seed.sql`) đã được move
> ra ngoài thư mục migrations để `supabase db push` không apply lên production.
> Xem mục 8.5 để biết workflow seed local-only.

### 1.3 Domain allow-list

Sau khi migrate, thêm domain Sun\* vào `auth_allowed_domains` (migration `init_auth`
đã seed `sun-asterisk.com` — confirm row tồn tại):

```sql
select * from public.auth_allowed_domains;
-- expected: ('sun-asterisk.com', true, '...', ...)
```

Nếu cần allow domain khác, INSERT thêm row qua Supabase SQL editor (service-role).

---

## 2. Cấu hình Google OAuth

### 2.1 Tạo OAuth client trong Google Cloud Console

https://console.cloud.google.com/apis/credentials → **Create OAuth client ID** →
**Web application**.

- **Authorized JavaScript origins**:
  - `https://<YOUR_PROJECT_REF>.supabase.co`
  - `https://<YOUR_VERCEL_DOMAIN>` (vd `https://gnv-saa.vercel.app`)
  - `https://<YOUR_CUSTOM_DOMAIN>` (nếu có)

- **Authorized redirect URIs**:
  - `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`

Lưu lại **Client ID** + **Client Secret**.

### 2.2 Khai báo vào Supabase Dashboard

**Authentication → Providers → Google**:

- Enable Google
- Paste Client ID + Client Secret
- Save

**Authentication → URL Configuration**:

- **Site URL**: `https://<YOUR_VERCEL_DOMAIN>`
- **Redirect URLs** (thêm tất cả domains app sẽ chạy):
  - `https://<YOUR_VERCEL_DOMAIN>/auth/callback`
  - `https://<YOUR_CUSTOM_DOMAIN>/auth/callback` (nếu có)
  - `https://*-<YOUR_TEAM>.vercel.app/auth/callback` (cho preview deploys)

---

## 3. Link Vercel project

### 3.1 Qua CLI (khuyến nghị)

```bash
npm i -g vercel
cd /path/to/gnv-saa
vercel link
# → chọn scope (cá nhân hoặc team) + project name
```

### 3.2 Qua Dashboard

1. https://vercel.com/new → **Import Git Repository**
2. Chọn repo `gnv-saa` từ GitHub/GitLab/Bitbucket
3. Framework Preset **tự nhận Next.js** — không sửa
4. Build & Output Settings: **giữ mặc định** (Vercel detect đúng)

---

## 4. Environment variables trong Vercel

Vào **Project Settings → Environment Variables** và set cho cả ba scope
(**Production**, **Preview**, **Development** nếu cần):

| Key                             | Value                                  | Scope       | Ghi chú                                                                   |
| ------------------------------- | -------------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`          | `https://<YOUR_VERCEL_DOMAIN>`         | Prod + Prev | Bắt buộc — dùng cho OAuth callback construction                           |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://<PROJECT_REF>.supabase.co`    | Prod + Prev | Public, safe                                                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...`                   | Prod + Prev | Public, safe                                                              |
| `SUPABASE_SERVICE_ROLE_KEY`     | `sb_secret_...`                        | Prod + Prev | ⚠️ **Server-only**, không prefix `NEXT_PUBLIC_`                           |
| `NEXT_PUBLIC_EVENT_START_AT`    | `2026-12-31T18:30:00+07:00` (ISO-8601) | Prod + Prev | Build-time. Future → prelaunch gate kích hoạt; Past hoặc unset → real app |

> Sau khi đổi `NEXT_PUBLIC_*` vars phải **redeploy** vì chúng được inline ở
> build time (Vercel sẽ tự rebuild trigger nếu set qua Dashboard).

**Preview** scope nên trỏ về **Supabase dev project riêng**, không dùng chung
với production để tránh hỏng data thật khi test PR.

---

## 5. Build settings

Vercel auto-detect đúng cho project hiện tại. **Không cần `vercel.json`** trừ
khi muốn pin region (xem mục 8.3).

| Setting          | Value           | Ghi chú                                                                |
| ---------------- | --------------- | ---------------------------------------------------------------------- |
| Framework        | Next.js         | Auto-detect từ `next.config.ts`                                        |
| Build Command    | `npm run build` | Đã wrap `check:i18n` + `tsc` để fail-fast khi i18n drift hoặc TS error |
| Output Directory | `.next`         | Default                                                                |
| Install Command  | `npm install`   | Default                                                                |
| Node.js Version  | 20.x            | Đủ cho Next 16 + React 19                                              |

---

## 6. Verify post-deploy

```bash
# 1. Domain alive
curl -I https://<YOUR_DOMAIN>

# 2. CSP header gắn đúng
curl -I https://<YOUR_DOMAIN> | grep -i content-security-policy
# expected: chứa default-src 'self', không có 'unsafe-eval' (prod-only)

# 3. Auth flow
# - Mở /login → click LOGIN with Google
# - Confirm redirect đúng → /auth/callback → / (homepage)

# 4. i18n
# - Đổi locale qua switcher (VN/EN/JP) → reload không flash

# 5. Kudos live board
# - /kudos → load real DB data
# - Vercel logs KHÔNG hiện warning "kudos.live_board.fallback_to_mock"
```

---

## 7. Custom domain (optional)

1. Vercel → **Domains** → **Add** domain (vd `saa.sun-asterisk.com`)
2. Thêm DNS record theo hướng dẫn (CNAME hoặc A record)
3. Đợi SSL provision (~1 phút)
4. **Sau khi verified**, cập nhật:
   - Vercel env `NEXT_PUBLIC_SITE_URL` = `https://<custom-domain>`
   - Supabase **Site URL** + **Redirect URLs**
   - Google OAuth **Authorized JavaScript origins**
5. Redeploy

---

## 8. Gotchas + tuning

### 8.1 `force-dynamic` trên `/kudos`

`app/kudos/page.tsx` có `export const dynamic = 'force-dynamic'` → mỗi request
= 1 function invocation. Trade-off:

- **Pros**: data luôn tươi (read-mostly board, latency thấp).
- **Cons**: chi phí function invocation cao nếu traffic lớn.

Nếu cần giảm cost, đổi thành `revalidate: 30` (cache 30s):

```ts
export const revalidate = 30;
```

### 8.2 Supabase connection pool

`@supabase/ssr` không pool-aware. Production cao tải nên enable **Supavisor
session mode** (Supabase → **Database → Connection pooling**, transaction mode
port `6543`, session mode port `5432` pooler). Nếu hit limit thì swap connection
string qua pooler URL.

### 8.3 Pin region

Vercel mặc định deploy multi-region. Project có `vercel.json` pin function
region về **`sin1`** (Singapore) gần Supabase Singapore + user VN nhất.

### 8.4 Service role key safety

Trước khi push, chạy:

```bash
npm run check:bundle-secrets
```

Script này grep `.next/static/**` xem có leak `SUPABASE_SERVICE_ROLE_KEY` ra
client bundle không. Build sẽ fail nếu phát hiện.

### 8.5 Seed data workflow

File `20260520000006_kudos_seed.sql.dev` được giữ **ngoài** thư mục
`supabase/migrations/` (đặt tại `supabase/dev-seeds/`) → `supabase db push`
**không** apply lên production. Khi cần dùng local:

```bash
# Apply seed thủ công vào local DB
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -f supabase/dev-seeds/20260520000006_kudos_seed.sql.dev
```

Hoặc thêm script `npm run db:seed:dev` (đã có sẵn — xem `package.json`).

### 8.6 Migrations auto-apply qua GitHub Actions

`.github/workflows/db-migrate.yml` auto-push migrations lên Supabase mỗi khi
merge vào `main` + có thay đổi trong `supabase/migrations/**`.

Cần set GitHub repo secrets:

| Secret                  | Value                                                  |
| ----------------------- | ------------------------------------------------------ |
| `SUPABASE_ACCESS_TOKEN` | Token từ https://supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF`  | Project ref của production                             |
| `SUPABASE_DB_PASSWORD`  | DB password (Supabase → **Settings → Database**)       |

Khi run, action sẽ `supabase link` + `supabase db push --linked`. Vercel
build trigger sau đó sẽ build app với schema mới — đảm bảo migration apply
**trước** code deploy.

### 8.7 Prelaunch gate

`NEXT_PUBLIC_EVENT_START_AT` quyết định toàn site có ở chế độ prelaunch không:

- **Future date** → mọi route rewrite về `/prelaunch` (qua middleware)
- **Past date** hoặc **unset** hoặc **invalid** → real app (fail-open per FR-009)

Khi launch thật, set về past date (vd `2020-01-01T00:00:00Z`) hoặc remove env
var → redeploy.

---

## 9. Rollback

Nếu deploy mới có vấn đề:

```bash
vercel rollback     # qua CLI
# hoặc Dashboard → Deployments → ... → Promote to Production
```

**Migration rollback** phải làm thủ công — Supabase CLI không có `migration
down`. Cách an toàn: viết migration mới reverse change cũ, push tiếp.

---

## 10. Checklist trước go-live

- [ ] Supabase production project tạo + migrations applied (mục 1)
- [ ] Google OAuth client setup + Supabase URL configuration (mục 2)
- [ ] Vercel project linked (mục 3)
- [ ] 5 env vars set trong Vercel Production scope (mục 4)
- [ ] Custom domain configured + DNS verified (mục 7, optional)
- [ ] `NEXT_PUBLIC_EVENT_START_AT` set đúng (past = launch, future = prelaunch)
- [ ] GitHub secrets cho migration workflow (mục 8.6)
- [ ] Smoke tests pass: `/login` redirect → Google → `/`, `/kudos` render real data, locale switch hoạt động (mục 6)
- [ ] Lighthouse / axe scan production URL không có violation serious/critical

---

## Tham chiếu

- Spec: `.momorph/specs/MaZUn5xHXZ-sun-kudos-live-board/`
- Constitution: `.momorph/constitution.md`
- Vercel: https://vercel.com/docs
- Supabase CLI: https://supabase.com/docs/guides/cli
- Next.js deployment: https://nextjs.org/docs/app/building-your-application/deploying
